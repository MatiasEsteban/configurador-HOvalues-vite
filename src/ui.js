// Funciones de interfaz de usuario - OPTIMIZADO CON RENDERIZADO BAJO DEMANDA
import { 
    getConfiguraciones, 
    isTablaVisible, 
    setTablaVisible, 
    getUltimoIndiceRenderizado, 
    setUltimoIndiceRenderizado 
} from './state.js';

export function showLoading(text = 'Procesando', subtext = 'Por favor espere...', showProgress = false) {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const loadingSubtext = document.getElementById('loadingSubtext');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    
    if (overlay && loadingText && loadingSubtext) {
        loadingText.textContent = text;
        loadingSubtext.textContent = subtext;
        
        if (showProgress && progressBar && progressFill) {
            // Resetear la barra a 0% antes de mostrarla
            progressFill.style.width = '0%';
            progressBar.style.display = 'block';
            // Forzar un reflow para que el navegador registre el cambio
            progressBar.offsetHeight;
        } else if (progressBar) {
            progressBar.style.display = 'none';
        }
        
        overlay.classList.add('active');
    }
}

export function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        // Usar requestAnimationFrame para asegurar que la actualización sea visible
        requestAnimationFrame(() => {
            progressFill.style.width = Math.min(100, Math.max(0, percent)) + '%';
        });
    }
}

export function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

export function mostrarMensaje(mensaje, tipo) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = mensaje;
    statusDiv.className = `status-message ${tipo}`;
    
    setTimeout(() => {
        statusDiv.className = 'status-message';
    }, 4300);
}

// OPTIMIZACIÓN CRÍTICA: Sistema de renderizado bajo demanda
export function actualizarTabla(modo = 'solo-nuevos') {
    const tbody = document.getElementById('tableBody');
    const configuraciones = getConfiguraciones();
    const total = configuraciones.length;
    
    // Actualizar contadores SIEMPRE (no requiere renderizado)
    document.getElementById('totalCount').textContent = total;
    document.getElementById('totalRows').textContent = total;
    document.getElementById('visibleRows').textContent = total;
    
    // Si modo es 'ocultar', limpiar tabla y salir
    if (modo === 'ocultar') {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--text-secondary);">📋 Tabla oculta para mejorar performance. Haz clic en "Mostrar Tabla" para visualizar.</td></tr>';
        setTablaVisible(false);
        return;
    }
    
    // Si modo es 'todos', renderizar todo desde cero
    if (modo === 'todos') {
        tbody.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        configuraciones.forEach((config, index) => {
            const row = crearFila(config, index);
            fragment.appendChild(row);
        });
        
        tbody.appendChild(fragment);
        setTablaVisible(true);
        setUltimoIndiceRenderizado(total);
        return;
    }
    
    // Modo 'solo-nuevos': renderizar solo desde el último índice
    const ultimoIndice = getUltimoIndiceRenderizado();
    
    if (ultimoIndice >= total) {
        // No hay nuevos elementos
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    for (let i = ultimoIndice; i < total; i++) {
        const row = crearFila(configuraciones[i], i);
        fragment.appendChild(row);
    }
    
    tbody.appendChild(fragment);
    setUltimoIndiceRenderizado(total);
}

// NUEVA FUNCIÓN: Crear una fila de la tabla (reutilizable)
function crearFila(config, index) {
    const row = document.createElement('tr');
    
    // Aplicar clases CSS según el tipo
    if (config.TipoVisual === 'nuevo') {
        row.classList.add('nuevo-registro');
    } else if (config.TipoVisual === 'editado') {
        row.classList.add('registro-editado');
    }
    
    // Crear celdas
    const cells = [
        config.HandoffValue,
        config.ChannelId,
        config.VirtualCC,
        config.CampaignId,
        config.WavyUser,
        config.Reporte_Campana,
        config.Reporte_Producto,
        config.Reporte_Cod_Campana,
        config.Peso,
        config.Estado || 'Nuevo'
    ];
    
    cells.forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
    });
    
    // Última celda con botones de acción
    const tdActions = document.createElement('td');
    tdActions.innerHTML = `
        <button class="edit-btn" data-index="${index}">✏️</button>
        <button class="delete-btn" data-index="${index}">🗑️</button>
    `;
    row.appendChild(tdActions);
    
    return row;
}

// NUEVA FUNCIÓN: Alternar visibilidad de la tabla
export function toggleTablaVisibilidad() {
    const visible = isTablaVisible();
    
    if (visible) {
        actualizarTabla('ocultar');
        return false;
    } else {
        actualizarTabla('todos');
        return true;
    }
}

export function mostrarPopupEstadisticas(stats, numCanales) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay active';
    overlay.style.zIndex = '10000';
    
    const content = document.createElement('div');
    content.className = 'loading-content';
    content.style.maxWidth = '600px';
    content.style.maxHeight = '80vh';
    content.style.overflow = 'auto';
    
    // OPTIMIZACIÓN: Construir HTML eficientemente
    const parts = [];
    
    // Duplicados
    if (stats.duplicados.length > 0) {
        const duplicadosUnicos = [...new Set(stats.duplicados)];
        parts.push(`
            <div style="background: var(--warning-bg); padding: 12px; border-radius: 8px; margin: 10px 0; color: var(--warning-text);">
                <strong>⚠️ Duplicados ignorados (${stats.duplicados.length}):</strong><br>
                <small>${duplicadosUnicos.join(', ')}</small>
            </div>
        `);
    }
    
    // Nuevos
    if (stats.nuevos.length > 0) {
        const preview = stats.nuevos.slice(0, 10).join(', ');
        const more = stats.nuevos.length > 10 ? '...' : '';
        parts.push(`
            <div style="background: var(--success-bg); padding: 12px; border-radius: 8px; margin: 10px 0; color: var(--success-text);">
                <strong>✅ Nuevos (${stats.nuevos.length}):</strong><br>
                <small>${preview}${more}</small>
            </div>
        `);
    }
    
    // Actualizados
    if (stats.actualizados.length > 0) {
        const preview = stats.actualizados.slice(0, 10).join(', ');
        const more = stats.actualizados.length > 10 ? '...' : '';
        parts.push(`
            <div style="background: var(--info-bg); padding: 12px; border-radius: 8px; margin: 10px 0; color: var(--info-text);">
                <strong>🔄 Actualizados (${stats.actualizados.length}):</strong><br>
                <small>${preview}${more}</small>
            </div>
        `);
    }
    
    content.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <div class="loading-text" style="color: var(--success-text); font-size: 22px; margin-bottom: 15px;">
            ¡Procesamiento completado!
        </div>
        <div style="text-align: left; margin: 20px 0;">
            <div style="background: var(--hover-bg); padding: 15px; border-radius: 8px; margin: 10px 0;">
                <strong>📈 Resumen:</strong><br>
                • Total configuraciones agregadas: <strong>${stats.totalConfiguraciones}</strong><br>
                • Canales seleccionados: <strong>${numCanales}</strong><br>
                • HandoffValues únicos procesados: <strong>${stats.nuevos.length + stats.actualizados.length}</strong>
            </div>
            ${parts.join('')}
        </div>
        <button class="close-popup" 
                style="margin-top: 20px; padding: 12px 30px; background: #28a745; 
                       color: white; border: none; border-radius: 8px; cursor: pointer;
                       font-size: 16px; font-weight: 600;">
            ✅ Entendido
        </button>
    `;
    
    content.querySelector('.close-popup').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Auto-cerrar después de 15 segundos
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 15000);
}

export function mostrarPopupNoEncontrado(termino) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay active';
    overlay.style.zIndex = '10000';
    
    const content = document.createElement('div');
    content.className = 'loading-content';
    content.style.background = 'var(--card-bg)';
    content.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
        <div class="loading-text" style="color: var(--error-text); font-size: 24px; margin-bottom: 10px;">
            Intent no encontrado
        </div>
        <div class="loading-subtext" style="color: var(--text-secondary);">
            No se encontró "${termino}" en las configuraciones
        </div>
        <button class="close-popup" 
                style="margin-top: 20px; padding: 10px 30px; background: #dc3545; 
                       color: white; border: none; border-radius: 8px; cursor: pointer;
                       font-size: 16px; font-weight: 600;">
            Cerrar
        </button>
    `;
    
    content.querySelector('.close-popup').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 3000);
}

export function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    const isDark = html.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        html.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Modo Oscuro';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Modo Claro';
        localStorage.setItem('theme', 'dark');
    }
}

export function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').textContent = '☀️';
        document.getElementById('themeText').textContent = 'Modo Claro';
    }
}