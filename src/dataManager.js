// Gestión de datos y lógica de negocio
import { 
    getConfiguraciones, 
    setConfiguraciones, 
    addConfiguraciones,
    removeConfiguracion,
    getSelectedChannels,
    clearSelectedChannels 
} from './state.js';
import { MAPEO_REPORTES, MAPEO_PRODUCTO, BATCH_SIZE, LOADING_THRESHOLD } from './config.js';
import { 
    showLoading, 
    hideLoading, 
    updateProgress, 
    mostrarMensaje, 
    actualizarTabla,
    mostrarPopupEstadisticas 
} from './ui.js';

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

    const campaignId = document.getElementById('campaignId').value;
    const wavyUser = document.getElementById('wavyUser').value;
    const virtualCC = document.getElementById('virtualCC').value || 'ventas';
    const reporteCampana = document.getElementById('reporteCampana').value;
    const reporteProducto = document.getElementById('reporteProducto').value;
    const reporteCodCampana = document.getElementById('reporteCodCampana').value;
    const peso = document.getElementById('peso').value || '100';
    const selectedChannels = getSelectedChannels();

    if (selectedChannels.length === 0) {
        mostrarMensaje('Por favor seleccione al menos un canal', 'error');
        return;
    }

    if (!campaignId || !wavyUser || !reporteCampana) {
        mostrarMensaje('Por favor complete todos los campos requeridos', 'error');
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
    const existentesMap = new Map();
    configuraciones.forEach(config => {
        if (!existentesMap.has(config.HandoffValue)) {
            existentesMap.set(config.HandoffValue, []);
        }
        existentesMap.get(config.HandoffValue).push(config);
    });

    const nuevasConfiguraciones = [];
    
    for (let i = 0; i < valoresUnicos.length; i += BATCH_SIZE) {
        const batch = valoresUnicos.slice(i, i + BATCH_SIZE);
        
        if (esCargaMasiva) {
            const progress = Math.round((i / valoresUnicos.length) * 100);
            updateProgress(progress);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        batch.forEach(handoffValue => {
            const existentes = existentesMap.get(handoffValue);
            
            if (existentes && existentes.length > 0) {
                estadisticas.actualizados.push(handoffValue);
                existentes.forEach(config => {
                    config._markedForDeletion = true;
                });
            } else {
                estadisticas.nuevos.push(handoffValue);
            }
            
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
                    Estado: existentes && existentes.length > 0 ? 'Editado' : 'Nuevo',
                    TipoVisual: existentes && existentes.length > 0 ? 'editado' : 'nuevo'
                };
                nuevasConfiguraciones.push(config);
                estadisticas.totalConfiguraciones++;
            });
        });
    }

    const configsFiltradas = configuraciones.filter(c => !c._markedForDeletion);
    setConfiguraciones([...configsFiltradas, ...nuevasConfiguraciones]);

    if (esCargaMasiva) {
        updateProgress(100);
    }

    actualizarTabla();
    limpiarFormulario();
    
    if (esCargaMasiva) {
        hideLoading();
    }
    
    if (mode === 'multiple' && valoresUnicos.length > 1) {
        mostrarPopupEstadisticas(estadisticas, selectedChannels.length);
    } else {
        const handoffValue = valoresUnicos[0];
        const esNuevo = estadisticas.nuevos.includes(handoffValue);
        const mensaje = esNuevo ? 
            `✅ HandoffValue "${handoffValue}" agregado (${selectedChannels.length} canal(es))` :
            `✅ HandoffValue "${handoffValue}" actualizado (${selectedChannels.length} canal(es))`;
        mostrarMensaje(mensaje, 'success');
    }
}

export function verificarExistencia() {
    const value = document.getElementById('handoffValue').value.trim();
    const checkDiv = document.getElementById('existenceCheck');
    
    if (!value) {
        checkDiv.innerHTML = '';
        return;
    }
    
    const configuraciones = getConfiguraciones();
    const configsExistentes = configuraciones.filter(c => c.HandoffValue === value);
    
    if (configsExistentes.length > 0) {
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
    const configuraciones = getConfiguraciones();
    const configs = configuraciones.filter(c => c.HandoffValue === handoffValue);
    
    if (configs.length === 0) return;
    
    const config = configs[0];
    
    document.getElementById('campaignId').value = config.CampaignId || '';
    document.getElementById('wavyUser').value = config.WavyUser || '';
    document.getElementById('virtualCC').value = config.VirtualCC || 'ventas';
    document.getElementById('reporteCampana').value = config.Reporte_Campana || '';
    document.getElementById('reporteCodCampana').value = config.Reporte_Cod_Campana || '';
    document.getElementById('reporteProducto').value = config.Reporte_Producto || '';
    document.getElementById('peso').value = config.Peso || '100';
    
    document.querySelectorAll('.channel-option').forEach(opt => opt.classList.remove('selected'));
    clearSelectedChannels();
    
    configs.forEach(conf => {
        document.querySelectorAll('.channel-option').forEach(opt => {
            if (opt.dataset.channel === conf.ChannelId && !opt.classList.contains('selected')) {
                opt.classList.add('selected');
                opt.click();
            }
        });
    });
    
    mostrarMensaje('✅ Configuración cargada. Puede modificar y agregar', 'success');
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

    if (configuraciones.length > 1000) {
        showLoading('Exportando', 'Generando archivo CSV...');
    }

    const headers = 'HandoffValue;ChannelId;VirtualCC;CampaignId;WavyUser;Reporte_Campana;Reporte_Producto;Reporte_Cod_Campana;Peso';
    const rows = configuraciones.map(config => 
        `${config.HandoffValue};${config.ChannelId};${config.VirtualCC};${config.CampaignId};${config.WavyUser};${config.Reporte_Campana};${config.Reporte_Producto};${config.Reporte_Cod_Campana};${config.Peso}`
    );
    
    const csvContent = headers + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    link.download = `Intents a configurar ${dia}-${mes}.csv`;
    
    link.click();
    
    if (configuraciones.length > 1000) {
        hideLoading();
    }
    
    mostrarMensaje('CSV exportado exitosamente', 'success');
}

export function editarFila(index) {
    const configuraciones = getConfiguraciones();
    const config = configuraciones[index];
    
    document.getElementById('singleMode').checked = true;
    document.getElementById('singleInput').style.display = 'block';
    document.getElementById('multipleInput').style.display = 'none';
    
    document.getElementById('handoffValue').value = config.HandoffValue;
    document.getElementById('campaignId').value = config.CampaignId;
    document.getElementById('wavyUser').value = config.WavyUser;
    document.getElementById('virtualCC').value = config.VirtualCC;
    document.getElementById('reporteCampana').value = config.Reporte_Campana;
    document.getElementById('reporteCodCampana').value = config.Reporte_Cod_Campana;
    document.getElementById('reporteProducto').value = config.Reporte_Producto;
    document.getElementById('peso').value = config.Peso;
    
    document.querySelectorAll('.channel-option').forEach(opt => opt.classList.remove('selected'));
    clearSelectedChannels();
    
    const channelOption = document.querySelector(`[data-channel="${config.ChannelId}"]`);
    if (channelOption) {
        channelOption.classList.add('selected');
        channelOption.click();
    }
    
    removeConfiguracion(index);
    actualizarTabla();
    
    window.scrollTo({top: 0, behavior: 'smooth'});
    mostrarMensaje('Configuración cargada para editar', 'info');
}

export function eliminarFila(index) {
    if (confirm('¿Está seguro de eliminar esta configuración?')) {
        removeConfiguracion(index);
        actualizarTabla();
        mostrarMensaje('Configuración eliminada', 'success');
    }
}

export function limpiarTodo() {
    if (confirm('¿Está seguro de eliminar todas las configuraciones?')) {
        setConfiguraciones([]);
        actualizarTabla();
        mostrarMensaje('Todas las configuraciones eliminadas', 'success');
    }
}

// Función auxiliar para manejar event listeners de botones dinámicos en existenceCheck
export function setupDynamicListeners() {
    // Esta función se puede llamar después de crear elementos dinámicos
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('load-config-btn')) {
            const handoffValue = e.target.dataset.handoff;
            cargarConfiguracionExistente(handoffValue);
        }
    });
}