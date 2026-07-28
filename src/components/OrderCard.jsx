'use client';
import { Clock, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import './OrderCard.css';

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', className: 'pending' },
  pagado: { label: 'Pagado', className: 'paid' },
  entregado: { label: 'Entregado', className: 'delivered' }
};

export function OrderCard({ pedido, onClick }) {
  const { state, dispatch } = useStore();
  const cliente = state.clientes.find(c => c.id === pedido.clienteId);

  const total = pedido.items.reduce((sum, item) => {
    const producto = state.productos.find(p => p.id === item.productoId);
    const precio = item.precioUnitario || producto?.precioDefault || 0;
    return sum + (item.cantidad * precio);
  }, 0);

  const status = STATUS_CONFIG[pedido.estado] || STATUS_CONFIG.pendiente;

  function handleStatusChange(e) {
    e.stopPropagation();
    const newStatus = e.target.value;
    dispatch({
      type: 'UPDATE_PEDIDO',
      payload: { id: pedido.id, estado: newStatus }
    });
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="order-card" onClick={onClick}>
      <div className="order-header">
        <div className="order-client">
          <div className="client-avatar">
            <User size={16} />
          </div>
          <span className="client-name">{cliente?.nombre || 'Cliente'}</span>
        </div>
        <div className="order-time">
          <Clock size={12} />
          {formatTime(pedido.createdAt)}
        </div>
      </div>

      <div className="order-products">
        {pedido.items.slice(0, 3).map((item, i) => {
          const producto = state.productos.find(p => p.id === item.productoId);
          return (
            <span key={i} className="product-tag">
              {item.cantidad}x {producto?.nombre || '?'}
            </span>
          );
        })}
        {pedido.items.length > 3 && (
          <span className="more-products">+{pedido.items.length - 3}</span>
        )}
      </div>

      <div className="order-footer">
        <span className="order-total">${total.toLocaleString()}</span>
        <select
          className={`status-badge ${status.className}`}
          value={pedido.estado}
          onChange={handleStatusChange}
        >
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="entregado">Entregado</option>
        </select>
      </div>
    </div>
  );
}
