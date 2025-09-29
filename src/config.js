// Configuraciones y constantes de la aplicación
export const MAPEO_REPORTES = {
    'Portabilidad': 'Movil_Portabilidad',
    'Cambio de Plan': 'Movil_Cambio Plan',
    'Migra Positiva': 'Movil_Migracion',
    'Linea nueva con Factura': 'Movil_Linea Nueva',
    'Linea nueva Prepago': 'Movil_Linea Nueva Prepago',
    'Compra de Equipo': 'Movil_Cambio Equipo',
    'Internet/TV': 'Fija_Alta'
};

export const MAPEO_PRODUCTO = {
    'Movil_Portabilidad': 'Movil',
    'Movil_Cambio Plan': 'Movil',
    'Movil_Migracion': 'Movil',
    'Movil_Linea Nueva': 'Movil',
    'Movil_Linea Nueva Prepago': 'Movil',
    'Movil_Cambio Equipo': 'Movil',
    'Fija_Alta': 'Fijo'
};

export const BATCH_SIZE = 100;
export const FILE_BATCH_SIZE = 200;
export const LOADING_THRESHOLD = 50;
export const LARGE_FILE_THRESHOLD = 1000;