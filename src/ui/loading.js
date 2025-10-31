// src/ui/loading.js
// Funciones para el overlay de carga y barra de progreso

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
            progressFill.style.width = '0%';
            progressBar.style.display = 'block';
            progressBar.offsetHeight; // Forzar reflow
        } else if (progressBar) {
            progressBar.style.display = 'none';
        }
        
        overlay.classList.add('active');
    }
}

export function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
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