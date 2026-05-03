# ICTAM WebApp

Una aplicación web completa para la gestión de proyectos de construcción y arquitectura.

## 🚀 Características

- **Gestión de Proyectos**: Planificación, seguimiento y control de proyectos
- **Autenticación Segura**: Sistema de login con JWT
- **Dashboard Interactivo**: Visualización de estadísticas y métricas
- **Roles de Usuario**: Admin, Cliente, Empleado, Supervisor
- **API RESTful**: Backend robusto con Express.js
- **Interfaz Moderna**: UI responsiva y atractiva
- **Base de Datos**: MySQL para almacenamiento persistente

## 🛠️ Tecnologías

### Backend
- Node.js
- Express.js
- MySQL2
- JWT para autenticación
- bcryptjs para encriptación
- Helmet para seguridad

### Frontend
- HTML5 / CSS3
- JavaScript ES6+
- Chart.js para gráficos
- Font Awesome para iconos
- Inter font family

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v8 o superior)
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
cd ICTAM-WebApp
```

2. **Instalar dependencias**
```bash
npm install
```

# ICTAM WebApp

Una aplicación web completa para la gestión de proyectos de construcción y arquitectura.

## 🚀 Características

- **Gestión de Proyectos**: Planificación, seguimiento y control de proyectos
- **Autenticación Segura**: Sistema de login con JWT
- **Dashboard Interactivo**: Visualización de estadísticas y métricas
- **Roles de Usuario**: Admin, Cliente, Empleado, Supervisor
- **API RESTful**: Backend robusto con Express.js
- **Interfaz Moderna**: UI responsiva con Tailwind CSS
- **Base de Datos**: MySQL para almacenamiento persistente

## 🛠️ Tecnologías

### Backend
- Node.js
- Express.js
- MySQL2
- JWT para autenticación
- bcryptjs para encriptación
- Helmet para seguridad

### Frontend
- HTML5 / CSS3
- JavaScript ES6+
- Tailwind CSS
- Font Awesome para iconos
- Inter font family

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v8 o superior)
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
cd ICTAM-WebApp
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar base de datos**

   **Crear la base de datos en MySQL:**
   ```sql
   CREATE DATABASE ictam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Configurar variables de entorno**
   
   El archivo `.env` ya está configurado con valores por defecto. Solo necesitas ajustar:
   ```env
   DB_PASSWORD=tu_password_mysql_aqui
   ```

5. **Compilar estilos CSS**
```bash
npm run build:css
```

6. **Iniciar el servidor**
   - Crear una base de datos MySQL llamada `ictam_db`
   - Actualizar las credenciales en el archivo `.env`

4. **Configurar variables de entorno**
   - Copiar `.env.example` a `.env`
   - Actualizar las variables según tu configuración

5. **Ejecutar la aplicación**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🌐 Acceso

- **Aplicación**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Login**: http://localhost:3000/login
- **API Health**: http://localhost:3000/api/health

## 👤 Usuarios de Demostración

### Administrador
- **Email**: admin@ictam.com
- **Contraseña**: admin123

### Cliente
- **Email**: juan.perez@email.com
- **Contraseña**: cliente123

## 📊 Estructura del Proyecto

```
ICTAM-WebApp/
├── config/
│   └── database.js          # Configuración de base de datos
├── middleware/
│   └── auth.js              # Middleware de autenticación
├── models/                  # Modelos de datos (futuro)
├── routes/
│   ├── auth.js             # Rutas de autenticación
│   └── projects.js         # Rutas de proyectos
├── views/
│   ├── index.html          # Página principal
│   ├── login.html          # Página de login
│   └── dashboard.html      # Dashboard principal
├── public/
│   ├── css/
│   │   └── style.css       # Estilos principales
│   └── js/
│       ├── auth.js         # Lógica de autenticación
│       └── dashboard.js    # Lógica del dashboard
├── uploads/                # Archivos subidos
├── .env                    # Variables de entorno
├── server.js              # Servidor principal
└── package.json           # Dependencias y scripts
```

## 🔒 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil

### Proyectos
- `GET /api/projects` - Listar proyectos
- `POST /api/projects` - Crear proyecto
- `GET /api/projects/:id` - Obtener proyecto
- `PUT /api/projects/:id` - Actualizar proyecto
- `DELETE /api/projects/:id` - Eliminar proyecto
- `GET /api/projects/stats/dashboard` - Estadísticas

## 🎨 Características de la UI

- **Diseño Responsivo**: Compatible con dispositivos móviles
- **Tema Moderno**: Paleta de colores profesional
- **Animaciones Suaves**: Transiciones y efectos visuales
- **Navegación Intuitiva**: Estructura clara y fácil de usar
- **Gráficos Interactivos**: Chart.js para visualización de datos

## 🔐 Seguridad

- Encriptación de contraseñas con bcrypt
- Autenticación JWT con tokens seguros
- Validación de datos en frontend y backend
- Middleware de seguridad con Helmet
- Rate limiting para prevenir ataques
- CORS configurado apropiadamente

## 📱 Características Móviles

- Diseño completamente responsivo
- Navegación mobile-first
- Sidebar colapsable
- Botones y formularios optimizados para touch

## 🚀 Deployment

### Opción 1: VPS/Servidor Dedicado
```bash
# Instalar dependencias
npm install --production

# Configurar PM2 para producción
npm install -g pm2
pm2 start server.js --name "ictam-webapp"
pm2 startup
pm2 save
```

### Opción 2: Plataformas Cloud
- **Heroku**: Compatible con buildpack de Node.js
- **DigitalOcean App Platform**: Deploy directo desde Git
- **AWS Elastic Beanstalk**: Escalabilidad automática
- **Vercel**: Para frontend (requiere adaptación)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.