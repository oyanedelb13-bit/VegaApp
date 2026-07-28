'use client';
import { useState } from 'react';
import { Edit2, Check, X, Trash2 } from 'lucide-react';
import { Stepper } from './Input';
import './ProductCard.css';

export function ProductCard({
  producto,
  stockTotal = 0,
  reservado = 0,
  onUpdateStock,
  onUpdatePrecio,
  onDelete,
  editable = true
}) {
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [isEditingPrecio, setIsEditingPrecio] = useState(false);
  const [tempStock, setTempStock] = useState(String(stockTotal));
  const [tempPrecio, setTempPrecio] = useState(String(producto.precioDefault || 0));

  const disponible = Math.max(0, stockTotal - reservado);
  const stockPercent = stockTotal > 0 ? (reservado / stockTotal) * 100 : 0;

  function handleSaveStock() {
    onUpdateStock?.(Number(tempStock) || 0);
    setIsEditingStock(false);
  }

  function handleSavePrecio() {
    onUpdatePrecio?.(Number(tempPrecio) || 0);
    setIsEditingPrecio(false);
  }

  function handleCancel() {
    setTempStock(String(stockTotal));
    setTempPrecio(String(producto.precioDefault || 0));
    setIsEditingStock(false);
    setIsEditingPrecio(false);
  }

  return (
    <div className={`product-card ${!producto.activo ? 'inactive' : ''}`}>
      {editable && onDelete && (
        <button
          className="product-delete-btn"
          onClick={() => {
            if (confirm(`¿Borrar ${producto.emoji} ${producto.nombre}?\n\nSe eliminará permanentemente de todos los camiones.`)) {
              onDelete(producto.id);
            }
          }}
          title="Borrar producto"
        >
          <Trash2 size={14} />
        </button>
      )}
      <div
        className="product-image"
        style={{ background: producto.color ? producto.color + '22' : '#f5f0e8' }}
      >
        <span className="product-emoji">{producto.emoji}</span>
      </div>

      <div className="product-info">
        <h3 className="product-name">{producto.nombre}</h3>

        <div className="product-unit">{producto.unidad}</div>

        <div className="stock-bar-container">
          <div className="stock-bar">
            <div
              className="stock-reserved"
              style={{ width: `${Math.min(stockPercent, 100)}%` }}
            />
          </div>
          <div className="stock-numbers">
            <span className="stock-total">{stockTotal}</span>
            <span className="stock-reservado">{reservado} res.</span>
          </div>
        </div>

        <div className="product-stock-row">
          {isEditingStock ? (
            <div className="stock-edit">
              <Stepper value={tempStock} onChange={setTempStock} min={0} />
              <button className="edit-btn save" onClick={handleSaveStock}>
                <Check size={16} />
              </button>
              <button className="edit-btn cancel" onClick={handleCancel}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              className="stock-display"
              onClick={() => editable && setIsEditingStock(true)}
            >
              <span className="disponible">{disponible}</span>
              <span className="disponible-label">stock</span>
              {editable && <Edit2 size={12} className="edit-icon" />}
            </button>
          )}

          <div className="product-price">
            {isEditingPrecio ? (
              <div className="price-edit">
                <input
                  type="text"
                  inputMode="numeric"
                  value={tempPrecio}
                  onChange={(e) => setTempPrecio(e.target.value)}
                  className="price-input"
                />
                <button className="edit-btn save" onClick={handleSavePrecio}>
                  <Check size={16} />
                </button>
                <button className="edit-btn cancel" onClick={handleCancel}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                className="price-display"
                onClick={() => editable && setIsEditingPrecio(true)}
              >
                ${producto.precioDefault || 0}
                {editable && <Edit2 size={12} className="edit-icon" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
