// main.js
// Punto de entrada principal - OPTIMIZADO y MODULARIZADO

import { initTheme, toggleTheme } from './src/ui/theme.js';
import { renderizarPagina } from './src/ui/tableRenderer.js';
import { mostrarMensaje, mostrarPopupNoEncontrado } from './src/ui/messaging.js';
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
import { 
    getConfiguraciones, 
    addSelectedChannel, 
    removeSelectedChannel, 
    clearSelectedChannels, 
    getSelectedChannels,
    setDatosFiltrados,
    setEsBusqueda,
    setPaginaActual,
    getPaginaActual,
    actualizarPaginacion
} from './src/state.js';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    setupEventListeners();
    actualizarPaginacion(); // Calcular paginación inicial (Pág 1 de 1)
    renderizarPagina();   // Renderizar estado inicial (vacío)
});

function setupEventListeners() {
    // Tema
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Archivo
    document.getElementById('fileUpload').addEventListener('change', cargarArchivoBase);
    
    // Modo de entrada
    document.querySelectorAll('input[name="inputMode"]').forEach(radio => {
        radio.addEventListener('change', cambiarModoEntrada);
    });
    
    // Formulario
    document.getElementById('handoffValue').addEventListener('blur', verificarExistencia);
    document.getElementById('campaignId').addEventListener('change', sincronizarWavyUser);
    document.getElementById('syncWavyUser').addEventListener('click', sincronizarWavyUser);
    document.getElementById('reporteCampana').addEventListener('change', sincronizarReporteCodigo);
    
    // Canales
    document.querySelectorAll('.channel-option').forEach(option => {
        option.addEventListener('click', toggleChannelSelection);
    });
    document.getElementById('selectAllChannels').addEventListener('click', seleccionarTodosCanales);
    
    // Botones Acción Formulario
    document.getElementById('addHandoffBtn').addEventListener('click', agregarHandoff);
    document.getElementById('clearFormBtn').addEventListener('click', limpiarFormulario);
    document.getElementById('searchBtn').addEventListener('click', () => {
        // Botón "Cargar Configuración" (antes "Buscar")
        const hoValue = document.getElementById('handoffValue').value;
        if (hoValue) {
            cargarConfiguracionExistente(hoValue);
        } else {
            mostrarMensaje('Ingrese un HandoffValue para cargar', 'info');
        }
    });
    
    // Botones Búsqueda en Tabla
    document.getElementById('searchHandoffBtn').addEventListener('click', buscarHandoff);
    document.getElementById('clearSearchBtn').addEventListener('click', limpiarBusqueda);
    
    // Botones Paginación
    document.getElementById('prevPageBtn').addEventListener('click', irPaginaAnterior);
    document.getElementById('nextPageBtn').addEventListener('click', irPaginaSiguiente);
    
    // Botones Acción Tabla
    document.getElementById('exportCSVBtn').addEventListener('click', exportarCSV);
    document.getElementById('clearAllBtn').addEventListener('click', limpiarTodo);
    
    // Event delegation para botones dinámicos (Tabla y Popups)
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            const index = parseInt(e.target.dataset.index);
            editarFila(index);
        } else if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index);
            eliminarFila(index);
        } else if (e.target.classList.contains('load-config-btn')) {
            const handoffValue = e.target.dataset.handoff;
            document.getElementById('handoffValue').value = handoffValue;
            cargarConfiguracionExistente(handoffValue);
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });
}

// --- Lógica de Eventos ---

function cambiarModoEntrada() {
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    document.getElementById('singleInput').style.display = (mode === 'single') ? 'block' : 'none';
    document.getElementById('multipleInput').style.display = (mode === 'multiple') ? 'block' : 'none';
}

function sincronizarWavyUser() {
    document.getElementById('wavyUser').value = document.getElementById('campaignId').value;
}

function toggleChannelSelection() {
    this.classList.toggle('selected');
    const channel = this.dataset.channel;
    if (this.classList.contains('selected')) {
        addSelectedChannel(channel);
    } else {
        removeSelectedChannel(channel);
    }
}

function seleccionarTodosCanales() {
    const allChannels = document.querySelectorAll('.channel-option');
    const totalCanales = allChannels.length;
    const allSelected = getSelectedChannels().length === totalCanales;
    
    clearSelectedChannels();
    allChannels.forEach(option => {
        if (allSelected) {
            option.classList.remove('selected');
        } else {
            option.classList.add('selected');
            addSelectedChannel(option.dataset.channel);
        }
    });
}

// ✅ NUEVO: Búsqueda en memoria (estado)
function buscarHandoff() {
    const busqueda = prompt('Ingrese el HandoffValue a buscar:');
    if (!busqueda) return;

    const searchLower = busqueda.toLowerCase();
    
    // PASO 1: Buscar en memoria (O(N) pero solo en memoria)
    const configuraciones = getConfiguraciones();
    const resultados = configuraciones.filter(config => 
        config.HandoffValue.toLowerCase().includes(searchLower)
    );
    
    if (resultados.length === 0) {
        mostrarPopupNoEncontrado(busqueda);
        return;
    }
    
    // PASO 2: Guardar estado de búsqueda
    setEsBusqueda(true);
    setDatosFiltrados(resultados); // Esto recalcula paginación y resetea a pág 1
    
    // PASO 3: Renderizar la PÁGINA 1 de los resultados
    renderizarPagina();
    
    mostrarMensaje(`🔍 Encontrados ${resultados.length} registros para "${busqueda}"`, 'info');
}

// ✅ NUEVO: Limpiar búsqueda
function limpiarBusqueda() {
    setEsBusqueda(false);
    setDatosFiltrados([]); // Limpiar datos filtrados
    
    // Renderizar la PÁGINA 1 de los datos originales
    renderizarPagina();
    
    mostrarMensaje('✅ Mostrando todos los registros', 'info');
}

// ✅ NUEVO: Controles de paginación
function irPaginaAnterior() {
    setPaginaActual(getPaginaActual() - 1);
    renderizarPagina();
}

function irPaginaSiguiente() {
    setPaginaActual(getPaginaActual() + 1);
    renderizarPagina();
}