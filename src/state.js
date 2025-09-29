// Estado global de la aplicación
export const state = {
    configuraciones: [],
    selectedChannels: [],
    archivoTemporal: null
};

export function getConfiguraciones() {
    return state.configuraciones;
}

export function setConfiguraciones(configs) {
    state.configuraciones = configs;
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