// Punto de entrada principal de la aplicación
import { initTheme, toggleTheme, actualizarTabla, mostrarPopupNoEncontrado } from './src/ui.js';
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
    
    // Inicializar tabla
    actualizarTabla();
    
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
    
    // Event delegation para cargar configuración existente
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('load-config-btn')) {
            const handoffValue = e.target.dataset.handoff;
            cargarConfiguracionExistente(handoffValue);
        }
    });
// Al final de la función setupEventListeners(), agrega:

// Event delegation global para botones dinámicos
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('load-config-btn')) {
        const handoffValue = e.target.dataset.handoff;
        cargarConfiguracionExistente(handoffValue);
    }
});
}

function cambiarModoEntrada() {
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    if (mode === 'single') {
        document.getElementById('singleInput').style.display = 'block';
        document.getElementById('multipleInput').style.display = 'none';
    } else {
        document.getElementById('singleInput').style.display = 'none';
        document.getElementById('multipleInput').style.display = 'block';
    }
}

function sincronizarWavyUser() {
    const campaignId = document.getElementById('campaignId').value;
    document.getElementById('wavyUser').value = campaignId;
}

function seleccionarTodosCanales() {
    const allChannels = document.querySelectorAll('.channel-option');
    const selectedChannels = getSelectedChannels();
    const allSelected = selectedChannels.length === 4;
    
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

function buscarHandoff() {
    const busqueda = prompt('Ingrese el HandoffValue a buscar:');
    if (!busqueda) return;

    const tbody = document.getElementById('tableBody');
    const rows = tbody.getElementsByTagName('tr');
    let foundCount = 0;
    const searchLower = busqueda.toLowerCase();

    for (let row of rows) {
        const handoffCell = row.cells[0];
        if (handoffCell.textContent.toLowerCase().includes(searchLower)) {
            row.style.display = '';
            row.style.background = 'var(--warning-bg)';
            foundCount++;
        } else {
            row.style.display = 'none';
            row.style.background = '';
        }
    }
    
    if (foundCount > 0) {
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
    } else {
        for (let row of rows) {
            row.style.display = '';
            row.style.background = '';
        }
        document.getElementById('visibleRows').textContent = rows.length;
        mostrarPopupNoEncontrado(busqueda);
    }
}

function limpiarBusqueda() {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.getElementsByTagName('tr');
    
    for (let row of rows) {
        row.style.display = '';
        row.style.background = '';
        row.classList.remove('hidden');
    }
    
    const configuraciones = getConfiguraciones();
    document.getElementById('visibleRows').textContent = configuraciones.length;
    
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.className = 'status-message';
    statusDiv.innerHTML = '';
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