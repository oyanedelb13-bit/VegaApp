'use client';
import { Clock, User, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from './Toast';
import './OrderCard.css';

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', className: 'pending' },
  pagado: { label: 'Pagado', className: 'paid' },
  entregado: { label: 'Entregado', className: 'delivered' }
};

export function OrderCard({ pedido, onClick }) {
  const { state, updatePedido, deletePedido } = useStore();
  const { toast } = useToast();
  const cliente = state.clientes.find(c => c.id === pedido.clienteId);

  const total = pedido.items.reduce((sum, item) => {
    const producto = state.productos.find(p => p.id === item.productoId);
    const precio = item.precioUnitario || producto?.precioDefault || 0;
    return sum + (item.cantidad * precio);
  }, 0);

  const status = STATUS_CONFIG[pedido.estado] || STATUS_CONFIG.pendiente;

  async function handleStatusChange(e) {
    e.stopPropagation();
    const newStatus = e.target.value;
    await updatePedido(pedido.id, { estado: newStatus });
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm('¿Borrar este pedido?\n\nEsta acción no se puede deshacer.')) return;
    try {
      await deletePedido(pedido.id);
      toast('Pedido eliminado', 'success');
    } catch {
      toast('Error al eliminar', 'error');
    }
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
        {pedido.items.slice(0, 4).map((item, i) => {
          const producto = state.productos.find(p => p.id === item.productoId);
          return (
            <div key={i} className="product-item">
              <span className="product-emoji">{producto?.emoji || '📦'}</span>
              <span className="product-info">
                <span className="product-qty">{item.cantidad}x</span>
                <span className="product-name">{producto?.nombre || '?'}</span>
              </span>
            </div>
          );
        })}
        {pedido.items.length > 4 && (
          <span className="more-products">+{pedido.items.length - 4} más</span>
        )}
      </div>

      <div className="order-footer">
        <span className="order-total">${total.toLocaleString()}</span>
        <div className="order-actions">
          <button className="order-delete-btn" onClick={handleDelete} title="Borrar pedido">
            <Trash2 size={14} />
          </button>
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
    </div>
  );
}
