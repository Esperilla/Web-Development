// Dashboard.js - Lógica principal del dashboard
class DashboardManager {
    constructor() {
        this.charts = {};
        this.data = {};
        this.init();
    }

    async init() {
        try {
            await this.loadUserInfo();
            await this.loadDashboardData();
            this.setupEventListeners();
            this.initializeCharts();
            this.setupSidebar();
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            this.showError('Error cargando el dashboard');
        }
    }

    async loadUserInfo() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                document.getElementById('userName').textContent = user.nombre;
                document.getElementById('userRole').textContent = this.getRoleDisplayName(user.rol);
            }
        } catch (error) {
            console.error('Error cargando información del usuario:', error);
        }
    }

    getRoleDisplayName(role) {
        const roles = {
            'admin': 'Administrador',
            'cliente': 'Cliente',
            'empleado': 'Empleado',
            'supervisor': 'Supervisor'
        };
        return roles[role] || 'Usuario';
    }

    async loadDashboardData() {
        try {
            const response = await window.apiClient.get('/projects/stats/dashboard');
            this.data = response.data;
            this.updateStatsCards();
            this.updateRecentProjects();
            this.updateCharts();
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            this.showError('Error cargando los datos');
        }
    }

    updateStatsCards() {
        const stats = this.data.stats;
        
        // Actualizar números en las tarjetas
        document.getElementById('totalProjects').textContent = stats.total_proyectos || '0';
        document.getElementById('activeProjects').textContent = stats.proyectos_activos || '0';
        document.getElementById('completedProjects').textContent = stats.proyectos_completados || '0';
        
        const totalBudget = stats.presupuesto_total || 0;
        document.getElementById('totalBudget').textContent = window.utils.formatCurrency(totalBudget);
    }

    updateRecentProjects() {
        const container = document.getElementById('recentProjects');
        const projects = this.data.proyectos_recientes || [];

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <p>No hay proyectos recientes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map(project => `
            <div class="project-item" onclick="viewProject(${project.id})">
                <div class="project-info">
                    <div class="project-name">${project.nombre}</div>
                    <div class="project-client">${project.cliente_nombre || 'Sin cliente'}</div>
                </div>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progreso || 0}%"></div>
                    </div>
                    <span class="progress-text">${project.progreso || 0}%</span>
                </div>
                <div class="project-status ${project.estado}">
                    ${this.getStatusDisplayName(project.estado)}
                </div>
            </div>
        `).join('');
    }

    getStatusDisplayName(status) {
        const statuses = {
            'planificacion': 'Planificación',
            'en_proceso': 'En Proceso',
            'pausado': 'Pausado',
            'completado': 'Completado',
            'cancelado': 'Cancelado'
        };
        return statuses[status] || status;
    }

    initializeCharts() {
        this.initProjectsChart();
        this.initStatusChart();
    }

    initProjectsChart() {
        const ctx = document.getElementById('projectsChart');
        if (!ctx) return;

        // Datos de ejemplo para el gráfico de progreso
        const data = {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Proyectos Iniciados',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4
            }, {
                label: 'Proyectos Completados',
                data: [8, 15, 2, 4, 1, 2],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        };

        this.charts.projects = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    x: {
                        grid: {
                            color: '#f1f5f9'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
    }

    initStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        const estados = this.data.estados || [];
        const labels = estados.map(e => this.getStatusDisplayName(e.estado));
        const data = estados.map(e => e.count);
        const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    updateCharts() {
        if (this.charts.status && this.data.estados) {
            const estados = this.data.estados;
            const labels = estados.map(e => this.getStatusDisplayName(e.estado));
            const data = estados.map(e => e.count);

            this.charts.status.data.labels = labels;
            this.charts.status.data.datasets[0].data = data;
            this.charts.status.update();
        }
    }

    setupEventListeners() {
        // Filtros de proyectos
        const projectsFilter = document.getElementById('projectsFilter');
        if (projectsFilter) {
            projectsFilter.addEventListener('change', (e) => {
                this.filterProjects(e.target.value);
            });
        }

        // Formulario de nuevo proyecto
        const newProjectForm = document.getElementById('newProjectForm');
        if (newProjectForm) {
            newProjectForm.addEventListener('submit', (e) => this.handleNewProject(e));
        }

        // Filtros de actividad
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleActivityFilter(e));
        });

        // Checkboxes de tareas
        const taskCheckboxes = document.querySelectorAll('.task-checkbox input');
        taskCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleTaskToggle(e));
        });
    }

    setupSidebar() {
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Cerrar sidebar al hacer click fuera en móviles
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    async filterProjects(filter) {
        try {
            // Aquí implementarías la lógica para filtrar proyectos
            console.log('Filtrando proyectos por:', filter);
            // Recargar datos con filtro
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error filtrando proyectos:', error);
        }
    }

    async handleNewProject(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const projectData = Object.fromEntries(formData.entries());

        try {
            const response = await window.apiClient.post('/projects', projectData);
            
            if (response.success) {
                this.showSuccess('Proyecto creado exitosamente');
                this.closeNewProjectModal();
                await this.loadDashboardData();
                e.target.reset();
            } else {
                this.showError(response.message || 'Error creando el proyecto');
            }
        } catch (error) {
            console.error('Error creando proyecto:', error);
            this.showError('Error de conexión. Intenta de nuevo.');
        }
    }

    handleActivityFilter(e) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const filter = e.target.textContent.toLowerCase();
        console.log('Filtro de actividad:', filter);
        // Implementar lógica de filtrado de actividad
    }

    handleTaskToggle(e) {
        const taskItem = e.target.closest('.task-item');
        if (e.target.checked) {
            taskItem.style.opacity = '0.6';
            taskItem.style.textDecoration = 'line-through';
        } else {
            taskItem.style.opacity = '1';
            taskItem.style.textDecoration = 'none';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        if (window.authManager) {
            window.authManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Funciones globales para el dashboard
function openNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    if (modal) {
        modal.classList.add('active');
        loadModalData();
    }
}

function closeNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function loadModalData() {
    try {
        // Cargar clientes para el select
        const clientsResponse = await window.apiClient.get('/users?role=cliente');
        const clientSelect = document.getElementById('projectClient');
        
        if (clientSelect && clientsResponse.success) {
            clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
            clientsResponse.data.forEach(client => {
                clientSelect.innerHTML += `<option value="${client.id}">${client.nombre}</option>`;
            });
        }

        // Cargar empleados para el select de responsable
        const employeesResponse = await window.apiClient.get('/users?role=empleado');
        const managerSelect = document.getElementById('projectManager');
        
        if (managerSelect && employeesResponse.success) {
            managerSelect.innerHTML = '<option value="">Seleccionar responsable</option>';
            employeesResponse.data.forEach(employee => {
                managerSelect.innerHTML += `<option value="${employee.id}">${employee.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando datos del modal:', error);
    }
}

function viewProject(projectId) {
    window.location.href = `/projects/${projectId}`;
}

// Inicializar el dashboard cuando la página cargue
document.addEventListener('DOMContentLoaded', () => {
    // Verificar que estamos en la página del dashboard
    if (window.location.pathname.includes('/dashboard')) {
        window.dashboardManager = new DashboardManager();
    }
});

// Funciones de utilidad para el dashboard
window.dashboardUtils = {
    refreshData: async () => {
        if (window.dashboardManager) {
            await window.dashboardManager.loadDashboardData();
        }
    },

    exportData: (format = 'csv') => {
        console.log(`Exportando datos en formato ${format}`);
        // Implementar lógica de exportación
    },

    updateProgress: (projectId, progress) => {
        console.log(`Actualizando progreso del proyecto ${projectId} a ${progress}%`);
        // Implementar lógica de actualización de progreso
    }
};

// Event listeners adicionales
document.addEventListener('click', (e) => {
    // Cerrar modal al hacer click fuera
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Escape key para cerrar modales
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
    }
});

// Actualizar datos cada 5 minutos
setInterval(() => {
    if (window.dashboardManager && document.visibilityState === 'visible') {
        window.dashboardManager.loadDashboardData();
    }
}, 5 * 60 * 1000);

// Agregar estilos adicionales para los elementos del dashboard
const dashboardStyles = document.createElement('style');
dashboardStyles.textContent = `
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--gray-500);
    }
    
    .empty-state i {
        font-size: 2rem;
        margin-bottom: 1rem;
        display: block;
    }
    
    .project-progress {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0;
    }
    
    .progress-bar {
        width: 100px;
        height: 6px;
        background: var(--gray-200);
        border-radius: 3px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        transition: width 0.3s ease;
    }
    
    .progress-text {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--gray-600);
        min-width: 35px;
    }
    
    .project-item {
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .project-item:hover {
        transform: translateX(4px);
    }
    
    .sidebar.active {
        transform: translateX(0);
    }
    
    @media (max-width: 1024px) {
        .sidebar {
            position: fixed;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        
        .main-content {
            margin-left: 0;
        }
    }
`;
document.head.appendChild(dashboardStyles);
