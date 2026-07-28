'use client';
import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { TrendingUp, TrendingDown, Calendar, Filter, AlertTriangle, Package } from 'lucide-react';
import './Analytics.css';

export function Analytics() {
  const { state } = useStore();
  const [filterCamion, setFilterCamion] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('mes');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  const allYears = useMemo(() => {
    const years = new Set();
    state.pedidos.forEach(p => {
      if (p.createdAt) {
        years.add(new Date(p.createdAt).getFullYear());
      }
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [state.pedidos]);

  const allMonths = useMemo(() => [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ], []);

  const filteredPedidos = useMemo(() => {
    return state.pedidos.filter(p => {
      if (!p.createdAt) return false;
      const date = new Date(p.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (filterPeriod === 'anio' && year !== filterYear) return false;
      if (filterPeriod === 'mes' && (year !== filterYear || month !== filterMonth)) return false;

      if (filterCamion !== 'all' && p.camionId !== filterCamion) return false;
      return true;
    });
  }, [state.pedidos, filterCamion, filterPeriod, filterYear, filterMonth]);

  const topProductos = useMemo(() => {
    const counts = {};
    filteredPedidos.forEach(p => {
      p.items.forEach(item => {
        if (!counts[item.productoId]) {
          counts[item.productoId] = { cantidad: 0, producto: state.productos.find(prod => prod.id === item.productoId) };
        }
        counts[item.productoId].cantidad += item.cantidad;
      });
    });
    return Object.entries(counts)
      .filter(([_, data]) => data.producto)
      .sort((a, b) => b[1].cantidad - a[1].cantidad)
      .slice(0, 5);
  }, [filteredPedidos, state.productos]);

  const stats = useMemo(() => {
    const totalPedidos = filteredPedidos.length;
    const pedidosPagados = filteredPedidos.filter(p => p.estado === 'pagado' || p.estado === 'entregado').length;
    const pedidosPendientes = filteredPedidos.filter(p => p.estado === 'pendiente').length;

    let gananciaTotal = 0;
    let productosVendidos = 0;

    filteredPedidos.forEach(p => {
      p.items.forEach(item => {
        const producto = state.productos.find(prod => prod.id === item.productoId);
        const precio = item.precioUnitario || producto?.precioDefault || 0;
        gananciaTotal += item.cantidad * precio;
        if (p.estado === 'pagado' || p.estado === 'entregado') {
          productosVendidos += item.cantidad;
        }
      });
    });

    return {
      totalPedidos,
      pedidosPagados,
      pedidosPendientes,
      gananciaTotal,
      productosVendidos,
    };
  }, [filteredPedidos, state.productos]);

  const productosSinPrecio = useMemo(() => {
    return state.productos.filter(p => !p.precioDefault || p.precioDefault === 0);
  }, [state.productos]);

  const mesesSinPedidos = useMemo(() => {
    const meses = [];
    for (let year = 2024; year <= new Date().getFullYear(); year++) {
      for (let month = 1; month <= 12; month++) {
        if (year > new Date().getFullYear() || (year === new Date().getFullYear() && month > new Date().getMonth() + 1)) break;
        const hasPedidos = state.pedidos.some(p => {
          if (!p.createdAt) return false;
          const d = new Date(p.createdAt);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
        if (!hasPedidos) {
          meses.push({ year, month });
        }
      }
    }
    return meses.slice(-6);
  }, [state.pedidos]);

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2 className="analytics-title">Estadisticas</h2>
      </div>

      <div className="analytics-filters">
        <div className="filter-group">
          <Filter size={16} />
          <select
            className="filter-select"
            value={filterCamion}
            onChange={(e) => setFilterCamion(e.target.value)}
          >
            <option value="all">Todos los camiones</option>
            {state.camiones.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <Calendar size={16} />
          <select
            className="filter-select"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="anio">Año</option>
            <option value="mes">Mes</option>
          </select>
        </div>

        <select
          className="filter-select"
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
        >
          {allYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {filterPeriod === 'mes' && (
          <select
            className="filter-select"
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
          >
            {allMonths.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-icon green">
            <TrendingUp size={20} />
          </div>
          <div className="analytics-card-content">
            <span className="analytics-card-value">${stats.gananciaTotal.toLocaleString()}</span>
            <span className="analytics-card-label">Ganancia total</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon blue">
            <TrendingDown size={20} />
          </div>
          <div className="analytics-card-content">
            <span className="analytics-card-value">{stats.totalPedidos}</span>
            <span className="analytics-card-label">Pedidos total</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon yellow">
            <TrendingUp size={20} />
          </div>
          <div className="analytics-card-content">
            <span className="analytics-card-value">{stats.pedidosPagados}</span>
            <span className="analytics-card-label">Pagados</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon orange">
            <TrendingDown size={20} />
          </div>
          <div className="analytics-card-content">
            <span className="analytics-card-value">{stats.pedidosPendientes}</span>
            <span className="analytics-card-label">Pendientes</span>
          </div>
        </div>
      </div>

      {topProductos.length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-section-title">
            <Package size={18} />
            Top 5 Productos
          </h3>
          <div className="top-productos">
            {topProductos.map(([productoId, data], index) => (
              <div key={productoId} className="top-producto-item">
                <span className="top-producto-rank">#{index + 1}</span>
                <span className="top-producto-emoji">{data.producto?.emoji || '📦'}</span>
                <div className="top-producto-info">
                  <span className="top-producto-name">{data.producto?.nombre}</span>
                  <span className="top-producto-cantidad">{data.cantidad} unidades</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {productosSinPrecio.length > 0 && (
        <div className="analytics-warning">
          <div className="warning-header">
            <AlertTriangle size={18} />
            <span>Productos sin precio ({productosSinPrecio.length})</span>
          </div>
          <p className="warning-text">
            Estos productos no tienen precio asignado, no se incluyen en la ganancia.
          </p>
          <div className="warning-products">
            {productosSinPrecio.slice(0, 10).map(p => (
              <span key={p.id} className="warning-product-chip">
                {p.emoji} {p.nombre}
              </span>
            ))}
            {productosSinPrecio.length > 10 && (
              <span className="warning-more">+{productosSinPrecio.length - 10} más</span>
            )}
          </div>
        </div>
      )}

      {mesesSinPedidos.length > 0 && (
        <div className="analytics-warning">
          <div className="warning-header">
            <AlertTriangle size={18} />
            <span>Meses sin pedidos</span>
          </div>
          <div className="warning-products">
            {mesesSinPedidos.map(m => (
              <span key={`${m.year}-${m.month}`} className="warning-product-chip">
                {allMonths.find(month => month.value === m.month)?.label} {m.year}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
