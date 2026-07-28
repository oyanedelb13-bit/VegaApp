const STORAGE_KEYS = {
  CAMIONES: 'hortalizas_camiones',
  PRODUCTOS: 'hortalizas_productos',
  CLIENTES: 'hortalizas_clientes',
  PEDIDOS: 'hortalizas_pedidos',
  ACTIVE_CAMION: 'hortalizas_activeCamionId'
};

function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

export function getCamiones() {
  return getItem(STORAGE_KEYS.CAMIONES, []);
}

export function setCamiones(camiones) {
  setItem(STORAGE_KEYS.CAMIONES, camiones);
}

export function getActiveCamionId() {
  return getItem(STORAGE_KEYS.ACTIVE_CAMION, null);
}

export function setActiveCamionId(id) {
  setItem(STORAGE_KEYS.ACTIVE_CAMION, id);
}

export function getProductos() {
  return getItem(STORAGE_KEYS.PRODUCTOS, []);
}

export function setProductos(productos) {
  setItem(STORAGE_KEYS.PRODUCTOS, productos);
}

export function getClientes() {
  return getItem(STORAGE_KEYS.CLIENTES, []);
}

export function setClientes(clientes) {
  setItem(STORAGE_KEYS.CLIENTES, clientes);
}

export function getPedidos() {
  return getItem(STORAGE_KEYS.PEDIDOS, []);
}

export function setPedidos(pedidos) {
  setItem(STORAGE_KEYS.PEDIDOS, pedidos);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
