// src/state.js
// Estado global de la aplicación - OPTIMIZADO CON PAGINACIÓN Y BÚSQUEDA O(1)

import { FILAS_POR_PAGINA } from "./config.js";

export const state = {
    // === ESTADO DE DATOS ===
    configuraciones: [],      // Fuente de verdad. 10,000+ filas
    handoffMap: new Map(),      // Mapa para búsqueda O(1). Map<HandoffValue, Config[]>
    selectedChannels: [],
    archivoTemporal: null,

    // === ESTADO DE VISTA (PAGINACIÓN Y FILTROS) ===
    datosFiltrados: [],       // Array para resultados de búsqueda
    esBusqueda: false,        // Flag para saber si estamos en modo búsqueda
    paginaActual: 1,
    totalPaginas: 0,
    filasPorPagina: FILAS_POR_PAGINA
};

// --- GETTERS Y SETTERS DE DATOS ---

export function getConfiguraciones() {
    return state.configuraciones;
}

export function setConfiguraciones(configs) {
    state.configuraciones = configs;
    // Al setear, recalcular paginación
    actualizarPaginacion();
}

export function addConfiguraciones(configs) {
    state.configuraciones.push(...configs);
    // No recalcular paginación aquí, se hace en el dataManager
}

export function removeConfiguracion(index) {
    state.configuraciones.splice(index, 1);
    // No recalcular paginación aquí, se hace en el dataManager
}

export function getHandoffMap() {
    return state.handoffMap;
}

export function setHandoffMap(map) {
    state.handoffMap = map;
}

export function getSelectedChannels() {
    return state.selectedChannels;
}

export function setSelectedChannels(channels) {
    state.selectedChannels = channels;
}

export function addSelectedChannel(channel) {
    if (!state.selectedChannels.includes(channel)) {
        state.selectedChannels.push(channel);
    }
}

export function removeSelectedChannel(channel) {
    const index = state.selectedChannels.indexOf(channel);
    if (index > -1) {
        state.selectedChannels.splice(index, 1);
    }
}

export function clearSelectedChannels() {
    state.selectedChannels = [];
}

export function setArchivoTemporal(file) {
    state.archivoTemporal = file;
}

export function getArchivoTemporal() {
    return state.archivoTemporal;
}

export function clearArchivoTemporal() {
    state.archivoTemporal = null;
}

// --- GETTERS Y SETTERS DE VISTA / FILTROS ---

export function setDatosFiltrados(configs) {
    state.datosFiltrados = configs;
    actualizarPaginacion(); // Recalcular paginación para los datos filtrados
}

export function setEsBusqueda(buscando) {
    state.esBusqueda = buscando;
    setPaginaActual(1); // Siempre resetear a página 1 al buscar o limpiar
}

export function isEsBusqueda() {
    return state.esBusqueda;
}

export function getDatosFuente() {
    // Devuelve los datos correctos (filtrados o completos)
    return state.esBusqueda ? state.datosFiltrados : state.configuraciones;
}

// --- GETTERS Y SETTERS DE PAGINACIÓN ---

export function getPaginaActual() {
    return state.paginaActual;
}

export function setPaginaActual(pagina) {
    if (pagina < 1) {
        state.paginaActual = 1;
    } else if (pagina > state.totalPaginas) {
        state.paginaActual = state.totalPaginas;
    } else {
        state.paginaActual = pagina;
    }
}

export function getTotalPaginas() {
    return state.totalPaginas;
}

export function getFilasPorPagina() {
    return state.filasPorPagina;
}

export function actualizarPaginacion() {
    const totalFilas = getDatosFuente().length;
    state.totalPaginas = Math.ceil(totalFilas / state.filasPorPagina);
    if (state.totalPaginas === 0) state.totalPaginas = 1; // Siempre al menos 1 página
    
    // Corregir página actual si está fuera de rango (ej. al eliminar el último ítem)
    if (state.paginaActual > state.totalPaginas) {
        state.paginaActual = state.totalPaginas;
    }
}