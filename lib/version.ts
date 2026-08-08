import pkg from "../package.json";

// Subir manualmente en package.json ("version") en cada release que quieras
// que se note en el menú lateral (ej: al cerrar una tanda de features).
export const APP_VERSION = pkg.version;
