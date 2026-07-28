'use client';
import { useState } from 'react';
import { useStore, useActiveCamion } from '../context/StoreContext';
import { OrderCard } from '../components/OrderCard';
import { Button } from '../components/Button';
import { TextArea, Stepper } from '../components/Input';
import { SearchSelect } from '../components/SearchSelect';
import { parseWhatsAppText } from '../utils/parser';
import { useToast } from '../components/Toast';
import { Plus, X, ClipboardList } from 'lucide-react';
import { api } from '../api';
import './Pedidos.css';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'entregado', label: 'Entregado' }
];

export function Pedidos() {
  const { state, crearCliente: crearClienteFn, deleteCliente: deleteClienteFn, crearProducto: crearProductoFn, crearPedido: crearPedidoFn, updatePedido: updatePedidoFn, updateStock } = useStore();
  const activeCamion = useActiveCamion();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [subTab, setSubTab] = useState('lista');
  const [pedidoCliente, setPedidoCliente] = useState('');
  const [pedidoItems, setPedidoItems] = useState([]);
  const [parserText, setParserText] = useState('');
  const [editingPedido, setEditingPedido] = useState(null);

  if (!activeCamion) {
    return (
      <div className="pedidos-empty">
        <ClipboardList size={40} strokeWidth={1.5} />
        <h2>Sin jornada activa</h2>
        <p>Crea un camion desde el dashboard para ver pedidos</p>
      </div>
    );
  }

  const pedidosCamion = state.pedidos.filter(p => p.camionId === activeCamion.id);
  const filteredPedidos = filter === 'all'
    ? pedidosCamion
    : pedidosCamion.filter(p => p.estado === filter);

  const clienteOptions = state.clientes.map(c => ({ value: c.id, label: c.nombre }));
  const productoOptions = state.productos.filter(p => p.activo).map(p => ({ value: p.id, label: p.nombre }));

  async function crearCliente(nombre) {
    const id = await crearClienteFn(nombre);
    setPedidoCliente(id);
    toast('Cliente creado', 'success');
    return id;
  }

  async function borrarCliente(id) {
    if (window.confirm('¿Eliminar este cliente?\n\nSe borrarán todos sus pedidos permanentemente.')) {
      await deleteClienteFn(id);
      if (pedidoCliente === id) {
        setPedidoCliente('');
      }
      toast('Cliente eliminado', 'success');
    }
  }

  async function crearProducto(nombre) {
    const id = await crearProductoFn({ nombre, emoji: '', unidad: 'unidad', precioDefault: 0, nombreVariantes: [nombre.toLowerCase()] });
    toast('Producto creado', 'success');
    return id;
  }

  function handleEditPedido(pedido) {
    setEditingPedido(pedido);
    setPedidoCliente(pedido.clienteId);
    setPedidoItems(pedido.items.map(item => ({ ...item })));
    setShowModal(true);
  }

  function cerrarModal() {
    setShowModal(false);
    setEditingPedido(null);
    resetForm();
  }

  function agregarItemManual() {
    setPedidoItems(prev => [...prev, { productoId: '', cantidad: 1, precioUnitario: 0 }]);
  }

  function quitarItem(index) {
    setPedidoItems(prev => prev.filter((_, i) => i !== index));
  }

  function actualizarItem(index, field, value) {
    setPedidoItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'productoId') {
        const prod = state.productos.find(p => p.id === value);
        updated.precioUnitario = prod?.precioDefault || 0;
      }
      return updated;
    }));
  }

  async function guardarPedido() {
    if (!pedidoCliente) { toast('Selecciona un cliente', 'error'); return; }
    const validItems = pedidoItems.filter(item => item.productoId && item.cantidad > 0);
    if (validItems.length === 0) { toast('Agrega al menos un producto', 'error'); return; }

    if (editingPedido) {
      await updatePedidoFn(editingPedido.id, { clienteId: pedidoCliente, items: validItems });
      toast('Pedido actualizado', 'success');
    } else {
      await crearPedidoFn(pedidoCliente, validItems);
      for (const item of validItems) {
        await updateStock(item.productoId, item.cantidad, 'add');
      }
      toast('Pedido guardado', 'success');
    }
    cerrarModal();
  }

  function agregarDesdeLista() {
    if (!parserText.trim()) return;
    const parsed = parseWhatsAppText(parserText, state.productos);
    const nuevos = parsed.filter(p => p.matched).map(p => ({
      productoId: p.productoId, cantidad: p.cantidad, precioUnitario: p.precioUnitario
    }));
    if (nuevos.length === 0) { toast('No se detectaron productos', 'error'); return; }
    setPedidoItems(prev => [...prev, ...nuevos]);
    setParserText('');
    toast(`${nuevos.length} productos agregados`, 'success');
  }

  const previewLista = parserText ? parseWhatsAppText(parserText, state.productos) : [];

  function resetForm() {
    setPedidoItems([]);
    setPedidoCliente('');
    setParserText('');
    setSubTab('lista');
    setShowModal(false);
  }

  return (
    <div className="pedidos">
      <div className="pedidos-header">
        <h1 className="pedidos-title">Pedidos</h1>
        <span className="pedidos-count">{filteredPedidos.length}</span>
        <button className="fab-pedidos" onClick={() => { setSubTab('lista'); setShowModal(true); }}>
          <Plus size={20} />
        </button>
      </div>

      <div className="pedidos-filters">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredPedidos.length === 0 ? (
        <div className="pedidos-empty-state">
          <p>No hay pedidos{filter !== 'all' ? ` (${filter})` : ''}</p>
          <p className="empty-hint">Presiona + para crear uno</p>
        </div>
      ) : (
        <div className="pedidos-list">
          {filteredPedidos.map(pedido => (
            <OrderCard key={pedido.id} pedido={pedido} onEdit={handleEditPedido} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPedido ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
              <button className="modal-close" onClick={cerrarModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <SearchSelect
                value={pedidoCliente}
                onChange={setPedidoCliente}
                options={clienteOptions}
                placeholder="Seleccionar cliente..."
                onCreateNew={(nombre) => crearCliente(nombre)}
                onDeleteOption={(id) => borrarCliente(id)}
              />

              <div className="sub-tabs">
                <button className={`sub-tab ${subTab === 'lista' ? 'active' : ''}`} onClick={() => setSubTab('lista')}>
                  Desde Lista
                </button>
                <button className={`sub-tab ${subTab === 'manual' ? 'active' : ''}`} onClick={() => setSubTab('manual')}>
                  Manual
                </button>
              </div>

              {subTab === 'lista' && (
                <div className="lista-form">
                  <TextArea
                    value={parserText}
                    onChange={(e) => setParserText(e.target.value)}
                    placeholder={`2 zanahoria\n3 tomate\n5 lechuga`}
                    rows={4}
                  />
                  {previewLista.length > 0 && (
                    <div className="lista-preview">
                      {previewLista.map((item, i) => (
                        <div key={i} className={`preview-chip ${!item.matched ? 'unmatched' : ''}`}>
                          <span>{item.cantidad} {item.producto?.nombre || item.raw}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={agregarDesdeLista} disabled={!parserText.trim()} fullWidth>
                    Agregar a pedido
                  </Button>
                </div>
              )}

              {subTab === 'manual' && (
                <div className="manual-form">
                  {pedidoItems.length === 0 && (
                    <button className="add-first-btn" onClick={agregarItemManual}>
                      <Plus size={16} /> Agregar producto
                    </button>
                  )}
                  {pedidoItems.map((item, i) => (
                    <div key={i} className="item-row">
                      <SearchSelect
                        value={item.productoId}
                        onChange={(v) => actualizarItem(i, 'productoId', v)}
                        options={productoOptions}
                        placeholder="Producto..."
                        onCreateNew={(nombre) => {
                          const id = crearProducto(nombre);
                          actualizarItem(i, 'productoId', id);
                        }}
                      />
                      <Stepper value={item.cantidad} onChange={(v) => actualizarItem(i, 'cantidad', v)} min={1} />
                      <button className="remove-btn" onClick={() => setPedidoItems(prev => prev.filter((_, j) => j !== i))}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {pedidoItems.length > 0 && (
                    <button className="add-more-btn" onClick={agregarItemManual}>
                      <Plus size={14} /> Otro producto
                    </button>
                  )}
                </div>
              )}

              {pedidoItems.length > 0 && (
                <div className="order-summary">
                  <div className="summary-header">
                    <span className="summary-count">{pedidoItems.length} productos</span>
                    <span className="summary-total">
                      ${pedidoItems.reduce((s, item) => {
                        const p = state.productos.find(x => x.id === item.productoId);
                        return s + (item.cantidad * (item.precioUnitario || p?.precioDefault || 0));
                      }, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="summary-items">
                    {pedidoItems.map((item, i) => {
                      const p = state.productos.find(x => x.id === item.productoId);
                      return (
                        <span key={i} className="summary-chip">
                          {item.cantidad}x {p?.nombre || '?'}
                        </span>
                      );
                    })}
                  </div>

                  <Button onClick={guardarPedido} fullWidth>Guardar Pedido</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
