// Punto de entrada principal de la aplicación - BÚSQUEDA CORREGIDA
import { initTheme, toggleTheme, actualizarTabla, mostrarPopupNoEncontrado, toggleTablaVisibilidad, mostrarMensaje } from './src/ui.js';
import { 
    agregarHandoff, 
    verificarExistencia,
    cargarConfiguracionExistente,
    sincronizarReporteCodigo,
    limpiarFormulario,
    exportarCSV,
    editarFila,
    eliminarFila,
    limpiarTodo
} from './src/dataManager.js';
import { cargarArchivoBase } from './src/fileHandler.js';
import { getConfiguraciones, addSelectedChannel, removeSelectedChannel, clearSelectedChannels, getSelectedChannels } from './src/state.js';

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tema
    initTheme();
    
    // Inicializar tabla en modo oculto
    actualizarTabla('ocultar');
    
    // Event listeners principales
    setupEventListeners();
});

function setupEventListeners() {
    // Toggle tema
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Carga de archivo
    document.getElementById('fileUpload').addEventListener('change', cargarArchivoBase);
    
    // Modo de entrada
    document.querySelectorAll('input[name="inputMode"]').forEach(radio => {
        radio.addEventListener('change', cambiarModoEntrada);
    });
    
    // Verificar existencia
    document.getElementById('handoffValue').addEventListener('blur', verificarExistencia);
    
    // Sincronizar Campaign ID con Wavy User
    document.getElementById('campaignId').addEventListener('change', sincronizarWavyUser);
    document.getElementById('syncWavyUser').addEventListener('click', sincronizarWavyUser);
    
    // Sincronizar reporte
    document.getElementById('reporteCampana').addEventListener('change', sincronizarReporteCodigo);
    
    // Selección de canales
    document.querySelectorAll('.channel-option').forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
            const channel = this.dataset.channel;
            
            if (this.classList.contains('selected')) {
                addSelectedChannel(channel);
            } else {
                removeSelectedChannel(channel);
            }
        });
    });
    
    // Botón seleccionar todos los canales
    document.getElementById('selectAllChannels').addEventListener('click', seleccionarTodosCanales);
    
    // Botones de acción principal
    document.getElementById('addHandoffBtn').addEventListener('click', agregarHandoff);
    document.getElementById('clearFormBtn').addEventListener('click', limpiarFormulario);
    document.getElementById('searchBtn').addEventListener('click', buscarHandoff);
    
    // Botones de búsqueda en tabla
    document.getElementById('searchHandoffBtn').addEventListener('click', buscarHandoff);
    document.getElementById('clearSearchBtn').addEventListener('click', limpiarBusqueda);
    
    // Botones de tabla
    document.getElementById('exportCSVBtn').addEventListener('click', exportarCSV);
    document.getElementById('clearAllBtn').addEventListener('click', limpiarTodo);
    document.getElementById('scrollToBottomBtn').addEventListener('click', irAlFinal);
    
    // Botón para mostrar/ocultar tabla
    document.getElementById('toggleTablaBtn').addEventListener('click', function() {
        const estaVisible = toggleTablaVisibilidad();
        this.innerHTML = estaVisible ? '👁️ Ocultar Tabla' : '👁️ Mostrar Tabla';
    });
    
    // Event delegation para botones dinámicos de la tabla
    document.getElementById('tableBody').addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            const index = parseInt(e.target.dataset.index);
            editarFila(index);
        } else if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index);
            eliminarFila(index);
        }
    });
    
    // Event delegation global para botones dinámicos (load-config-btn)
    // OPTIMIZADO: Solo se agrega UNA VEZ
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('load-config-btn')) {
            const handoffValue = e.target.dataset.handoff;
            cargarConfiguracionExistente(handoffValue);
        }
    });
}

function cambiarModoEntrada() {
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    const singleInput = document.getElementById('singleInput');
    const multipleInput = document.getElementById('multipleInput');
    
    if (mode === 'single') {
        singleInput.style.display = 'block';
        multipleInput.style.display = 'none';
    } else {
        singleInput.style.display = 'none';
        multipleInput.style.display = 'block';
    }
}

function sincronizarWavyUser() {
    const campaignId = document.getElementById('campaignId').value;
    document.getElementById('wavyUser').value = campaignId;
}

function seleccionarTodosCanales() {
    const allChannels = document.querySelectorAll('.channel-option');
    const selectedChannels = getSelectedChannels();
    const allSelected = selectedChannels.length === 5;
    
    if (allSelected) {
        allChannels.forEach(option => {
            option.classList.remove('selected');
        });
        clearSelectedChannels();
    } else {
        clearSelectedChannels();
        allChannels.forEach(option => {
            option.classList.add('selected');
            addSelectedChannel(option.dataset.channel);
        });
    }
}

// ✅ CORREGIDO: Búsqueda ahora busca en memoria antes de buscar en HTML
function buscarHandoff() {
    const busqueda = prompt('Ingrese el HandoffValue a buscar:');
    if (!busqueda) return;

    const searchLower = busqueda.toLowerCase();
    
    // PASO 1: Buscar primero en las configuraciones en memoria
    const configuraciones = getConfiguraciones();
    const resultadosEncontrados = configuraciones.filter(config => 
        config.HandoffValue.toLowerCase().includes(searchLower)
    );
    
    if (resultadosEncontrados.length === 0) {
        // No se encontró nada en memoria
        mostrarPopupNoEncontrado(busqueda);
        return;
    }
    
    // PASO 2: Si hay resultados, asegurarse de que la tabla esté completamente renderizada
    actualizarTabla('todos');
    
    // PASO 3: Ahora filtrar visualmente las filas
    const tbody = document.getElementById('tableBody');
    const rows = tbody.getElementsByTagName('tr');
    let foundCount = 0;

    for (let row of rows) {
        const handoffCell = row.cells[0];
        if (handoffCell && handoffCell.textContent.toLowerCase().includes(searchLower)) {
            row.style.display = '';
            row.style.background = 'var(--warning-bg)';
            foundCount++;
        } else {
            row.style.display = 'none';
            row.style.background = '';
        }
    }
    
    document.getElementById('visibleRows').textContent = foundCount;
    
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>🔍 Mostrando ${foundCount} resultado(s) para: "${busqueda}"</span>
            <button id="clearSearchInline" style="padding: 5px 15px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                ❌ Ver todos
            </button>
        </div>
    `;
    statusDiv.className = 'status-message info';
    
    document.getElementById('clearSearchInline').addEventListener('click', limpiarBusqueda);
    
    // PASO 4: Actualizar el botón de mostrar/ocultar tabla
    const toggleBtn = document.getElementById('toggleTablaBtn');
    if (toggleBtn) {
        toggleBtn.innerHTML = '👁️ Ocultar Tabla';
    }
}

function limpiarBusqueda() {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.getElementsByTagName('tr');
    
    // Restaurar visibilidad y estilo de todas las filas
    for (let row of rows) {
        row.style.display = '';
        row.style.background = '';
        row.classList.remove('hidden');
    }
    
    const configuraciones = getConfiguraciones();
    document.getElementById('visibleRows').textContent = configuraciones.length;
    
    // Limpiar mensaje de estado
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.className = 'status-message';
    statusDiv.innerHTML = '';
    
    // Mostrar mensaje informativo
    mostrarMensaje('✅ Mostrando todos los registros', 'info');
}

function irAlFinal() {
    const dataTable = document.querySelector('.data-table');
    if (dataTable) {
        dataTable.scrollTop = dataTable.scrollHeight;
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.textContent = '➡️ Mostrando final de la lista';
        statusDiv.className = 'status-message info';
        setTimeout(() => {
            statusDiv.className = 'status-message';
        }, 2000);
    }
}