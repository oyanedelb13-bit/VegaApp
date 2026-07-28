'use client';
import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Stepper } from './Input';
import './ProductCard.css';

export function ProductCard({
  producto,
  stockTotal = 0,
  reservado = 0,
  onUpdateStock,
  onUpdatePrecio,
  editable = true
}) {
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [isEditingPrecio, setIsEditingPrecio] = useState(false);
  const [tempStock, setTempStock] = useState(stockTotal);
  const [tempPrecio, setTempPrecio] = useState(producto.precioDefault || 0);

  const disponible = Math.max(0, stockTotal - reservado);
  const stockPercent = stockTotal > 0 ? (reservado / stockTotal) * 100 : 0;

  function handleSaveStock() {
    onUpdateStock?.(tempStock);
    setIsEditingStock(false);
  }

  function handleSavePrecio() {
    onUpdatePrecio?.(tempPrecio);
    setIsEditingPrecio(false);
  }

  function handleCancel() {
    setTempStock(stockTotal);
    setTempPrecio(producto.precioDefault || 0);
    setIsEditingStock(false);
    setIsEditingPrecio(false);
  }

  return (
    <div className={`product-card ${!producto.activo ? 'inactive' : ''}`}>
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
              <span className="disponible-label">disp.</span>
              {editable && <Edit2 size={12} className="edit-icon" />}
            </button>
          )}

          <div className="product-price">
            {isEditingPrecio ? (
              <div className="price-edit">
                <input
                  type="number"
                  value={tempPrecio}
                  onChange={(e) => setTempPrecio(Number(e.target.value))}
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
