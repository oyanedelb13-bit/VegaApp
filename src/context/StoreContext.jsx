'use client';
import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
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

    case 'CREATE_CAMION': {
      const newCamion = {
        id: generateId(),
        nombre: action.payload.nombre,
        fecha: action.payload.fecha,
        estado: 'abierto',
        productos: [],
        createdAt: new Date().toISOString()
      };
      const camiones = [newCamion, ...state.camiones];
      return { ...state, camiones, activeCamionId: newCamion.id };
    }

    case 'CLOSE_CAMION': {
      const camiones = state.camiones.map(c =>
        c.id === state.activeCamionId
          ? { ...c, estado: 'cerrado', closedAt: new Date().toISOString() }
          : c
      );
      return { ...state, camiones };
    }

    case 'SET_ACTIVE_CAMION':
      return { ...state, activeCamionId: action.payload };

    case 'UPDATE_CAMION_PRODUCTOS': {
      const camiones = state.camiones.map(c =>
        c.id === state.activeCamionId
          ? { ...c, productos: action.payload }
          : c
      );
      return { ...state, camiones };
    }

    case 'ADD_PRODUCTO': {
      const producto = { id: generateId(), ...action.payload, activo: true };
      return { ...state, productos: [...state.productos, producto] };
    }

    case 'UPDATE_PRODUCTO': {
      const productos = state.productos.map(p =>
        p.id === action.payload.id ? { ...p, ...action.payload } : p
      );
      return { ...state, productos };
    }

    case 'ADD_CLIENTE': {
      const cliente = { id: generateId(), ...action.payload };
      return { ...state, clientes: [...state.clientes, cliente] };
    }

    case 'DELETE_CLIENTE': {
      const id = action.payload;
      return {
        ...state,
        clientes: state.clientes.filter(c => c.id !== id),
        pedidos: state.pedidos.filter(p => p.clienteId !== id)
      };
    }

    case 'ADD_PEDIDO': {
      const pedido = {
        id: generateId(),
        camionId: state.activeCamionId,
        clienteId: action.payload.clienteId,
        items: action.payload.items,
        estado: 'pendiente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { ...state, pedidos: [pedido, ...state.pedidos] };
    }

    case 'UPDATE_PEDIDO': {
      const pedidos = state.pedidos.map(p =>
        p.id === action.payload.id
          ? { ...p, ...action.payload, updatedAt: new Date().toISOString() }
          : p
      );
      return { ...state, pedidos };
    }

    case 'UPDATE_STOCK': {
      const { productoId, cantidad, operacion } = action.payload;
      const camiones = state.camiones.map(c => {
        if (c.id !== state.activeCamionId) return c;
        const productos = (c.productos || []).map(p => {
          if (p.productoId !== productoId) return p;
          const cur = p.reservado || 0;
          return { ...p, reservado: operacion === 'add' ? cur + cantidad : Math.max(0, cur - cantidad) };
        });
        if (!productos.find(p => p.productoId === productoId) && operacion === 'add') {
          productos.push({ productoId, stockTotal: 0, reservado: cantidad });
        }
        return { ...c, productos };
      });
      return { ...state, camiones };
    }

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

  useEffect(() => {
    if (!state.activeCamionId) return;
    const camion = state.camiones.find(c => c.id === state.activeCamionId);
    if (camion) {
      api.updateCamionProductos(state.activeCamionId, camion.productos || []).catch(console.error);
    }
  }, [state.camiones, state.activeCamionId]);

  useEffect(() => {
    state.camiones.forEach(c => {
      if (c.estado === 'cerrado' && c.closedAt) {
        api.updateCamion(c.id, { estado: 'cerrado', closedAt: c.closedAt }).catch(console.error);
      }
    });
  }, [state.camiones]);

  useEffect(() => {
    if (state.pedidos.length > 0) {
      const last = state.pedidos[0];
      if (last && last.createdAt === last.updatedAt) {
        api.createPedido(last).catch(console.error);
      } else if (last) {
        api.updatePedido(last.id, { estado: last.estado }).catch(console.error);
      }
    }
  }, [state.pedidos]);

  useEffect(() => {
    if (state.productos.length > 0) {
      const last = state.productos[state.productos.length - 1];
      if (last) {
        api.createProducto(last).catch(console.error);
      }
    }
  }, [state.productos.length]);

  useEffect(() => {
    if (state.clientes.length > 0) {
      const last = state.clientes[state.clientes.length - 1];
      if (last) {
        api.createCliente(last).catch(console.error);
      }
    }
  }, [state.clientes.length]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
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
