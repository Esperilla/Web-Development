const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Validar variables de entorno críticas
const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingEnvVars.join(', '));
    console.error('❌ Por favor, configura estas variables en tu archivo .env');
    process.exit(1);
}

const { initDatabase, insertSampleData } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: {
        success: false,
        message: 'Demasiadas peticiones, intenta de nuevo más tarde'
    }
});

app.use('/api/', limiter);

// Middleware básico
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));

// Ruta principal para servir la aplicación
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Rutas de la aplicación web (SPA)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/projects', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'projects.html'));
});

app.get('/projects/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'project-detail.html'));
});

// API de estado del servidor
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor ICTAM WebApp funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
    }
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    
    if (req.path.startsWith('/api/')) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    } else {
        res.status(500).send(`
            <h1>Error interno del servidor</h1>
            <p>Ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.</p>
            <a href="/">Volver al inicio</a>
        `);
    }
});

// Inicializar servidor
async function startServer() {
    try {
        // Inicializar base de datos
        console.log('🔄 Inicializando base de datos...');
        const dbConnected = await initDatabase();
        
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            process.exit(1);
        }
        
        // Insertar datos de prueba
        await insertSampleData();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('🚀 =========================================');
            console.log(`🏢 ICTAM WebApp Server`);
            console.log(`🌐 Servidor ejecutándose en: http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`🔐 Login: http://localhost:${PORT}/login`);
            console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
            console.log('🚀 =========================================');
        });
        
    } catch (error) {
        console.error('❌ Error iniciando el servidor:', error);
        process.exit(1);
    }
}

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
    console.log('🔄 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer();
