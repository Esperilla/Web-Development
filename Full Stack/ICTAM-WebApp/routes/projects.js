const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, isAdmin, canAccessProject } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los proyectos (con filtros según el rol)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, estado, search } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;
        const userRole = req.user.rol;
        
        let whereClause = '';
        let params = [];
        
        // Filtrar según el rol del usuario
        if (userRole !== 'admin') {
            whereClause = 'WHERE (p.cliente_id = ? OR p.responsable_id = ?)';
            params.push(userId, userId);
        } else {
            whereClause = 'WHERE 1=1';
        }
        
        // Filtrar por estado
        if (estado) {
            whereClause += userRole !== 'admin' ? ' AND p.estado = ?' : ' WHERE p.estado = ?';
            params.push(estado);
        }
        
        // Búsqueda por nombre
        if (search) {
            whereClause += (whereClause.includes('WHERE') ? ' AND' : ' WHERE') + ' p.nombre LIKE ?';
            params.push(`%${search}%`);
        }
        
        // Consulta principal
        const query = `
            SELECT 
                p.*,
                u_cliente.nombre as cliente_nombre,
                u_cliente.email as cliente_email,
                u_responsable.nombre as responsable_nombre,
                COUNT(s.id) as total_servicios,
                COUNT(CASE WHEN s.estado = 'completado' THEN 1 END) as servicios_completados
            FROM proyectos p
            LEFT JOIN usuarios u_cliente ON p.cliente_id = u_cliente.id
            LEFT JOIN usuarios u_responsable ON p.responsable_id = u_responsable.id
            LEFT JOIN servicios s ON p.id = s.proyecto_id
            ${whereClause}
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(parseInt(limit), offset);
        
        const [proyectos] = await pool.execute(query, params);
        
        // Contar total de proyectos
        const countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM proyectos p
            ${whereClause}
        `;
        
        const [countResult] = await pool.execute(countQuery, params.slice(0, -2));
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: proyectos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo proyectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener un proyecto específico
router.get('/:id', verifyToken, canAccessProject, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        const [proyectos] = await pool.execute(`
            SELECT 
                p.*,
                u_cliente.nombre as cliente_nombre,
                u_cliente.email as cliente_email,
                u_cliente.telefono as cliente_telefono,
                u_responsable.nombre as responsable_nombre,
                u_responsable.email as responsable_email
            FROM proyectos p
            LEFT JOIN usuarios u_cliente ON p.cliente_id = u_cliente.id
            LEFT JOIN usuarios u_responsable ON p.responsable_id = u_responsable.id
            WHERE p.id = ?
        `, [projectId]);
        
        if (!proyectos.length) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }
        
        // Obtener servicios del proyecto
        const [servicios] = await pool.execute(`
            SELECT 
                s.*,
                u.nombre as responsable_nombre
            FROM servicios s
            LEFT JOIN usuarios u ON s.responsable_id = u.id
            WHERE s.proyecto_id = ?
            ORDER BY s.created_at ASC
        `, [projectId]);
        
        // Obtener documentos del proyecto
        const [documentos] = await pool.execute(`
            SELECT 
                d.*,
                u.nombre as subido_por_nombre
            FROM documentos d
            LEFT JOIN usuarios u ON d.subido_por = u.id
            WHERE d.proyecto_id = ?
            ORDER BY d.created_at DESC
        `, [projectId]);
        
        const proyecto = {
            ...proyectos[0],
            servicios,
            documentos
        };
        
        res.json({
            success: true,
            data: proyecto
        });
        
    } catch (error) {
        console.error('Error obteniendo proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear nuevo proyecto
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            cliente_id,
            responsable_id,
            fecha_inicio,
            fecha_fin_estimada,
            presupuesto,
            prioridad = 'media',
            direccion
        } = req.body;
        
        if (!nombre || !cliente_id) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y cliente son requeridos'
            });
        }
        
        // Verificar que el cliente existe
        const [clientes] = await pool.execute(
            'SELECT id FROM usuarios WHERE id = ? AND rol = "cliente"',
            [cliente_id]
        );
        
        if (!clientes.length) {
            return res.status(400).json({
                success: false,
                message: 'Cliente no válido'
            });
        }
        
        const [result] = await pool.execute(`
            INSERT INTO proyectos (
                nombre, descripcion, cliente_id, responsable_id, 
                fecha_inicio, fecha_fin_estimada, presupuesto, 
                prioridad, direccion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nombre, descripcion, cliente_id, responsable_id,
            fecha_inicio, fecha_fin_estimada, presupuesto,
            prioridad, direccion
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Proyecto creado exitosamente',
            data: { id: result.insertId }
        });
        
    } catch (error) {
        console.error('Error creando proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar proyecto
router.put('/:id', verifyToken, canAccessProject, async (req, res) => {
    try {
        const projectId = req.params.id;
        const {
            nombre,
            descripcion,
            responsable_id,
            estado,
            fecha_inicio,
            fecha_fin_estimada,
            fecha_fin_real,
            presupuesto,
            prioridad,
            progreso,
            direccion
        } = req.body;
        
        await pool.execute(`
            UPDATE proyectos SET
                nombre = ?, descripcion = ?, responsable_id = ?,
                estado = ?, fecha_inicio = ?, fecha_fin_estimada = ?,
                fecha_fin_real = ?, presupuesto = ?, prioridad = ?,
                progreso = ?, direccion = ?, updated_at = NOW()
            WHERE id = ?
        `, [
            nombre, descripcion, responsable_id, estado,
            fecha_inicio, fecha_fin_estimada, fecha_fin_real,
            presupuesto, prioridad, progreso, direccion, projectId
        ]);
        
        res.json({
            success: true,
            message: 'Proyecto actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar proyecto (solo admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        await pool.execute('DELETE FROM proyectos WHERE id = ?', [projectId]);
        
        res.json({
            success: true,
            message: 'Proyecto eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas de proyectos
router.get('/stats/dashboard', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.rol;
        
        let whereClause = '';
        let params = [];
        
        if (userRole !== 'admin') {
            whereClause = 'WHERE (cliente_id = ? OR responsable_id = ?)';
            params.push(userId, userId);
        }
        
        // Estadísticas generales
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_proyectos,
                COUNT(CASE WHEN estado = 'en_proceso' THEN 1 END) as proyectos_activos,
                COUNT(CASE WHEN estado = 'completado' THEN 1 END) as proyectos_completados,
                COUNT(CASE WHEN estado = 'planificacion' THEN 1 END) as proyectos_planificacion,
                SUM(presupuesto) as presupuesto_total,
                AVG(progreso) as progreso_promedio
            FROM proyectos 
            ${whereClause}
        `, params);
        
        // Proyectos por estado
        const [estadosCount] = await pool.execute(`
            SELECT estado, COUNT(*) as count
            FROM proyectos 
            ${whereClause}
            GROUP BY estado
        `, params);
        
        // Proyectos recientes
        const [proyectosRecientes] = await pool.execute(`
            SELECT p.id, p.nombre, p.estado, p.progreso, u.nombre as cliente_nombre
            FROM proyectos p
            LEFT JOIN usuarios u ON p.cliente_id = u.id
            ${whereClause}
            ORDER BY p.updated_at DESC
            LIMIT 5
        `, params);
        
        res.json({
            success: true,
            data: {
                stats: stats[0],
                estados: estadosCount,
                proyectos_recientes: proyectosRecientes
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
