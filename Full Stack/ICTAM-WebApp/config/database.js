const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ictam_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Función para inicializar la base de datos
async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos establecida');
        
        // Crear las tablas si no existen
        await createTables(connection);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        return false;
    }
}

// Crear tablas de la base de datos
async function createTables(connection) {
    const tables = [
        // Tabla de usuarios
        `CREATE TABLE IF NOT EXISTS usuarios (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            telefono VARCHAR(20),
            rol ENUM('admin', 'cliente', 'empleado', 'supervisor') NOT NULL DEFAULT 'cliente',
            avatar VARCHAR(255),
            activo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        
        // Tabla de proyectos
        `CREATE TABLE IF NOT EXISTS proyectos (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(200) NOT NULL,
            descripcion TEXT,
            cliente_id INT NOT NULL,
            responsable_id INT,
            estado ENUM('planificacion', 'en_proceso', 'pausado', 'completado', 'cancelado') DEFAULT 'planificacion',
            prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
            fecha_inicio DATE,
            fecha_fin_estimada DATE,
            fecha_fin_real DATE,
            presupuesto DECIMAL(15,2),
            costo_actual DECIMAL(15,2) DEFAULT 0,
            progreso INT DEFAULT 0,
            direccion TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL
        )`,
        
        // Tabla de servicios
        `CREATE TABLE IF NOT EXISTS servicios (
            id INT PRIMARY KEY AUTO_INCREMENT,
            proyecto_id INT NOT NULL,
            tipo_servicio ENUM('construccion', 'diseno', 'arquitectura', 'supervision', 'gerencia', 'auditoria', 'capital_humano', 'control_interno', 'administracion') NOT NULL,
            nombre VARCHAR(200) NOT NULL,
            descripcion TEXT,
            costo DECIMAL(12,2),
            estado ENUM('pendiente', 'en_proceso', 'completado') DEFAULT 'pendiente',
            fecha_inicio DATE,
            fecha_fin DATE,
            responsable_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
            FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL
        )`,
        
        // Tabla de tareas
        `CREATE TABLE IF NOT EXISTS tareas (
            id INT PRIMARY KEY AUTO_INCREMENT,
            servicio_id INT NOT NULL,
            nombre VARCHAR(200) NOT NULL,
            descripcion TEXT,
            estado ENUM('pendiente', 'en_proceso', 'completado') DEFAULT 'pendiente',
            prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media',
            asignado_a INT,
            fecha_vencimiento DATE,
            horas_estimadas DECIMAL(5,2),
            horas_trabajadas DECIMAL(5,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
            FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL
        )`,
        
        // Tabla de documentos
        `CREATE TABLE IF NOT EXISTS documentos (
            id INT PRIMARY KEY AUTO_INCREMENT,
            proyecto_id INT NOT NULL,
            nombre VARCHAR(255) NOT NULL,
            archivo VARCHAR(255) NOT NULL,
            tipo_documento ENUM('contrato', 'plano', 'permiso', 'reporte', 'factura', 'otro') DEFAULT 'otro',
            tamaño INT,
            subido_por INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
            FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE SET NULL
        )`,
        
        // Tabla de notificaciones
        `CREATE TABLE IF NOT EXISTS notificaciones (
            id INT PRIMARY KEY AUTO_INCREMENT,
            usuario_id INT NOT NULL,
            titulo VARCHAR(200) NOT NULL,
            mensaje TEXT NOT NULL,
            tipo ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
            leida BOOLEAN DEFAULT FALSE,
            url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )`
    ];
    
    for (const tableQuery of tables) {
        await connection.execute(tableQuery);
    }
    
    console.log('✅ Tablas de la base de datos creadas correctamente');
}

// Insertar datos de prueba
async function insertSampleData() {
    try {
        const connection = await pool.getConnection();
        
        // Verificar si ya hay datos
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
        
        if (users[0].count === 0) {
            // Insertar usuario administrador por defecto
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await connection.execute(
                'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
                ['Administrador ICTAM', 'admin@ictam.com', hashedPassword, 'admin']
            );
            
            // Insertar algunos usuarios de ejemplo
            const clientePassword = await bcrypt.hash('cliente123', 10);
            await connection.execute(
                'INSERT INTO usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?)',
                ['Juan Pérez', 'juan.perez@email.com', clientePassword, '+1234567890', 'cliente']
            );
            
            console.log('✅ Datos de prueba insertados correctamente');
            console.log('📧 Admin: admin@ictam.com | Contraseña: admin123');
            console.log('📧 Cliente: juan.perez@email.com | Contraseña: cliente123');
        }
        
        connection.release();
    } catch (error) {
        console.error('❌ Error insertando datos de prueba:', error);
    }
}

module.exports = {
    pool,
    initDatabase,
    insertSampleData
};
