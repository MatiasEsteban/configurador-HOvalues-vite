// src/fileHandler.js
// Manejo de carga de archivos - CORREGIDO CON DETECCIÓN AUTOMÁTICA DE DELIMITADOR

import { 
    setConfiguraciones, 
    getConfiguraciones, 
    setArchivoTemporal, 
    clearArchivoTemporal,
    setHandoffMap
} from './state.js';
import { showLoading, hideLoading, updateProgress } from './ui/loading.js';
import { mostrarMensaje, mostrarPopupEstadisticas } from './ui/messaging.js';
import { renderizarPagina } from './ui/tableRenderer.js';
import { FILE_BATCH_SIZE } from './config.js';

/**
 * ✅ NUEVO: Detecta automáticamente el delimitador (coma o punto y coma)
 */
function detectarDelimitador(linea) {
    const comas = (linea.match(/,/g) || []).length;
    const puntoYComa = (linea.match(/;/g) || []).length;
    
    // Si hay más punto y coma que comas, usar punto y coma.
    // Esto funciona incluso si hay comas dentro de un campo (aunque no las maneja bien)
    if (puntoYComa > comas) {
        return ';';
    }
    // Si hay más comas (o igual y > 0), usar coma.
    if (comas > 0) {
        return ',';
    }
    // Default (si no hay ninguno)
    return ';';
}


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
    // ... (Esta función está bien, no se necesita cambiar) ...
    // ... (Código idéntico al anterior) ...
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay active';
    overlay.style.zIndex = '10000';
    
    const content = document.createElement('div');
    content.className = 'loading-content';
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
            <button class="confirm-replace" style="padding: 12px 25px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
                🗑️ Sí, reemplazar datos
            </button>
            <button class="cancel-load" style="padding: 12px 25px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
                ❌ Cancelar
            </button>
        </div>
    `;
    
    const confirmBtn = content.querySelector('.confirm-replace');
    const cancelBtn = content.querySelector('.cancel-load');
    
    confirmBtn.addEventListener('click', () => {
        setConfiguraciones([]);
        setHandoffMap(new Map());
        clearArchivoTemporal();
        procesarArchivo(file);
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
    console.log("Comenzando a procesar el archivo..."); // DEBUG

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                hideLoading();
                mostrarMensaje('El archivo está vacío', 'error');
                console.warn("El archivo está vacío o tiene menos de 2 líneas.");
                return;
            }
            
            // ===== CORRECCIÓN DE DELIMITADOR Y DEBUGGING =====
            
            // 1. Sanitizar BOM (igual que antes)
            const primeraLinea = lines[0].replace(/^\uFEFF/, '').trim();
            
            // 2. Detectar delimitador
            const delimitador = detectarDelimitador(primeraLinea);
            console.log("Delimitador detectado:", delimitador === ';' ? "Punto y coma (;)" : "Coma (,)");
            
            // 3. Parsear cabeceras
            const headers = primeraLinea.split(delimitador).map(h => h.trim());
            console.log("Cabeceras (headers) parseadas:", headers);
            
            // ===== FIN DE LA CORRECCIÓN =====

            const valoresUnicosSelects = new Set();
            const nuevasConfiguraciones = [];
            const nuevoHandoffMap = new Map();

            updateProgress(0);
            
            for (let i = 1; i < lines.length; i += FILE_BATCH_SIZE) {
                const batch = lines.slice(i, i + FILE_BATCH_SIZE);
                const progress = Math.round(((i + batch.length) / lines.length) * 100);
                updateProgress(progress);
                
                await new Promise(resolve => setTimeout(resolve, 10));
                
                batch.forEach((line, batchIndex) => {
                    const values = line.split(delimitador); // Usar delimitador detectado
                    if (values.length >= headers.length) {
                        const config = {};
                        headers.forEach((header, index) => {
                            config[header] = values[index] ? values[index].trim() : '';
                        });
                        config.Estado = 'Original';
                        nuevasConfiguraciones.push(config);
                        
                        const hoValue = config.HandoffValue;
                        if (hoValue) {
                            if (!nuevoHandoffMap.has(hoValue)) {
                                nuevoHandoffMap.set(hoValue, []);
                            }
                            nuevoHandoffMap.get(hoValue).push(config);
                        }
                        
                        // DEBUG: Loguear el primer objeto config
                        if (i === 1 && batchIndex === 0) {
                            console.log("Objeto 'config' de muestra (fila 1):", config);
                        }
                        
                        // Poblar selects
                        if (config.CampaignId) valoresUnicosSelects.add(`campaign:${config.CampaignId}`);
                        if (config.WavyUser) valoresUnicosSelects.add(`wavy:${config.WavyUser}`);
                        if (config.Reporte_Campana) valoresUnicosSelects.add(`campana:${config.Reporte_Campana}`);
                        if (config.Reporte_Cod_Campana) valoresUnicosSelects.add(`codigo:${config.Reporte_Cod_Campana}`);
                        if (config.Reporte_Producto) valoresUnicosSelects.add(`producto:${config.Reporte_Producto}`);
                    }
                });
            }
            
            // DEBUG: Loguear totales
            console.log("Total de configuraciones parseadas:", nuevasConfiguraciones.length);
            console.log("Tamaño del HandoffMap:", nuevoHandoffMap.size);
            if (nuevoHandoffMap.size > 0) {
                console.log("Ejemplo de entrada del Map (HandoffValue -> configs):", nuevoHandoffMap.entries().next().value);
            }

            // Guardar todo en el estado central
            setConfiguraciones(nuevasConfiguraciones);
            setHandoffMap(nuevoHandoffMap);
            
            valoresUnicosSelects.forEach(valor => {
                const [tipo, contenido] = valor.split(':');
                agregarOpcionSiNoExiste(tipo, contenido);
            });
            
            updateProgress(100);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            renderizarPagina();
            
            hideLoading();
            
            document.getElementById('fileStatus').innerHTML = 
                `<div class="status-message info">✅ ${nuevasConfiguraciones.length} registros importados</div>`;
            
            mostrarMensaje(`Se cargaron ${nuevasConfiguraciones.length} configuraciones`, 'success');
        
        } catch (error) {
            hideLoading();
            mostrarMensaje('Error al procesar el archivo. Revisa la consola (F12).', 'error');
            console.error('Error procesando el archivo:', error);
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}

function agregarOpcionSiNoExiste(tipo, valor) {
    if (!valor || valor === '') return;
    
    let selectElement;
    switch(tipo) {
        case 'campaign': selectElement = document.getElementById('campaignId'); break;
        case 'wavy': selectElement = document.getElementById('wavyUser'); break;
        case 'campana': selectElement = document.getElementById('reporteCampana'); break;
        case 'codigo': selectElement = document.getElementById('reporteCodCampana'); break;
        case 'producto': selectElement = document.getElementById('reporteProducto'); break;
    }
    
    if (selectElement && !Array.from(selectElement.options).some(opt => opt.value === valor)) {
        const option = new Option(valor, valor);
        selectElement.add(option);
    }
}