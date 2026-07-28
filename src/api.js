const API_BASE = '/api';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

export const api = {
  getCamiones: () => apiGet('/camiones'),
  createCamion: (c) => apiPost('/camiones', c).then(() => c),
  updateCamion: (id, data) => apiPut(`/camiones/${id}`, data),
  updateCamionProductos: (id, productos) => apiPut(`/camiones/${id}/productos`, { productos }),
  getProductos: () => apiGet('/productos'),
  createProducto: (p) => apiPost('/productos', p).then(() => p),
  updateProducto: (id, data) => apiPut(`/productos/${id}`, data),
  getClientes: () => apiGet('/clientes'),
  createCliente: (c) => apiPost('/clientes', c).then(() => c),
  deleteCliente: (id) => apiDelete(`/clientes/${id}`),
  getPedidos: (camionId) => apiGet(`/pedidos${camionId ? `?camion_id=${camionId}` : ''}`),
  createPedido: (p) => apiPost('/pedidos', p).then(() => p),
  updatePedido: (id, data) => apiPut(`/pedidos/${id}`, data)
};
