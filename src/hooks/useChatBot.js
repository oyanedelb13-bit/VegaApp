'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../components/Toast';
import { api } from '../api';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function normalize(str) {
  return str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function findProductByName(name, productos) {
  const n = normalize(name);
  let match = productos.find(p => normalize(p.nombre) === n);
  if (match) return match;
  match = productos.find(p => normalize(p.nombre).includes(n) || n.includes(normalize(p.nombre)));
  if (match) return match;
  for (const p of productos) {
    const variants = p.nombreVariantes || [];
    if (variants.some(v => normalize(v) === n || normalize(v).includes(n) || n.includes(normalize(v)))) {
      return p;
    }
  }
  return null;
}

function findClientByName(name, clientes) {
  const n = normalize(name);
  let match = clientes.find(c => normalize(c.nombre) === n);
  if (match) return match;
  match = clientes.find(c => normalize(c.nombre).includes(n) || n.includes(normalize(c.nombre)));
  return match;
}

const MAX_ITEMS = 50;
const MAX_UNITS = 200;

function getToolSummary(toolCall, productos, clientes) {
  const { name, args } = toolCall;
  if (name === 'crear_pedido') {
    const cliente = findClientByName(args.cliente_nombre, clientes);
    const itemsResolved = (args.items || []).map(it => {
      const p = findProductByName(it.producto_nombre, productos);
      return { ...it, resolved: p, missing: !p };
    });
    const totalUnits = itemsResolved.reduce((s, it) => s + (it.cantidad || 0), 0);
    const warning = itemsResolved.length > MAX_ITEMS || totalUnits > MAX_UNITS
      ? `Cantidad inusual: ${itemsResolved.length} items, ${totalUnits} unidades`
      : null;
    return {
      title: 'Crear pedido',
      icon: '📦',
      fields: [
        { label: 'Cliente', value: args.cliente_nombre, ok: !!cliente },
      ],
      items: itemsResolved.map(it => ({
        emoji: it.resolved?.emoji || '❓',
        name: it.producto_nombre,
        detail: `${it.cantidad} ${it.resolved?.unidad || ''}${it.precio_unitario ? ' x $' + it.precio_unitario : ''}`,
        ok: !!it.resolved,
      })),
      warning,
    };
  }
  if (name === 'cargar_stock') {
    const itemsResolved = (args.items || []).map(it => {
      const p = findProductByName(it.producto_nombre, productos);
      return { ...it, resolved: p, missing: !p };
    });
    const totalUnits = itemsResolved.reduce((s, it) => s + (it.cantidad || 0), 0);
    const warning = itemsResolved.length > MAX_ITEMS || totalUnits > MAX_UNITS
      ? `Cantidad inusual: ${itemsResolved.length} items, ${totalUnits} unidades`
      : null;
    return {
      title: 'Cargar stock',
      icon: '📊',
      fields: [],
      items: itemsResolved.map(it => ({
        emoji: it.resolved?.emoji || '❓',
        name: it.producto_nombre,
        detail: `+${it.cantidad} ${it.resolved?.unidad || ''}`,
        ok: !!it.resolved,
      })),
      warning,
    };
  }
  if (name === 'crear_producto') {
    return {
      title: 'Crear producto',
      icon: '➕',
      fields: [
        { label: 'Nombre', value: args.nombre, ok: true },
        { label: 'Emoji', value: args.emoji || '(sin emoji)', ok: true },
        { label: 'Unidad', value: args.unidad, ok: true },
      ],
      items: [],
    };
  }
  if (name === 'crear_cliente') {
    return {
      title: 'Crear cliente',
      icon: '👤',
      fields: [
        { label: 'Nombre', value: args.nombre, ok: true },
        { label: 'Telefono', value: args.telefono || '(no indicado)', ok: true },
      ],
      items: [],
    };
  }
  if (name === 'actualizar_precio') {
    const p = findProductByName(args.producto_nombre, productos);
    return {
      title: 'Actualizar precio',
      icon: '💰',
      fields: [
        { label: 'Producto', value: args.producto_nombre, ok: !!p },
        { label: 'Nuevo precio', value: '$' + args.nuevo_precio, ok: true },
      ],
      items: [],
    };
  }
  if (name === 'eliminar_pedido') {
    return {
      title: 'Eliminar pedido',
      icon: '🗑️',
      fields: [
        { label: 'Pedido ID', value: args.pedido_id, ok: true },
        { label: 'Cliente', value: args.cliente_nombre || '(no indicado)', ok: true },
      ],
      items: [],
    };
  }
  if (name === 'eliminar_cliente') {
    return {
      title: 'Eliminar cliente',
      icon: '🗑️',
      fields: [
        { label: 'Cliente', value: args.cliente_nombre, ok: !!findClientByName(args.cliente_nombre, clientes) },
      ],
      items: [],
    };
  }
  return { title: name, icon: '⚙️', fields: [], items: [] };
}

export function useChatBot() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingTool, setPendingTool] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const addMessage = useCallback((role, content) => {
    setMessages(prev => [...prev, { id: genId(), role, content, ts: Date.now() }]);
  }, []);

  const sendToApi = useCallback(async (payload, isAudio = false) => {
    setIsLoading(true);
    try {
      let res;
      if (isAudio) {
        const fd = new FormData();
        fd.append('audio', payload, 'audio.webm');
        res = await fetch('/api/chat', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: payload }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en la API');

      if (data.transcription) {
        addMessage('assistant', `🎤 Transcripción: "${data.transcription}"`);
      }

      if (data.reply) addMessage('assistant', data.reply);

      if (data.toolCalls && data.toolCalls.length > 0) {
        const tc = data.toolCalls[0];
        setPendingTool(tc);
      }
    } catch (err) {
      addMessage('assistant', `Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const sendText = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    addMessage('user', text);
    await sendToApi(text, false);
  }, [input, isLoading, addMessage, sendToApi]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        addMessage('user', '🎤 Audio enviado');
        await sendToApi(blob, true);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      addMessage('assistant', `No se pudo acceder al microfono: ${err.message}`);
    }
  }, [addMessage, sendToApi]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const executeTool = useCallback(async (toolCall) => {
    const { name, args } = toolCall;
    try {
      if (name === 'crear_pedido') {
        let cliente = findClientByName(args.cliente_nombre, state.clientes);
        let clienteCreado = false;
        if (!cliente) {
          const newCliente = { id: genId(), nombre: args.cliente_nombre.trim(), telefono: args.cliente_telefono || '' };
          dispatch({ type: 'ADD_CLIENTE', payload: newCliente });
          api.createCliente(newCliente).catch(console.error);
          cliente = newCliente;
          clienteCreado = true;
        }
        const items = (args.items || []).map(it => {
          const p = findProductByName(it.producto_nombre, state.productos);
          return {
            productoId: p?.id || '',
            productoNombre: p?.nombre || it.producto_nombre,
            cantidad: it.cantidad,
            precioUnitario: it.precio_unitario || p?.precioDefault || 0,
          };
        }).filter(i => i.productoId);
        dispatch({ type: 'ADD_PEDIDO', payload: { clienteId: cliente.id, items } });
        items.forEach(it => {
          dispatch({ type: 'UPDATE_STOCK', payload: { productoId: it.productoId, cantidad: it.cantidad, operacion: 'add' } });
        });
        const resumen = items.map(i => `${i.cantidad} ${i.productoNombre}`).join(', ');
        let msg = `✅ Pedido creado para ${cliente.nombre}: ${resumen}`;
        if (clienteCreado) msg += ` (cliente nuevo)`;
        addMessage('assistant', msg);
        toast(`Pedido de ${cliente.nombre} creado`, 'success');
      } else if (name === 'cargar_stock') {
        const camion = state.camiones.find(c => c.id === state.activeCamionId);
        if (!camion) {
          addMessage('assistant', '❌ No hay camión activo para cargar stock');
          toast('No hay camion activo', 'error');
          return;
        }
        const updated = [...(camion.productos || [])];
        let count = 0;
        const itemsCargados = [];
        (args.items || []).forEach(it => {
          const p = findProductByName(it.producto_nombre, state.productos);
          if (!p) return;
          const idx = updated.findIndex(u => u.productoId === p.id);
          if (idx >= 0) updated[idx] = { ...updated[idx], stockTotal: updated[idx].stockTotal + it.cantidad };
          else updated.push({ productoId: p.id, stockTotal: it.cantidad, reservado: 0 });
          itemsCargados.push(`${it.cantidad} ${p.nombre}`);
          count++;
        });
        dispatch({ type: 'UPDATE_CAMION_PRODUCTOS', payload: updated });
        addMessage('assistant', `✅ Stock cargado en ${camion.nombre}: ${itemsCargados.join(', ')}`);
        toast(`Stock cargado (${count} productos)`, 'success');
      } else if (name === 'crear_producto') {
        const newProd = {
          id: genId(),
          nombre: args.nombre,
          emoji: args.emoji || '📦',
          unidad: args.unidad || 'unidad',
          activo: true,
          precioDefault: 0,
          nombreVariantes: [args.nombre.toLowerCase()],
        };
        dispatch({ type: 'ADD_PRODUCTO', payload: newProd });
        api.createProducto(newProd).catch(console.error);
        addMessage('assistant', `✅ Producto creado: ${args.emoji || '📦'} ${args.nombre} (${args.unidad})`);
        toast(`Producto ${args.nombre} creado`, 'success');
      } else if (name === 'crear_cliente') {
        const newCli = { id: genId(), nombre: args.nombre, telefono: args.telefono || '' };
        dispatch({ type: 'ADD_CLIENTE', payload: newCli });
        api.createCliente(newCli).catch(console.error);
        addMessage('assistant', `✅ Cliente creado: ${args.nombre}${args.telefono ? ' (' + args.telefono + ')' : ''}`);
        toast(`Cliente ${args.nombre} creado`, 'success');
      } else if (name === 'actualizar_precio') {
        const p = findProductByName(args.producto_nombre, state.productos);
        if (!p) {
          addMessage('assistant', `❌ No encontré el producto "${args.producto_nombre}"`);
          toast('Producto no encontrado', 'error');
          return;
        }
        dispatch({ type: 'UPDATE_PRODUCTO', payload: { id: p.id, precioDefault: args.nuevo_precio } });
        api.updateProducto(p.id, { precioDefault: args.nuevo_precio }).catch(console.error);
        addMessage('assistant', `✅ Precio de ${p.emoji} ${p.nombre} actualizado a $${args.nuevo_precio}`);
        toast(`Precio de ${p.nombre} actualizado`, 'success');
      } else if (name === 'eliminar_pedido') {
        const pedido = state.pedidos.find(p => p.id === args.pedido_id);
        if (!pedido) {
          addMessage('assistant', `❌ No encontré el pedido "${args.pedido_id}"`);
          toast('Pedido no encontrado', 'error');
          return;
        }
        dispatch({ type: 'UPDATE_PEDIDO', payload: { id: pedido.id, estado: 'cancelado' } });
        addMessage('assistant', `✅ Pedido ${args.pedido_id} cancelado`);
        toast('Pedido cancelado', 'success');
      } else if (name === 'eliminar_cliente') {
        const cliente = findClientByName(args.cliente_nombre, state.clientes);
        if (!cliente) {
          addMessage('assistant', `❌ No encontré el cliente "${args.cliente_nombre}"`);
          toast('Cliente no encontrado', 'error');
          return;
        }
        api.deleteCliente(cliente.id).catch(console.error);
        dispatch({ type: 'DELETE_CLIENTE', payload: cliente.id });
        addMessage('assistant', `✅ Cliente ${cliente.nombre} eliminado junto con sus pedidos`);
        toast(`Cliente ${cliente.nombre} eliminado`, 'success');
      }
    } catch (err) {
      addMessage('assistant', `Error ejecutando: ${err.message}`);
      toast(err.message, 'error');
    }
  }, [state, dispatch, toast, addMessage]);

  const confirmTool = useCallback(() => {
    if (pendingTool) {
      executeTool(pendingTool);
      setPendingTool(null);
    }
  }, [pendingTool, executeTool]);

  const cancelTool = useCallback(() => {
    setPendingTool(null);
    addMessage('assistant', '❌ Acción cancelada');
  }, [addMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setPendingTool(null);
  }, []);

  return {
    isOpen,
    setIsOpen,
    messages,
    input,
    setInput,
    isLoading,
    isRecording,
    pendingTool,
    pendingToolSummary: pendingTool ? getToolSummary(pendingTool, state.productos, state.clientes) : null,
    sendText,
    startRecording,
    stopRecording,
    confirmTool,
    cancelTool,
    clearChat,
  };
}
