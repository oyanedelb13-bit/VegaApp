'use client';
import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { PRODUCTOS_BASE, CLIENTES_BASE } from '../data/initialData';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const StoreContext = createContext(null);

const initialState = {
  camiones: [],
  activeCamionId: null,
  productos: [],
  clientes: [],
  pedidos: [],
  toast: null,
  isLoading: true
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_DATA':
      return {
        ...state,
        camiones: action.payload.camiones,
        activeCamionId: action.payload.activeCamionId,
        productos: action.payload.productos,
        clientes: action.payload.clientes,
        pedidos: action.payload.pedidos,
        isLoading: false
      };

    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };

    case 'HIDE_TOAST':
      return { ...state, toast: null };

    case 'SET_CAMIONES':
      return { ...state, camiones: action.payload };

    case 'SET_ACTIVE_CAMION':
      return { ...state, activeCamionId: action.payload };

    case 'SET_PRODUCTOS':
      return { ...state, productos: action.payload };

    case 'SET_CLIENTES':
      return { ...state, clientes: action.payload };

    case 'SET_PEDIDOS':
      return { ...state, pedidos: action.payload };

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        const [camiones, productos, clientes, pedidos] = await Promise.all([
          api.getCamiones(),
          api.getProductos(),
          api.getClientes(),
          api.getPedidos()
        ]);

        let finalProductos = productos;
        if (finalProductos.length === 0) {
          for (const p of PRODUCTOS_BASE) {
            await api.createProducto(p);
          }
          finalProductos = await api.getProductos();
        }

        let finalClientes = clientes;
        if (finalClientes.length === 0) {
          for (const c of CLIENTES_BASE) {
            await api.createCliente(c);
          }
          finalClientes = await api.getClientes();
        }

        let activeCamionId = null;
        let finalCamiones = camiones;
        if (finalCamiones.length === 0) {
          const today = new Date();
          const dayName = today.toLocaleDateString('es-CL', { weekday: 'long' });
          const dateStr = today.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
          const newCamion = {
            id: generateId(),
            nombre: `Camion ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dateStr}`,
            fecha: today.toISOString(),
            estado: 'abierto'
          };
          await api.createCamion(newCamion);
          finalCamiones = await api.getCamiones();
        }
        const openCamion = finalCamiones.find(c => c.estado === 'abierto');
        activeCamionId = openCamion ? openCamion.id : finalCamiones[0]?.id || null;

        dispatch({
          type: 'INIT_DATA',
          payload: { camiones: finalCamiones, activeCamionId, productos: finalProductos, clientes: finalClientes, pedidos }
        });
      } catch (err) {
        console.error('API init error:', err);
      }
    }
    init();
  }, []);

  const crearCamion = useCallback(async (nombre, fecha) => {
    const id = generateId();
    const camion = { id, nombre, fecha, estado: 'abierto', productos: [] };
    await api.createCamion(camion);
    const camiones = await api.getCamiones();
    dispatch({ type: 'SET_CAMIONES', payload: camiones });
    dispatch({ type: 'SET_ACTIVE_CAMION', payload: id });
    return id;
  }, []);

  const cerrarCamion = useCallback(async () => {
    const camion = state.camiones.find(c => c.id === state.activeCamionId);
    if (!camion) return;
    await api.updateCamion(camion.id, { estado: 'cerrado', closedAt: new Date().toISOString() });
    const camiones = await api.getCamiones();
    dispatch({ type: 'SET_CAMIONES', payload: camiones });
  }, [state.activeCamionId, state.camiones]);

  const deleteCamion = useCallback(async (camionId) => {
    await api.deleteCamion(camionId);
    const camiones = await api.getCamiones();
    dispatch({ type: 'SET_CAMIONES', payload: camiones });
    if (state.activeCamionId === camionId) {
      const openCamion = camiones.find(c => c.estado === 'abierto');
      dispatch({ type: 'SET_ACTIVE_CAMION', payload: openCamion?.id || camiones[0]?.id || null });
    }
  }, [state.activeCamionId]);

  const setActiveCamion = useCallback(async (camionId) => {
    dispatch({ type: 'SET_ACTIVE_CAMION', payload: camionId });
  }, []);

  const updateCamionProductos = useCallback(async (productos) => {
    if (!state.activeCamionId) return;
    await api.updateCamionProductos(state.activeCamionId, productos);
    const camiones = await api.getCamiones();
    dispatch({ type: 'SET_CAMIONES', payload: camiones });
  }, [state.activeCamionId]);

  const crearPedido = useCallback(async (clienteId, items) => {
    const pedido = {
      id: generateId(),
      camionId: state.activeCamionId,
      clienteId,
      items,
      estado: 'pendiente'
    };
    await api.createPedido(pedido);
    const pedidos = await api.getPedidos();
    dispatch({ type: 'SET_PEDIDOS', payload: pedidos });
    return pedido.id;
  }, [state.activeCamionId]);

  const updatePedido = useCallback(async (id, data) => {
    await api.updatePedido(id, data);
    const pedidos = await api.getPedidos();
    dispatch({ type: 'SET_PEDIDOS', payload: pedidos });
  }, []);

  const deletePedido = useCallback(async (id) => {
    await api.deletePedido(id);
    const pedidos = await api.getPedidos();
    dispatch({ type: 'SET_PEDIDOS', payload: pedidos });
  }, []);

  const crearCliente = useCallback(async (nombre) => {
    const id = generateId();
    await api.createCliente({ id, nombre, telefono: '' });
    const clientes = await api.getClientes();
    dispatch({ type: 'SET_CLIENTES', payload: clientes });
    return id;
  }, []);

  const deleteCliente = useCallback(async (id) => {
    await api.deleteCliente(id);
    const clientes = await api.getClientes();
    const pedidos = await api.getPedidos();
    dispatch({ type: 'SET_CLIENTES', payload: clientes });
    dispatch({ type: 'SET_PEDIDOS', payload: pedidos });
  }, []);

  const crearProducto = useCallback(async (producto) => {
    const id = generateId();
    await api.createProducto({ id, ...producto, activo: true });
    const productos = await api.getProductos();
    dispatch({ type: 'SET_PRODUCTOS', payload: productos });
    return id;
  }, []);

  const updateProducto = useCallback(async (id, data) => {
    await api.updateProducto(id, data);
    const productos = await api.getProductos();
    dispatch({ type: 'SET_PRODUCTOS', payload: productos });
  }, []);

  const deleteProducto = useCallback(async (id) => {
    await api.deleteProducto(id);
    const productos = await api.getProductos();
    const camiones = await api.getCamiones();
    dispatch({ type: 'SET_PRODUCTOS', payload: productos });
    dispatch({ type: 'SET_CAMIONES', payload: camiones });
  }, []);

  const updateStock = useCallback(async (productoId, cantidad, operacion) => {
    const camion = state.camiones.find(c => c.id === state.activeCamionId);
    if (!camion) return;
    const productos = (camion.productos || []).map(p => {
      if (p.productoId !== productoId) return p;
      const cur = p.reservado || 0;
      return { ...p, reservado: operacion === 'add' ? cur + cantidad : Math.max(0, cur - cantidad) };
    });
    if (!productos.find(p => p.productoId === productoId) && operacion === 'add') {
      productos.push({ productoId, stockTotal: 0, reservado: cantidad });
    }
    await api.updateCamionProductos(state.activeCamionId, productos);
    const camiones = await api.getCamiones();
    dispatch({ type: 'SET_CAMIONES', payload: camiones });
  }, [state.activeCamionId, state.camiones]);

  const value = {
    state,
    dispatch,
    crearCamion,
    cerrarCamion,
    deleteCamion,
    setActiveCamion,
    updateCamionProductos,
    crearPedido,
    updatePedido,
    deletePedido,
    crearCliente,
    deleteCliente,
    crearProducto,
    updateProducto,
    deleteProducto,
    updateStock,
    showToast: useCallback((message, type = 'info', duration = 3000) => {
      dispatch({ type: 'SHOW_TOAST', payload: { message, type, duration } });
    }, []),
    hideToast: useCallback(() => {
      dispatch({ type: 'HIDE_TOAST' });
    }, [])
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}

export function useActiveCamion() {
  const { state } = useStore();
  return state.camiones.find(c => c.id === state.activeCamionId) || null;
}

export function useCamionProductos() {
  const { state } = useStore();
  const activeCamion = state.camiones.find(c => c.id === state.activeCamionId);
  if (!activeCamion) return [];
  return (activeCamion.productos || []).map(cp => {
    const producto = state.productos.find(p => p.id === cp.productoId);
    return { ...cp, producto };
  }).filter(cp => cp.producto);
}
