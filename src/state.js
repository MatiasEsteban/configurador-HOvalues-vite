// Estado global de la aplicación - OPTIMIZADO CON RENDERIZADO BAJO DEMANDA
export const state = {
    configuraciones: [],
    selectedChannels: [],
    archivoTemporal: null,
    tablaVisible: false, // ✅ NUEVO: Controla si la tabla está renderizada
    ultimoIndiceRenderizado: 0 // ✅ NUEVO: Para renderizado incremental
};

export function getConfiguraciones() {
    return state.configuraciones;
}

export function setConfiguraciones(configs) {
    state.configuraciones = configs;
    // Al setear configuraciones (cargar archivo), resetear índice
    state.ultimoIndiceRenderizado = 0;
}

export function addConfiguraciones(configs) {
    state.configuraciones.push(...configs);
}

export function removeConfiguracion(index) {
    state.configuraciones.splice(index, 1);
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

// ✅ NUEVAS FUNCIONES PARA CONTROL DE VISIBILIDAD
export function isTablaVisible() {
    return state.tablaVisible;
}

export function setTablaVisible(visible) {
    state.tablaVisible = visible;
}

export function getUltimoIndiceRenderizado() {
    return state.ultimoIndiceRenderizado;
}

export function setUltimoIndiceRenderizado(index) {
    state.ultimoIndiceRenderizado = index;
}