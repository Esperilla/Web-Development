const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Registro de nuevo usuario
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password, telefono, rol = 'cliente' } = req.body;
        
        // Validaciones básicas
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son requeridos'
            });
        }
        
        // Verificar si el email ya existe
        const [existingUsers] = await pool.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        
        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar nuevo usuario
        const [result] = await pool.execute(
            'INSERT INTO usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, hashedPassword, telefono, rol]
        );
        
        // Generar token JWT
        const token = jwt.sign(
            { userId: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: result.insertId,
                nombre,
                email,
                rol
            }
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }
        
        // Buscar usuario por email
        const [users] = await pool.execute(
            'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (!users.length) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        const user = users[0];
        
        // Verificar si el usuario está activo
        if (!user.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo. Contacta al administrador'
            });
        }
        
        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener perfil del usuario autenticado
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, nombre, email, telefono, rol, avatar, created_at FROM usuarios WHERE id = ?',
            [req.user.id]
        );
        
        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            user: users[0]
        });
        
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar perfil del usuario
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { nombre, telefono } = req.body;
        const userId = req.user.id;
        
        await pool.execute(
            'UPDATE usuarios SET nombre = ?, telefono = ?, updated_at = NOW() WHERE id = ?',
            [nombre, telefono, userId]
        );
        
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Cambiar contraseña
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva son requeridas'
            });
        }
        
        // Obtener contraseña actual del usuario
        const [users] = await pool.execute(
            'SELECT password FROM usuarios WHERE id = ?',
            [userId]
        );
        
        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
        
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }
        
        // Encriptar nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Actualizar contraseña
        await pool.execute(
            'UPDATE usuarios SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedNewPassword, userId]
        );
        
        res.json({
            success: true,
            message: 'Contraseña cambiada exitosamente'
        });
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
