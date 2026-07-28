'use client';
import { useStore, useActiveCamion } from '../context/StoreContext';
import { MetricCard } from '../components/MetricCard';
import { DollarSign, Users, TrendingUp, Package } from 'lucide-react';
import './Analytics.css';

export function Analytics() {
  const { state } = useStore();
  const activeCamion = useActiveCamion();

  if (!activeCamion) {
    return (
      <div className="analytics-empty">
        <h2>No hay camión activo</h2>
      </div>
    );
  }

  const pedidosCamion = state.pedidos.filter(p => p.camionId === activeCamion.id);

  const totalVenta = pedidosCamion.reduce((sum, pedido) => {
    return sum + pedido.items.reduce((itemSum, item) => {
      const producto = state.productos.find(p => p.id === item.productoId);
      const precio = item.precioUnitario || producto?.precioDefault || 0;
      return itemSum + (item.cantidad * precio);
    }, 0);
  }, 0);

  const pedidosPendientes = pedidosCamion.filter(p => p.estado === 'pendiente').length;
  const pedidosPagados = pedidosCamion.filter(p => p.estado === 'pagado').length;
  const pedidosEntregados = pedidosCamion.filter(p => p.estado === 'entregado').length;

  const clientePedidos = {};
  pedidosCamion.forEach(pedido => {
    if (!clientePedidos[pedido.clienteId]) {
      clientePedidos[pedido.clienteId] = {
        clienteId: pedido.clienteId,
        count: 0,
        total: 0
      };
    }
    clientePedidos[pedido.clienteId].count += 1;
    clientePedidos[pedido.clienteId].total += pedido.items.reduce((sum, item) => {
      const producto = state.productos.find(p => p.id === item.productoId);
      const precio = item.precioUnitario || producto?.precioDefault || 0;
      return sum + (item.cantidad * precio);
    }, 0);
  });

  const topClientes = Object.values(clientePedidos)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(cp => {
      const cliente = state.clientes.find(c => c.id === cp.clienteId);
      return { ...cp, nombre: cliente?.nombre || 'Cliente' };
    });

  const productoVentas = {};
  pedidosCamion.forEach(pedido => {
    pedido.items.forEach(item => {
      if (!productoVentas[item.productoId]) {
        productoVentas[item.productoId] = {
          productoId: item.productoId,
          cantidad: 0,
          venta: 0
        };
      }
      productoVentas[item.productoId].cantidad += item.cantidad;
      const producto = state.productos.find(p => p.id === item.productoId);
      const precio = item.precioUnitario || producto?.precioDefault || 0;
      productoVentas[item.productoId].venta += item.cantidad * precio;
    });
  });

  const topProductos = Object.values(productoVentas)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)
    .map(pv => {
      const producto = state.productos.find(p => p.id === pv.productoId);
      return { ...pv, nombre: producto?.nombre || '?', color: producto?.color };
    });

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <p className="analytics-subtitle">{activeCamion.nombre}</p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          icon={DollarSign}
          label="Venta Total"
          value={`$${totalVenta.toLocaleString()}`}
          color="success"
        />
        <MetricCard
          icon={Package}
          label="Pedidos Totales"
          value={pedidosCamion.length}
          color="primary"
        />
      </div>

      <div className="status-summary">
        <div className="status-item pending">
          <span className="status-count">{pedidosPendientes}</span>
          <span className="status-label">Pendientes</span>
        </div>
        <div className="status-item paid">
          <span className="status-count">{pedidosPagados}</span>
          <span className="status-label">Pagados</span>
        </div>
        <div className="status-item delivered">
          <span className="status-count">{pedidosEntregados}</span>
          <span className="status-label">Entregados</span>
        </div>
      </div>

      {topClientes.length > 0 && (
        <div className="analytics-section">
          <h2 className="section-title">Top Clientes</h2>
          <div className="clientes-list">
            {topClientes.map((cliente, i) => (
              <div key={cliente.clienteId} className="cliente-item">
                <span className="cliente-rank">#{i + 1}</span>
                <span className="cliente-nombre">{cliente.nombre}</span>
                <span className="cliente-monto">${cliente.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topProductos.length > 0 && (
        <div className="analytics-section">
          <h2 className="section-title">Productos Más Vendidos</h2>
          <div className="productos-list">
            {topProductos.map((producto, i) => (
              <div key={producto.productoId} className="producto-item">
                <div className="producto-rank">#{i + 1}</div>
                <span className="producto-emoji">{producto.emoji}</span>
                <span className="producto-nombre">{producto.nombre}</span>
                <span className="producto-cantidad">{producto.cantidad}</span>
                <span className="producto-venta">${producto.venta.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
