// src/dataManager.js
// Gestión de datos y lógica de negocio - OPTIMIZADO con HandoffMap y Paginación

import { 
    getConfiguraciones, 
    setConfiguraciones, 
    removeConfiguracion,
    getSelectedChannels,
    clearSelectedChannels,
    addSelectedChannel,
    getHandoffMap,
    getDatosFuente,
    actualizarPaginacion,
    getPaginaActual,
    setPaginaActual
} from './state.js';
import { MAPEO_REPORTES, MAPEO_PRODUCTO, BATCH_SIZE, LOADING_THRESHOLD } from './config.js';
import { showLoading, hideLoading, updateProgress } from './ui/loading.js';
import { mostrarMensaje, mostrarPopupEstadisticas } from './ui/messaging.js';
import { renderizarPagina } from './ui/tableRenderer.js';

export async function agregarHandoff() {
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    let handoffValues = [];
    
    if (mode === 'single') {
        const value = document.getElementById('handoffValue').value.trim();
        if (value) handoffValues.push(value);
    } else {
        const textValues = document.getElementById('handoffValues').value;
        handoffValues = textValues.split(/[,\n]/)
            .map(v => v.trim())
            .filter(v => v.length > 0);
    }

    if (handoffValues.length === 0) {
        mostrarMensaje('Por favor ingrese al menos un HandoffValue', 'error');
        return;
    }

    // ... (Validación de campos igual que antes)
    const campaignId = document.getElementById('campaignId').value;
    const wavyUser = document.getElementById('wavyUser').value;
    const virtualCC = document.getElementById('virtualCC').value || 'ventas';
    const reporteCampana = document.getElementById('reporteCampana').value;
    const reporteProducto = document.getElementById('reporteProducto').value;
    const reporteCodCampana = document.getElementById('reporteCodCampana').value;
    const peso = document.getElementById('peso').value || '100';
    const selectedChannels = getSelectedChannels();

    if (selectedChannels.length === 0 || !campaignId || !wavyUser || !reporteCampana) {
        mostrarMensaje('Por favor complete todos los campos requeridos (Canal, Campaign, Wavy, Reporte)', 'error');
        return;
    }

    const esCargaMasiva = handoffValues.length > LOADING_THRESHOLD;
    if (esCargaMasiva) {
        showLoading('Procesando', 'Agregando configuraciones...', true);
    }

    const estadisticas = {
        nuevos: [],
        actualizados: [],
        duplicados: [],
        totalConfiguraciones: 0
    };

    const valoresUnicos = [...new Set(handoffValues)];
    const duplicadosEnEntrada = handoffValues.length - valoresUnicos.length;
    
    if (duplicadosEnEntrada > 0) {
        estadisticas.duplicados = handoffValues.filter((valor, index) => 
            handoffValues.indexOf(valor) !== index
        );
    }
    
    const configuraciones = getConfiguraciones();
    const handoffMap = getHandoffMap();
    const nuevasConfiguraciones = []; // Para agregar al final
    
    // Marcar para eliminación
    const indicesAEliminar = new Set();

    for (let i = 0; i < valoresUnicos.length; i += BATCH_SIZE) {
        const batch = valoresUnicos.slice(i, i + BATCH_SIZE);
        
        if (esCargaMasiva) {
            const progress = Math.round(((i + batch.length) / valoresUnicos.length) * 100);
            updateProgress(progress);
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        batch.forEach(handoffValue => {
            // ✅ Búsqueda O(1)
            const existentes = handoffMap.get(handoffValue);
            
            if (existentes && existentes.length > 0) {
                estadisticas.actualizados.push(handoffValue);
                // Marcar para eliminar en lugar de eliminar inmediatamente
                existentes.forEach(config => {
                    const index = configuraciones.indexOf(config);
                    if (index > -1) indicesAEliminar.add(index);
                });
                // Limpiar del Map
                handoffMap.delete(handoffValue);
            } else {
                estadisticas.nuevos.push(handoffValue);
            }
            
            const esNuevo = !existentes || existentes.length === 0;
            const estado = esNuevo ? 'Nuevo' : 'Editado';
            const tipoVisual = esNuevo ? 'nuevo' : 'editado';
            
            const configsParaEsteHO = [];
            selectedChannels.forEach(channel => {
                const config = {
                    HandoffValue: handoffValue,
                    ChannelId: channel,
                    VirtualCC: virtualCC,
                    CampaignId: campaignId,
                    WavyUser: wavyUser,
                    Reporte_Campana: reporteCampana,
                    Reporte_Producto: reporteProducto || 'Sin categorizar',
                    Reporte_Cod_Campana: reporteCodCampana || 'SIN-COD',
                    Peso: peso,
                    Estado: estado,
                    TipoVisual: tipoVisual
                };
                nuevasConfiguraciones.push(config);
                configsParaEsteHO.push(config);
                estadisticas.totalConfiguraciones++;
            });
            
            // ✅ Actualizar el Map con las nuevas configs
            handoffMap.set(handoffValue, configsParaEsteHO);
        });
    }

    // ✅ Optimización: Filtrar una sola vez al final
    const indicesOrdenados = [...indicesAEliminar].sort((a, b) => b - a); // Ordenar desc
    indicesOrdenados.forEach(index => {
        configuraciones.splice(index, 1);
    });
    
    // Agregar las nuevas configuraciones
    configuraciones.push(...nuevasConfiguraciones);
    
    // Actualizar el estado (esto recalcula la paginación)
    setConfiguraciones(configuraciones);

    if (esCargaMasiva) updateProgress(100);

    // ✅ Renderizar la página actual
    renderizarPagina();
    
    limpiarFormulario();
    
    if (esCargaMasiva) hideLoading();
    
    if (mode === 'multiple' && valoresUnicos.length > 1) {
        mostrarPopupEstadisticas(estadisticas, selectedChannels.length);
    } else {
        // ... (mensaje simple)
    }
}

export function verificarExistencia() {
    const value = document.getElementById('handoffValue').value.trim();
    const checkDiv = document.getElementById('existenceCheck');
    
    if (!value) {
        checkDiv.innerHTML = '';
        return;
    }
    
    // ✅ Búsqueda O(1)
    const configsExistentes = getHandoffMap().get(value);
    
    if (configsExistentes && configsExistentes.length > 0) {
        const canales = configsExistentes.map(c => c.ChannelId).join(', ');
        const escapedValue = value.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        checkDiv.innerHTML = `
            <span style="color: var(--success-text);">✅ Ya existe en: ${canales}</span>
            <button class="load-config-btn" data-handoff="${escapedValue}" style="margin-left: 10px; padding: 5px 10px; font-size: 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                📝 Cargar configuración
            </button>
        `;
    } else {
        checkDiv.innerHTML = '<span style="color: var(--error-text);">❌ Intent NO configurado</span>';
    }
}

export function cargarConfiguracionExistente(handoffValue) {
    // ✅ Búsqueda O(1)
    const configs = getHandoffMap().get(handoffValue);
    
    if (!configs || configs.length === 0) return;
    
    const config = configs[0]; // Tomar la primera como plantilla
    
    document.getElementById('campaignId').value = config.CampaignId || '';
    document.getElementById('wavyUser').value = config.WavyUser || '';
    document.getElementById('virtualCC').value = config.VirtualCC || 'ventas';
    document.getElementById('reporteCampana').value = config.Reporte_Campana || '';
    document.getElementById('reporteCodCampana').value = config.Reporte_Cod_Campana || '';
    document.getElementById('reporteProducto').value = config.Reporte_Producto || '';
    document.getElementById('peso').value = config.Peso || '100';
    
    clearSelectedChannels();
    document.querySelectorAll('.channel-option').forEach(opt => opt.classList.remove('selected'));
    
    const canalesToSelect = new Set(configs.map(c => c.ChannelId));
    
    document.querySelectorAll('.channel-option').forEach(opt => {
        if (canalesToSelect.has(opt.dataset.channel)) {
            opt.classList.add('selected');
            addSelectedChannel(opt.dataset.channel);
        }
    });
    
    mostrarMensaje('✅ Configuración cargada. Puede modificar y "Agregar" para actualizar', 'success');
}

export function sincronizarReporteCodigo() {
    const campana = document.getElementById('reporteCampana').value;
    const codigo = MAPEO_REPORTES[campana];
    
    if (codigo) {
        document.getElementById('reporteCodCampana').value = codigo;
        document.getElementById('reporteProducto').value = MAPEO_PRODUCTO[codigo];
    }
}

export function limpiarFormulario() {
    document.getElementById('handoffValue').value = '';
    document.getElementById('handoffValues').value = '';
    document.getElementById('campaignId').value = '';
    document.getElementById('wavyUser').value = '';
    document.getElementById('virtualCC').value = 'ventas';
    document.getElementById('reporteCampana').value = '';
    document.getElementById('reporteProducto').value = '';
    document.getElementById('reporteCodCampana').value = '';
    document.getElementById('peso').value = '100';
    document.getElementById('existenceCheck').innerHTML = '';
    
    document.querySelectorAll('.channel-option').forEach(opt => opt.classList.remove('selected'));
    clearSelectedChannels();
}

export function exportarCSV() {
    const configuraciones = getConfiguraciones();
    if (configuraciones.length === 0) {
        mostrarMensaje('No hay datos para exportar', 'error');
        return;
    }
    // ... (Lógica de exportación igual que antes)
    showLoading('Exportando', 'Generando archivo CSV...');
    const headers = 'HandoffValue;ChannelId;VirtualCC;CampaignId;WavyUser;Reporte_Campana;Reporte_Producto;Reporte_Cod_Campana;Peso';
    const rows = configuraciones.map(config => 
        `${config.HandoffValue};${config.ChannelId};${config.VirtualCC};${config.CampaignId};${config.WavyUser};${config.Reporte_Campana};${config.Reporte_Producto};${config.Reporte_Cod_Campana};${config.Peso}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    link.download = `Intents a configurar ${dia}-${mes}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
    hideLoading();
    mostrarMensaje('CSV exportado exitosamente', 'success');
}

export function editarFila(index) {
    // El índice es el índice REAL del array `getDatosFuente()`
    const config = getDatosFuente()[index];
    if (!config) return;

    // Cargar para edición individual
    document.getElementById('singleMode').checked = true;
    document.getElementById('singleInput').style.display = 'block';
    document.getElementById('multipleInput').style.display = 'none';
    
    document.getElementById('handoffValue').value = config.HandoffValue;
    
    // Cargar la configuración completa
    cargarConfiguracionExistente(config.HandoffValue);
    
    window.scrollTo({top: 0, behavior: 'smooth'});
    mostrarMensaje(`Cargado: ${config.HandoffValue}. Modifique y "Agregue" para actualizar.`, 'info');
}

export function eliminarFila(index) {
    // El índice es el índice REAL del array `getDatosFuente()`
    const datosFuente = getDatosFuente();
    const config = datosFuente[index];
    if (!config) return;

    if (!confirm(`¿Está seguro de eliminar esta configuración?\n${config.HandoffValue} - ${config.ChannelId}`)) {
        return;
    }

    const configuraciones = getConfiguraciones();
    const handoffMap = getHandoffMap();

    // 1. Eliminar del array principal `configuraciones`
    const indexEnPrincipal = configuraciones.indexOf(config);
    if (indexEnPrincipal > -1) {
        configuraciones.splice(indexEnPrincipal, 1);
    }

    // 2. Eliminar (o actualizar) del `handoffMap`
    const configsEnMap = handoffMap.get(config.HandoffValue);
    if (configsEnMap) {
        const indexEnMap = configsEnMap.indexOf(config);
        if (indexEnMap > -1) {
            configsEnMap.splice(indexEnMap, 1);
        }
        // Si ya no quedan configs para ese HandoffValue, eliminar la entrada
        if (configsEnMap.length === 0) {
            handoffMap.delete(config.HandoffValue);
        }
    }
    
    // 3. Si estábamos en búsqueda, eliminar también de `datosFiltrados`
    if (getDatosFuente() === datosFuente) { // Comprobar si datosFuente es datosFiltrados
        datosFuente.splice(index, 1);
    }
    
    // 4. Actualizar estado y renderizar
    setConfiguraciones(configuraciones); // Esto recalcula paginación
    renderizarPagina(); // Re-renderizar la página actual
    
    mostrarMensaje('Configuración eliminada', 'success');
}

export function limpiarTodo() {
    if (confirm('¿Está seguro de eliminar TODAS las configuraciones?')) {
        setConfiguraciones([]);
        getHandoffMap().clear();
        
        // Renderizar la página vacía
        renderizarPagina(); 
        mostrarMensaje('Todas las configuraciones eliminadas', 'success');
    }
}