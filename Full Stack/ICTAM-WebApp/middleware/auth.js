const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware para verificar token JWT
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token de acceso requerido' 
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario existe y está activo
        const [users] = await pool.execute(
            'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?',
            [decoded.userId]
        );
        
        if (!users.length || !users[0].activo) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido o usuario inactivo' 
            });
        }
        
        req.user = users[0];
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};

// Middleware para verificar roles específicos
const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para acceder a este recurso' 
            });
        }
        next();
    };
};

// Middleware para verificar si es admin
const isAdmin = verifyRole(['admin']);

// Middleware para verificar si es admin o supervisor
const isAdminOrSupervisor = verifyRole(['admin', 'supervisor']);

// Middleware para verificar si puede acceder al proyecto
const canAccessProject = async (req, res, next) => {
    try {
        const projectId = req.params.id || req.body.proyecto_id;
        const userId = req.user.id;
        const userRole = req.user.rol;
        
        // Admins pueden acceder a todo
        if (userRole === 'admin') {
            return next();
        }
        
        // Verificar si el usuario tiene acceso al proyecto
        const [projects] = await pool.execute(`
            SELECT p.* FROM proyectos p 
            WHERE p.id = ? AND (
                p.cliente_id = ? OR 
                p.responsable_id = ? OR
                EXISTS (
                    SELECT 1 FROM servicios s 
                    WHERE s.proyecto_id = p.id AND s.responsable_id = ?
                )
            )
        `, [projectId, userId, userId, userId]);
        
        if (!projects.length) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes acceso a este proyecto' 
            });
        }
        
        next();
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Error verificando acceso al proyecto' 
        });
    }
};

module.exports = {
    verifyToken,
    verifyRole,
    isAdmin,
    isAdminOrSupervisor,
    canAccessProject
};
