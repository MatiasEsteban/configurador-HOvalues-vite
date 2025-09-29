// Funciones de interfaz de usuario
import { getConfiguraciones } from './state.js';

export function showLoading(text = 'Procesando', subtext = 'Por favor espere...', showProgress = false) {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const loadingSubtext = document.getElementById('loadingSubtext');
    const progressBar = document.getElementById('progressBar');
    
    if (overlay && loadingText && loadingSubtext) {
        loadingText.textContent = text;
        loadingSubtext.textContent = subtext;
        progressBar.style.display = showProgress ? 'block' : 'none';
        overlay.classList.add('active');
    }
}

export function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = percent + '%';
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

export function actualizarTabla() {
    const tbody = document.getElementById('tableBody');
    const configuraciones = getConfiguraciones();
    
    const fragment = document.createDocumentFragment();
    
    configuraciones.forEach((config, index) => {
        const row = document.createElement('tr');
        
        if (config.TipoVisual === 'nuevo') {
            row.classList.add('nuevo-registro');
        } else if (config.TipoVisual === 'editado') {
            row.classList.add('registro-editado');
        }
        
        row.innerHTML = `
            <td>${config.HandoffValue}</td>
            <td>${config.ChannelId}</td>
            <td>${config.VirtualCC}</td>
            <td>${config.CampaignId}</td>
            <td>${config.WavyUser}</td>
            <td>${config.Reporte_Campana}</td>
            <td>${config.Reporte_Producto}</td>
            <td>${config.Reporte_Cod_Campana}</td>
            <td>${config.Peso}</td>
            <td>${config.Estado || 'Nuevo'}</td>
            <td>
                <button class="edit-btn" data-index="${index}">✏️</button>
                <button class="delete-btn" data-index="${index}">🗑️</button>
            </td>
        `;
        
        fragment.appendChild(row);
    });
    
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
    
    const total = configuraciones.length;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('totalRows').textContent = total;
    document.getElementById('visibleRows').textContent = total;
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
    
    let duplicadosHtml = '';
    if (stats.duplicados.length > 0) {
        const duplicadosUnicos = [...new Set(stats.duplicados)];
        duplicadosHtml = `
            <div style="background: var(--warning-bg); padding: 12px; border-radius: 8px; margin: 10px 0; color: var(--warning-text);">
                <strong>⚠️ Duplicados ignorados (${stats.duplicados.length}):</strong><br>
                <small>${duplicadosUnicos.join(', ')}</small>
            </div>
        `;
    }
    
    let nuevosHtml = '';
    if (stats.nuevos.length > 0) {
        nuevosHtml = `
            <div style="background: var(--success-bg); padding: 12px; border-radius: 8px; margin: 10px 0; color: var(--success-text);">
                <strong>✅ Nuevos (${stats.nuevos.length}):</strong><br>
                <small>${stats.nuevos.slice(0, 10).join(', ')}${stats.nuevos.length > 10 ? '...' : ''}</small>
            </div>
        `;
    }
    
    let actualizadosHtml = '';
    if (stats.actualizados.length > 0) {
        actualizadosHtml = `
            <div style="background: var(--info-bg); padding: 12px; border-radius: 8px; margin: 10px 0; color: var(--info-text);">
                <strong>🔄 Actualizados (${stats.actualizados.length}):</strong><br>
                <small>${stats.actualizados.slice(0, 10).join(', ')}${stats.actualizados.length > 10 ? '...' : ''}</small>
            </div>
        `;
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
            ${duplicadosHtml}
            ${nuevosHtml}
            ${actualizadosHtml}
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
    
    if (html.getAttribute('data-theme') === 'dark') {
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