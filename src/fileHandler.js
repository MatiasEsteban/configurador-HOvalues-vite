// Manejo de carga de archivos - OPTIMIZADO
import { setConfiguraciones, getConfiguraciones, setArchivoTemporal, clearArchivoTemporal } from './state.js';
import { showLoading, hideLoading, updateProgress, mostrarMensaje, actualizarTabla } from './ui.js';
import { FILE_BATCH_SIZE } from './config.js';

export function cargarArchivoBase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const configuraciones = getConfiguraciones();
    if (configuraciones.length > 0) {
        mostrarPopupConfirmacionCarga(file);
        return;
    }

    procesarArchivo(file);
}

function mostrarPopupConfirmacionCarga(file) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay active';
    overlay.style.zIndex = '10000';
    
    const content = document.createElement('div');
    content.className = 'loading-content';
    content.style.maxWidth = '500px';
    content.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <div class="loading-text" style="color: var(--warning-text); font-size: 20px; margin-bottom: 15px;">
            ¡Atención! Ya hay datos cargados
        </div>
        <div class="loading-subtext" style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">
            Al cargar este archivo se <strong>reemplazarán</strong> todas las configuraciones actuales.<br>
            <strong>Se perderán los cambios no exportados.</strong>
        </div>
        <div style="background: var(--info-bg); padding: 15px; border-radius: 8px; margin: 15px 0; color: var(--info-text);">
            📊 Configuraciones actuales: <strong>${getConfiguraciones().length}</strong>
        </div>
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
            <button class="confirm-replace" 
                    style="padding: 12px 25px; background: #dc3545; color: white; border: none; 
                           border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
                🗑️ Sí, reemplazar datos
            </button>
            <button class="cancel-load" 
                    style="padding: 12px 25px; background: #6c757d; color: white; border: none; 
                           border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
                ❌ Cancelar
            </button>
        </div>
    `;
    
    const confirmBtn = content.querySelector('.confirm-replace');
    const cancelBtn = content.querySelector('.cancel-load');
    
    confirmBtn.addEventListener('click', () => {
        setConfiguraciones([]);
        procesarArchivo(file);
        clearArchivoTemporal();
        overlay.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
        document.getElementById('fileUpload').value = '';
        clearArchivoTemporal();
        mostrarMensaje('Carga de archivo cancelada', 'info');
        overlay.remove();
    });
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    setArchivoTemporal(file);
}

export async function procesarArchivo(file) {
    showLoading('Cargando archivo', 'Procesando datos...', true);

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                hideLoading();
                mostrarMensaje('El archivo está vacío', 'error');
                return;
            }
            
            const headers = lines[0].split(';');
            const valoresUnicos = new Set();
            const nuevasConfiguraciones = [];
            
            // Actualizar progreso inicial
            updateProgress(0);
            
            // Procesar en lotes
            for (let i = 1; i < lines.length; i += FILE_BATCH_SIZE) {
                const batch = lines.slice(i, i + FILE_BATCH_SIZE);
                const progress = Math.round(((i + batch.length) / lines.length) * 100);
                updateProgress(progress);
                
                // Permitir que el navegador respire y actualice el UI
                await new Promise(resolve => setTimeout(resolve, 10));
                
                batch.forEach(line => {
                    const values = line.split(';');
                    if (values.length >= headers.length) {
                        const config = {};
                        headers.forEach((header, index) => {
                            config[header.trim()] = values[index] ? values[index].trim() : '';
                        });
                        config.Estado = 'Original';
                        nuevasConfiguraciones.push(config);
                        
                        if (config.CampaignId) valoresUnicos.add(`campaign:${config.CampaignId}`);
                        if (config.WavyUser) valoresUnicos.add(`wavy:${config.WavyUser}`);
                        if (config.Reporte_Campana) valoresUnicos.add(`campana:${config.Reporte_Campana}`);
                        if (config.Reporte_Cod_Campana) valoresUnicos.add(`codigo:${config.Reporte_Cod_Campana}`);
                        if (config.Reporte_Producto) valoresUnicos.add(`producto:${config.Reporte_Producto}`);
                    }
                });
            }
            
            setConfiguraciones(nuevasConfiguraciones);
            
            // Agregar valores únicos a los selectores
            valoresUnicos.forEach(valor => {
                const [tipo, contenido] = valor.split(':');
                agregarOpcionSiNoExiste(tipo, contenido);
            });
            
            updateProgress(100);
            
            // Pequeño delay para mostrar el 100%
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // ✅ Al cargar archivo, ocultar la tabla para mejor performance
            // El usuario puede mostrarla con el botón si lo desea
            actualizarTabla('ocultar');
            hideLoading();
            
            document.getElementById('fileStatus').innerHTML = 
                `<div class="status-message info">✅ ${nuevasConfiguraciones.length} registros importados</div>`;
            
            mostrarMensaje(`Se cargaron ${nuevasConfiguraciones.length} configuraciones`, 'success');
        } catch (error) {
            hideLoading();
            mostrarMensaje('Error al procesar el archivo', 'error');
            console.error('Error:', error);
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}

function agregarOpcionSiNoExiste(tipo, valor) {
    if (!valor || valor === '') return;
    
    let selectElement;
    switch(tipo) {
        case 'campaign':
            selectElement = document.getElementById('campaignId');
            break;
        case 'wavy':
            selectElement = document.getElementById('wavyUser');
            break;
        case 'campana':
            selectElement = document.getElementById('reporteCampana');
            break;
        case 'codigo':
            selectElement = document.getElementById('reporteCodCampana');
            break;
        case 'producto':
            selectElement = document.getElementById('reporteProducto');
            break;
    }
    
    if (selectElement && !Array.from(selectElement.options).some(opt => opt.value === valor)) {
        const option = new Option(valor, valor);
        selectElement.add(option);
    }
}