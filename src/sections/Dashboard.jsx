'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useActiveCamion, useCamionProductos } from '../context/StoreContext';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/Button';
import { TextArea, Stepper } from '../components/Input';
import { SearchSelect } from '../components/SearchSelect';
import { parseWhatsAppText, parseStockList } from '../utils/parser';
import { useToast } from '../components/Toast';
import { Package, ShoppingBag, DollarSign, ClipboardList, Plus, X, ShoppingCart, Boxes } from 'lucide-react';
import { api } from '../api';
import './Dashboard.css';

export function Dashboard() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const activeCamion = useActiveCamion();
  const camionProductos = useCamionProductos();
  const toast = useToast();

  const [modal, setModal] = useState(null);
  const [pedidoSubTab, setPedidoSubTab] = useState('lista');

  const [pedidoCliente, setPedidoCliente] = useState('');
  const [pedidoItems, setPedidoItems] = useState([]);
  const [parserText, setParserText] = useState('');

  const [stockText, setStockText] = useState('');

  if (!activeCamion) {
    return (
      <div className="dashboard-empty">
        <h2>No hay camion activo</h2>
        <p>Crea un nuevo camion para comenzar</p>
        <button className="action-btn primary" onClick={crearCamion} style={{ marginTop: 16, maxWidth: 260 }}>
          Crear Camion
        </button>
      </div>
    );
  }

  const totalStock = camionProductos.reduce((sum, cp) => sum + cp.stockTotal, 0);
  const totalReservado = camionProductos.reduce((sum, cp) => sum + cp.reservado, 0);
  const pedidosActivos = state.pedidos.filter(p => p.camionId === activeCamion.id && p.estado !== 'entregado');
  const gananciaEstimada = camionProductos.reduce((sum, cp) => {
    if (!cp.producto?.precioDefault) return sum;
    return sum + (cp.reservado * cp.producto.precioDefault);
  }, 0);

  const clienteOptions = state.clientes.map(c => ({ value: c.id, label: c.nombre }));
  const productoOptions = state.productos.filter(p => p.activo).map(p => ({ value: p.id, label: p.nombre }));

  function crearCamion() {
    const today = new Date();
    const dayName = today.toLocaleDateString('es-CL', { weekday: 'long' });
    const dateStr = today.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
    dispatch({
      type: 'CREATE_CAMION',
      payload: {
        nombre: `Camion ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dateStr}`,
        fecha: today.toISOString()
      }
    });
    toast('Camion creado', 'success');
  }

  function crearCliente(nombre) {
    const id = Date.now().toString(36);
    dispatch({ type: 'ADD_CLIENTE', payload: { id, nombre, telefono: '' } });
    setPedidoCliente(id);
    toast('Cliente creado', 'success');
    return id;
  }

  function borrarCliente(id) {
    if (window.confirm('¿Seguro que deseas eliminar este cliente? Se borrarán sus pedidos.')) {
      api.deleteCliente(id).catch(console.error);
      dispatch({ type: 'DELETE_CLIENTE', payload: id });
      if (pedidoCliente === id) {
        setPedidoCliente('');
      }
      toast('Cliente eliminado', 'success');
    }
  }

  function crearProducto(nombre) {
    const id = 'p' + Date.now().toString(36);
    dispatch({ type: 'ADD_PRODUCTO', payload: { id, nombre, emoji: '', unidad: 'unidad', activo: true, precioDefault: 0, nombreVariantes: [nombre.toLowerCase()] } });
    toast('Producto creado', 'success');
    return id;
  }

  function agregarItemManual() {
    setPedidoItems(prev => [...prev, { productoId: '', cantidad: 1, precioUnitario: 0 }]);
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

  function guardarPedido() {
    if (!pedidoCliente) { toast('Selecciona un cliente', 'error'); return; }
    const validItems = pedidoItems.filter(item => item.productoId && item.cantidad > 0);
    if (validItems.length === 0) { toast('Agrega al menos un producto', 'error'); return; }
    dispatch({ type: 'ADD_PEDIDO', payload: { clienteId: pedidoCliente, items: validItems } });
    validItems.forEach(item => {
      dispatch({ type: 'UPDATE_STOCK', payload: { productoId: item.productoId, cantidad: item.cantidad, operacion: 'add' } });
    });
    setPedidoItems([]);
    setPedidoCliente('');
    setParserText('');
    setPedidoSubTab('lista');
    setModal(null);
    toast('Pedido guardado', 'success');
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

  function cargarStockLista() {
    if (!stockText.trim()) return;
    const parsed = parseStockList(stockText, state.productos);
    if (parsed.length === 0) { toast('No se detectaron productos', 'error'); return; }
    const camion = state.camiones.find(c => c.id === state.activeCamionId);
    const updated = [...camion.productos];
    parsed.forEach(entry => {
      const idx = updated.findIndex(p => p.productoId === entry.productoId);
      if (idx >= 0) updated[idx] = { ...updated[idx], stockTotal: updated[idx].stockTotal + entry.cantidad };
      else updated.push({ productoId: entry.productoId, stockTotal: entry.cantidad, reservado: 0 });
    });
    dispatch({ type: 'UPDATE_CAMION_PRODUCTOS', payload: updated });
    setStockText('');
    setModal(null);
    toast('Stock cargado', 'success');
  }

  const previewStockLista = stockText ? parseStockList(stockText, state.productos) : [];

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h1 className="hero-title">{(() => { const h = new Date().getHours(); return h < 12 ? 'Buenos dias' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; })()}</h1>
        <p className="hero-sub">{activeCamion.nombre}</p>
      </div>

      <div className="metrics-grid">
        <MetricCard icon={Package} label="Stock" value={totalStock} color="primary" />
        <MetricCard icon={ShoppingBag} label="Reservado" value={totalReservado} color="accent" />
        <MetricCard icon={DollarSign} label="Ganancia" value={`$${gananciaEstimada.toLocaleString()}`} color="success" />
        <MetricCard icon={ClipboardList} label="Pedidos" value={pedidosActivos.length} color="warning" />
      </div>

      <div className="action-buttons">
        <button className="action-btn primary" onClick={() => { setPedidoSubTab('lista'); setModal('pedido'); }}>
          <ShoppingCart size={20} />
          <span>Crear Pedido</span>
        </button>
        <button className="action-btn secondary" onClick={() => setModal('stock')}>
          <Boxes size={20} />
          <span>Cargar Stock</span>
        </button>
      </div>

      {camionProductos.length > 0 && (
        <div className="consolidado">
          <h2 className="section-title">Consolidado del Camion</h2>
          <div className="consolidado-grid">
            {camionProductos
              .filter(cp => cp.stockTotal > 0)
              .sort((a, b) => b.stockTotal - a.stockTotal)
              .map(cp => (
                <div key={cp.productoId} className="consolidado-chip">
                  <span className="chip-name">{cp.producto?.nombre}</span>
                  <span className="chip-qty">{cp.stockTotal}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {modal === 'pedido' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Pedido</h2>
              <button className="modal-close" onClick={() => setModal(null)}><X size={20} /></button>
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
                <button className={`sub-tab ${pedidoSubTab === 'lista' ? 'active' : ''}`} onClick={() => setPedidoSubTab('lista')}>
                  Desde Lista
                </button>
                <button className={`sub-tab ${pedidoSubTab === 'manual' ? 'active' : ''}`} onClick={() => setPedidoSubTab('manual')}>
                  Manual
                </button>
              </div>

              {pedidoSubTab === 'lista' && (
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
                          <span>{item.cantidad} {item.unidad}</span>
                          <span className="preview-name">{item.producto?.nombre || item.raw}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={agregarDesdeLista} disabled={!parserText.trim()} fullWidth>
                    Agregar a pedido
                  </Button>
                </div>
              )}

              {pedidoSubTab === 'manual' && (
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

      {modal === 'stock' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cargar Stock</h2>
              <button className="modal-close" onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="lista-form">
                <TextArea
                  value={stockText}
                  onChange={(e) => setStockText(e.target.value)}
                  placeholder={`100 lechuga\n50 cebolla\n30 brocoli`}
                  rows={4}
                />
                {previewStockLista.length > 0 && (
                  <div className="lista-preview">
                    {previewStockLista.map((item, i) => {
                      const p = state.productos.find(x => x.id === item.productoId);
                      return (
                        <div key={i} className="preview-chip">
                          <span>{item.cantidad}</span>
                          <span className="preview-name">{p?.nombre || '?'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Button onClick={cargarStockLista} disabled={!stockText.trim()} fullWidth>
                  Cargar Stock
                </Button>
              </div>
              <button className="link-inventario" onClick={() => { setModal(null); router.push('/inventario'); }}>
                Carga manual desde Inventario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
