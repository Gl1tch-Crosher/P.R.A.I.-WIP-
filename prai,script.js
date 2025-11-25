// --- ELEMENTOS DEL DOM 
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuButton = document.getElementById('menu-button');
const pageTitle = document.getElementById('page-title');
const navLinks = document.querySelectorAll('.nav-link');
const pageContents = document.querySelectorAll('.page-content');
const robotsTableBody = document.getElementById('robots-table-body');
const clientsTableBody = document.getElementById('clients-table-body'); // Necesario para la tabla de clientes
const crudModal = document.getElementById('crud-modal');
const modalContent = document.getElementById('modal-content');
const modalTitle = document.getElementById('modal-title');
const robotForm = document.getElementById('robot-form');
const clientCrudModal = document.getElementById('client-crud-modal'); // Necesario para el modal de clientes
const clientModalContent = document.getElementById('client-modal-content'); // Necesario para el modal de clientes
const clientModalTitle = document.getElementById('client-modal-title'); // Necesario para el modal de clientes
const clientForm = document.getElementById('client-form'); // Necesario para el modal de clientes
const messageBox = document.getElementById('message-box');
const simulationStatus = document.getElementById('simulation-status'); // Necesario para el módulo de simulación

// La URL base del servidor Flask
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// --- UTILIDAD: MANEJO DE FETCH Y ERRORES ---
async function apiFetch(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Error desconocido del servidor.');
    }
    return data;
}

// --- FUNCIÓN DE NAVEGACIÓN (CAMBIO DE VISTAS) ---
function changePage(pageId) {
    pageContents.forEach(content => {
        content.classList.add('hidden');
    });

    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.remove('hidden');
        pageTitle.textContent = activePage.getAttribute('data-title');
        
        if (pageId === 'crud') {
            renderRobotsTable();
        } else if (pageId === 'clients') {
            renderClientsTable();
        }
    }

    navLinks.forEach(link => {
        link.classList.remove('active-nav-link');
        link.classList.add('text-gray-300');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active-nav-link');
            link.classList.remove('text-gray-300');
        }
    });

    if (window.innerWidth < 1024 && !sidebar.classList.contains('-translate-x-full')) {
        closeSidebar();
    }
}

// --- MANEJO DE SIDEBAR (Móvil) ---
function toggleSidebar() {
    sidebar.classList.toggle('-translate-x-full');
    sidebarOverlay.classList.toggle('opacity-0');
    sidebarOverlay.classList.toggle('pointer-events-none');
}

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
}

// --- MÓDULO REPORTES: SIMULACIÓN DE EXPORTACIÓN ---
function simulateReportExport() {
    const startDate = document.getElementById('filter-start-date').value;
    const robot = document.getElementById('filter-robot').value;
    const process = document.getElementById('filter-process').value;

    let filterSummary = "Reporte generado. ";

    if (startDate) filterSummary += `Fecha: ${startDate}. `;
    if (robot) filterSummary += `Robot: ${robot}. `;
    if (process) filterSummary += `Proceso: ${process}. `;

    showMessageBox(filterSummary + "Exportación a PDF/Excel simulada exitosamente.", 'green');
}

// --------------------------------------------------------------------------------------------------------------------------------
// --- MÓDULO CRUD ROBOTS: RENDERIZADO DE TABLA Y OPERACIONES (CON API REAL) ---

async function renderRobotsTable() {
    try {
        // GET /api/robots
        const currentRobots = await apiFetch(`${API_BASE_URL}/robots`); 

        robotsTableBody.innerHTML = '';
        currentRobots.forEach(robot => {
            let statusColor = '';
            let statusBg = '';
            if (robot.status === 'Activo') {
                statusColor = 'text-green-800';
                statusBg = 'bg-green-100';
            } else if (robot.status === 'Mantenimiento') {
                statusColor = 'text-yellow-800';
                statusBg = 'bg-yellow-100';
            } else {
                statusColor = 'text-red-800';
                statusBg = 'bg-red-100';
            }
                
            const row = `
                <tr class="hover:bg-gray-50 transition duration-150">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${robot.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${robot.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${robot.type}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBg} ${statusColor}">
                            ${robot.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onclick="openCrudModal('edit', ${robot.id})" title="Editar" class="text-praiaccent hover:text-praiaccent-light transition duration-150 p-1 rounded hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-3 inline"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button onclick="confirmDeleteRobot(${robot.id})" title="Eliminar" class="text-red-600 hover:text-red-800 transition duration-150 p-1 rounded hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 inline"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                    </td>
                </tr>
            `;
            robotsTableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (error) {
        console.error('Error al cargar robots:', error);
        showMessageBox(`Error al cargar robots: ${error.message}`, 'red');
    }
}

function openCrudModal(mode, id = null) {
    robotForm.reset();
    const robotIdInput = document.getElementById('robot-id');
    const robotNameInput = document.getElementById('robot-name');
    const robotTypeInput = document.getElementById('robot-type');
    const robotStatusInput = document.getElementById('robot-status');

    if (mode === 'create') {
        modalTitle.textContent = 'Crear Nuevo Robot';
        robotIdInput.value = '';
    } else if (mode === 'edit' && id !== null) {
        modalTitle.textContent = 'Editar Robot';
        robotIdInput.value = id;
    }

    crudModal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

function closeCrudModal() {
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        crudModal.classList.add('hidden');
    }, 300);
}

async function saveRobot() {
    const id = document.getElementById('robot-id').value;
    const name = document.getElementById('robot-name').value;
    const type = document.getElementById('robot-type').value;
    const status = document.getElementById('robot-status').value;

    const url = id ? `${API_BASE_URL}/robots/${id}` : `${API_BASE_URL}/robots`;
    const method = id ? 'PUT' : 'POST';

    try {
        const data = await apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, status }) 
        });

        showMessageBox(data.message, 'green');
        renderRobotsTable();
        closeCrudModal();

    } catch (error) {
        console.error('Error al guardar robot:', error);
        showMessageBox(`Error al guardar robot: ${error.message}`, 'red');
    }
}

function confirmDeleteRobot(id) {
    if (confirm(`¿Está seguro de que desea eliminar el robot ID ${id}? Esta acción es irreversible.`)) {
        // DELETE /api/robots/{id}
        apiFetch(`${API_BASE_URL}/robots/${id}`, { method: 'DELETE' })
            .then(data => {
                renderRobotsTable();
                showMessageBox(data.message, 'green');
            })
            .catch(error => {
                console.error('Error al eliminar robot:', error);
                showMessageBox(`Error al eliminar robot: ${error.message}`, 'red');
            });
    }
}

// --------------------------------------------------------------------------------------------------------------------------------
// --- MÓDULO CRUD CLIENTES: RENDERIZADO DE TABLA Y OPERACIONES (CON API REAL) ---

async function renderClientsTable() {
    try {
        // GET /api/clientes
        const currentClients = await apiFetch(`${API_BASE_URL}/clientes`); 

        clientsTableBody.innerHTML = '';
        currentClients.forEach(client => {
            let statusColor = client.status === 'Activo' ? 'text-green-800' : 'text-red-800';
            let statusBg = client.status === 'Activo' ? 'bg-green-100' : 'bg-red-100';

            const row = `
                <tr class="hover:bg-gray-50 transition duration-150">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${client.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${client.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${client.contact}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBg} ${statusColor}">
                            ${client.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onclick="openClientCrudModal('edit', ${client.id})" title="Editar" class="text-praiaccent hover:text-praiaccent-light transition duration-150 p-1 rounded hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-3 inline"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button onclick="confirmDeleteClient(${client.id})" title="Eliminar" class="text-red-600 hover:text-red-800 transition duration-150 p-1 rounded hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 inline"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                    </td>
                </tr>
            `;
            clientsTableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showMessageBox(`Error al cargar clientes: ${error.message}`, 'red');
    }
}

// Funciones openClientCrudModal y closeClientCrudModal no requieren cambios de API

function openClientCrudModal(mode, id = null) {
    clientForm.reset();
    const clientIdInput = document.getElementById('client-id');
    const clientModalTitle = document.getElementById('client-modal-title');

    if (mode === 'create') {
        clientModalTitle.textContent = 'Registrar Nuevo Cliente';
        clientIdInput.value = '';
    } else if (mode === 'edit' && id !== null) {
        clientModalTitle.textContent = 'Editar Cliente';
        clientIdInput.value = id;
    }

    clientCrudModal.classList.remove('hidden');
    setTimeout(() => {
        clientModalContent.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

function closeClientCrudModal() {
    if (clientCrudModal) { // 'clientCrudModal' es la variable que apunta al modal en el DOM
        clientCrudModal.classList.add('hidden'); 
    }
    if (clientForm) {
        clientForm.reset();
    }
}

// --- FUNCIÓN ROBUSTA PARA GUARDAR O ACTUALIZAR CLIENTE ---
async function saveClient() {
    // 1. Obtener los valores del formulario
    const id = document.getElementById('client-id').value; // Asumiendo que existe en el HTML
    const nombre = document.getElementById('client-name').value;
    const empresa = document.getElementById('client-company').value;
    const contacto = document.getElementById('client-contact').value;

    // 2. Construir la URL y método
    const url = id ? `${API_BASE_URL}/api/clientes/${id}` : `${API_BASE_URL}/api/clientes`;
    const method = id ? 'PUT' : 'POST'; 
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, empresa, contacto }) 
        });

        // 3. Verificar el estado de la respuesta del servidor (Flask)
        if (response.ok) {
            const data = await response.json();
            showMessageBox(data.message, 'green');
            renderClientsTable(); // Si esta función no existe, bórrala o créala
        } else {
            // Si Flask responde con un 400, 500, etc.
            const error = await response.json();
            showMessageBox(`Error al guardar: ${error.message}`, 'red');
        }
        
    } catch (error) {
        // 5. Manejar errores de conexión de red (el servidor Flask no está corriendo)
        console.error('Fetch Error:', error);
        showMessageBox('Error de conexión con el servidor. ¿Está corriendo Flask?', 'red');
        
    } finally {
        closeClientCrudModal();
    }
}

function confirmDeleteClient(id) {
    if (confirm(`¿Está seguro de que desea eliminar el cliente ID ${id}? Esta acción es irreversible.`)) {
        // DELETE /api/clientes/{id}
        apiFetch(`${API_BASE_URL}/clientes/${id}`, { method: 'DELETE' })
            .then(data => {
                renderClientsTable();
                showMessageBox(data.message, 'green');
            })
            .catch(error => {
                console.error('Error al eliminar cliente:', error);
                showMessageBox(`Error al eliminar cliente: ${error.message}`, 'red');
            });
    }
}

// --------------------------------------------------------------------------------------------------------------------------------
// --- MÓDULO SIMULACIÓN: LÓGICA DE SIMULACIÓN DE PROCESOS (CON API REAL) ---

async function simulateProcess() {
    const robotId = document.getElementById('sim-robot').value;
    const task = document.getElementById('sim-task').value;
    const clientId = document.getElementById('sim-client').value;
    
    // Validar entradas básicas
    if (!robotId || !task || !clientId) {
        showMessageBox("Por favor, complete todos los campos de la simulación.", 'red');
        return;
    }

    showMessageBox(`Registrando Solicitud de Tarea "${task}"...`);

    // Limpiar estado y mostrar estado inicial
    simulationStatus.innerHTML = `
        <div class="bg-blue-100 border-l-4 border-praiaccent text-praiblue p-4 mb-3 rounded-lg shadow-sm">
            <p class="font-bold">Estado Inicial: Registrando en DB</p>
            <p class="text-sm">Enviando Tarea para su procesamiento...</p>
        </div>
    `;
    
    try {
        // POST /api/simulacion/solicitud
        const data = await apiFetch(`${API_BASE_URL}/simulacion/solicitud`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                robot_id: parseInt(robotId), 
                client_id: parseInt(clientId),
                task_name: task,
                task_description: `Proceso automático: ${task}`,
                priority: 'Alta' 
            })
        });

        // Respuesta exitosa del servidor (la BBDD se actualizó)
        showMessageBox(`Solicitud ID ${data.solicitud_id} registrada. Iniciando simulación visual.`, 'green');

        // Simulación de pasos de proceso (animación visual)
        setTimeout(() => {
            simulationStatus.innerHTML = `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-3 rounded-lg shadow-sm">
                    <p class="font-bold">Estado Actual: Procesando...</p>
                    <p class="text-sm">El robot ID ${robotId} ha iniciado la tarea "${task}".</p>
                </div>
                ${simulationStatus.innerHTML}
            `;
        }, 3000);

        setTimeout(() => {
            simulationStatus.innerHTML = `
                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-3 rounded-lg shadow-sm">
                    <p class="font-bold">Estado Actual: Completo</p>
                    <p class="text-sm">La Tarea "${task}" ha sido completada exitosamente. Registro finalizado en BBDD.</p>
                </div>
                ${simulationStatus.innerHTML}
            `;
            showMessageBox(`Simulación de Tarea "${task}" completada con éxito.`, 'green');
        }, 10000); 

    } catch (error) {
        console.error('Error al registrar la solicitud:', error);
        simulationStatus.innerHTML = `<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-3 rounded-lg shadow-sm"><p class="font-bold">Error</p><p class="text-sm">No se pudo registrar la solicitud: ${error.message}</p></div>`;
        showMessageBox(`Error: No se pudo conectar o registrar la tarea en el servidor.`, 'red');
    }
}

// --------------------------------------------------------------------------------------------------------------------------------
// --- UTILIDAD: MOSTRAR MENSAJE DE NOTIFICACIÓN ---
function showMessageBox(message, type = 'default') {
    let bgColor = 'bg-gray-800';
    if (type === 'red') bgColor = 'bg-red-600';
    if (type === 'green') bgColor = 'bg-green-600';

    messageBox.textContent = message;
    messageBox.className = `fixed bottom-4 right-4 text-white p-4 rounded-xl shadow-2xl transition-all duration-300 transform z-50 ${bgColor}`;
    
    // Muestra el mensaje
    messageBox.classList.remove('translate-x-full', 'opacity-0');
    messageBox.classList.add('translate-x-0', 'opacity-100');

    // Oculta el mensaje
    setTimeout(() => {
        messageBox.classList.remove('translate-x-0', 'opacity-100');
        messageBox.classList.add('translate-x-full', 'opacity-0');
    }, 4000);
}

// --------------------------------------------------------------------------------------------------------------------------------
// --- INICIALIZACIÓN ---
window.onload = function() {
    // Configurar Listeners de Navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            changePage(link.getAttribute('data-page'));
        });
    });
    // --- LISTENER PARA EL FORMULARIO DE CREACIÓN DE CLIENTES ---
    if (clientForm) {
        clientForm.addEventListener('submit', (e) => {
            e.preventDefault(); // ¡IMPEDIR RECARGA DE PÁGINA!
            saveClient(); // Llama a la nueva función de guardado
        });
    }

    // Configurar Listeners del Sidebar (Móvil)
    menuButton.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Cargar la página por defecto (Dashboard)
    changePage('dashboard');
};