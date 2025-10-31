// src/config.js
// Configuraciones y constantes de la aplicación

export const MAPEO_REPORTES = {
    'Portabilidad': 'Movil_Portabilidad',
    'Cambio de Plan': 'Movil_Cambio Plan',
    'Migra Positiva': 'Movil_Migracion',
    'Linea nueva con Factura': 'Movil_Linea Nueva',
    'Linea nueva Prepago': 'Movil_Linea Nueva Prepago',
    'Compra de Equipo': 'Movil_Cambio Equipo',
    'Internet/TV': 'Fija_Alta',
    'Bienvenida CTW_Saliente': 'Generico_Bienvenida',
    'Movistar Fibra': 'Fija_Fibra',
    'Servicios Digitales': 'SSDD_Servicios_Digitales',
    'Móviles y celulares': 'Movil_Moviles_celulares'
};

export const MAPEO_PRODUCTO = {
    'Movil_Portabilidad': 'Movil',
    'Movil_Cambio Plan': 'Movil',
    'Movil_Migracion': 'Movil',
    'Movil_Linea Nueva': 'Movil',
    'Movil_Linea Nueva Prepago': 'Movil',
    'Movil_Cambio Equipo': 'Movil',
    'Fija_Alta': 'Fijo',
    'Generico_Bienvenida': 'Generico',
    'Fija_Fibra': 'Fija',
    'SSDD_Servicios_Digitales': 'SSDD',
    'Movil_Moviles_celulares': 'Movil'
};

// Constantes de performance
export const BATCH_SIZE = 100; // Para procesamiento de lógica
export const FILE_BATCH_SIZE = 200; // Para carga de archivo
export const LOADING_THRESHOLD = 50;
export const LARGE_FILE_THRESHOLD = 1000;
export const FILAS_POR_PAGINA = 100; // ✅ NUEVO: Para paginación