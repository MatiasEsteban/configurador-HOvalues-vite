// src/ui/messaging.js
// Funciones para mensajes de estado y popups

export function mostrarMensaje(mensaje, tipo) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = mensaje;
    statusDiv.className = `status-message ${tipo}`;
    
    setTimeout(() => {
        statusDiv.className = 'status-message';
        statusDiv.textContent = '';
    }, 4300);
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
        <button class="close-popup" style="margin-top: 20px; padding: 12px 30px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
            ✅ Entendido
        </button>
    `;
    
    content.querySelector('.close-popup').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
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
        <button class="close-popup" style="margin-top: 20px; padding: 10px 30px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
            Cerrar
        </button>
    `;
    
    content.querySelector('.close-popup').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
}