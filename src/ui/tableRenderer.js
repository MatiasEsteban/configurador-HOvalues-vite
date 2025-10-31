// src/ui/tableRenderer.js
// Renderizado de la tabla con paginación

import { 
    getDatosFuente, 
    getPaginaActual,
    getTotalPaginas,
    getFilasPorPagina,
    isEsBusqueda
} from '../state.js';

/**
 * Renderiza la página actual de datos en la tabla.
 * Esta es la ÚNICA función que debe escribir en `tableBody`.
 */
export function renderizarPagina() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = ''; // Limpiar siempre
    
    const datosFuente = getDatosFuente();
    const paginaActual = getPaginaActual();
    const filasPorPagina = getFilasPorPagina();
    
    // Calcular el slice de datos para la página actual
    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = paginaActual * filasPorPagina;
    const filasPagina = datosFuente.slice(inicio, fin);
    
    if (filasPagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--text-secondary);">
            No hay configuraciones para mostrar.
        </td></tr>`;
    } else {
        const fragment = document.createDocumentFragment();
        filasPagina.forEach((config, index) => {
            // El índice debe ser el índice REAL en el array de datosFuente
            const indiceReal = inicio + index;
            const row = crearFila(config, indiceReal);
            fragment.appendChild(row);
        });
        tbody.appendChild(fragment);
    }
    
    // Actualizar contadores e info de paginación
    actualizarControlesUI(datosFuente.length, filasPagina.length);
}

/**
 * Crea un elemento <tr> para una configuración.
 * @param {object} config - El objeto de configuración.
 * @param {number} index - El índice real del item en `datosFuente`.
 * @returns {HTMLTableRowElement}
 */
function crearFila(config, index) {
    const row = document.createElement('tr');
    
    // Aplicar clases CSS según el estado
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
        td.textContent = text || ''; // Asegurar que no sea undefined
        row.appendChild(td);
    });
    
    // Última celda con botones de acción
    const tdActions = document.createElement('td');
    // IMPORTANTE: data-index ahora es el índice real
    tdActions.innerHTML = `
        <button class="edit-btn" data-index="${index}">✏️</button>
        <button class="delete-btn" data-index="${index}">🗑️</button>
    `;
    row.appendChild(tdActions);
    
    return row;
}

/**
 * Actualiza los contadores de la tabla y los botones de paginación.
 */
function actualizarControlesUI(totalFilas, filasVisibles) {
    const paginaActual = getPaginaActual();
    const totalPaginas = getTotalPaginas();
    const esBusqueda = isEsBusqueda();

    // Contadores de filas
    document.getElementById('totalCount').textContent = totalFilas;
    document.getElementById('totalRows').textContent = totalFilas;
    document.getElementById('visibleRows').textContent = filasVisibles;
    
    // Mensaje de búsqueda
    const searchStatus = document.getElementById('searchStatus');
    if (esBusqueda) {
        searchStatus.textContent = `(Mostrando ${totalFilas} resultados de búsqueda)`;
    } else {
        searchStatus.textContent = '';
    }
    
    // Info de paginación
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    
    // Botones de paginación
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    prevPageBtn.disabled = (paginaActual === 1);
    nextPageBtn.disabled = (paginaActual === totalPaginas);
}

/**
 * Resalta visualmente las filas que coinciden con la búsqueda.
 * (Esta es una alternativa a filtrar, si se prefiere solo resaltar)
 */
export function resaltarFilas(indices) {
    const tbody = document.getElementById('tableBody');
    const rows = tbody.getElementsByTagName('tr');
    const indexSet = new Set(indices);

    // Primero limpiar resaltados anteriores
    for (let row of rows) {
        row.classList.remove('highlight-search');
    }

    // Aplicar nuevo resaltado
    if (indices.length > 0) {
        for (let row of rows) {
            const index = parseInt(row.querySelector('.edit-btn')?.dataset.index);
            if (indexSet.has(index)) {
                row.classList.add('highlight-search');
            }
        }
        // Opcional: scroll al primer elemento encontrado
        const firstRow = tbody.querySelector('.highlight-search');
        if (firstRow) {
            firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}