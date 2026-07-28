'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Table2 } from 'lucide-react';
import { useStore, useActiveCamion, useCamionProductos } from '../context/StoreContext';
import { api } from '../api';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { UNIDADES_OPCIONALES } from '../data/initialData';
import './Inventario.css';

const EMOJI_LIST = [
  { emoji: '🍏', tags: ['manzana', 'manzana verde', 'verde', 'fruta', 'apple'] },
  { emoji: '🍎', tags: ['manzana', 'manzana roja', 'roja', 'fruta', 'apple'] },
  { emoji: '🍅', tags: ['tomate', 'verdura', 'ensalada', 'rojo', 'tomato'] },
  { emoji: '🥬', tags: ['lechuga', 'verdura', 'ensalada', 'verde', 'lettuce'] },
  { emoji: '🥕', tags: ['zanahoria', 'verdura', 'naranja', 'carrot'] },
  { emoji: '🥔', tags: ['papa', 'patata', 'verdura', 'potato'] },
  { emoji: '🧅', tags: ['cebolla', 'verdura', 'cebolla morada', 'onion'] },
  { emoji: '🧄', tags: ['ajo', 'verdura', 'garlic'] },
  { emoji: '🥦', tags: ['brocoli', 'verdura', 'verde', 'broccoli'] },
  { emoji: '🥑', tags: ['palta', 'aguacate', 'ensalada', 'verde', 'avocado'] },
  { emoji: '🌽', tags: ['choclo', 'maiz', 'elote', 'verdura', 'corn'] },
  { emoji: '🌶️', tags: ['aji', 'pimiento', 'picante', 'chili'] },
  { emoji: '🍋', tags: ['limon', 'amarillo', 'citrico', 'lemon'] },
  { emoji: '🍊', tags: ['naranja', 'citrico', 'orange'] },
  { emoji: '🍌', tags: ['platano', 'banana', 'fruta', 'amarillo'] },
  { emoji: '🍍', tags: ['pina', 'piña', 'fruta', 'pineapple'] },
  { emoji: '🍓', tags: ['frutilla', 'fresa', 'fruta', 'strawberry'] },
  { emoji: '🍉', tags: ['sandia', 'sandía', 'fruta', 'melon', 'watermelon'] },
  { emoji: '🍈', tags: ['melon', 'melón', 'fruta', 'cantaloupe'] },
  { emoji: '🍇', tags: ['uva', 'uvas', 'fruta', 'grapes'] },
  { emoji: '🍒', tags: ['cereza', 'cerezas', 'fruta', 'cherry'] },
  { emoji: '🍑', tags: ['durazno', 'pepa', 'duraznos', 'fruta', 'peach'] },
  { emoji: '🍐', tags: ['pera', 'fruta', 'pear'] },
  { emoji: '🥝', tags: ['kiwi', 'fruta', 'kiwifruit'] },
  { emoji: '🍆', tags: ['berenjena', 'verdura', 'eggplant'] },
  { emoji: '🍠', tags: ['camote', 'batata', 'sweet potato'] },
  { emoji: '🥒', tags: ['pepino', 'verdura', 'ensalada', 'cucumber'] },
  { emoji: '🍄', tags: ['champinon', 'champiñón', 'hongo', 'mushroom'] },
  { emoji: '🥜', tags: ['mani', 'maní', 'fruto seco', 'peanut'] },
  { emoji: '🌰', tags: ['castana', 'castaña', 'nuts'] }
];


export function Inventario() {
  const { state, updateCamionProductos, updateProducto, deleteProducto: deleteProductoFn, crearProducto: crearProductoFn } = useStore();
  const activeCamion = useActiveCamion();
  const camionProductos = useCamionProductos();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('alpha');
  const [showModal, setShowModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newEmoji, setNewEmoji] = useState('🍏');
  const [newUnidad, setNewUnidad] = useState('unidad');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState('');
  const emojiPickerRef = useRef(null);

  const [showExcel, setShowExcel] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [newExcelRow, setNewExcelRow] = useState({ productoId: '', stock: '', precio: '' });

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeCamion) {
    return (
      <div className="inventario-empty">
        <Table2 size={40} strokeWidth={1.5} />
        <h2>Sin jornada activa</h2>
        <p>Crea un camion desde el dashboard para gestionar inventario</p>
      </div>
    );
  }

  function getCamionProduct(productoId) {
    return camionProductos.find(cp => cp.productoId === productoId) || { stockTotal: 0, reservado: 0 };
  }

  async function handleUpdateStock(productoId, newStock) {
    const camion = state.camiones.find(c => c.id === state.activeCamionId);
    if (!camion) return;
    const productos = (camion.productos || []).map(p =>
      p.productoId === productoId ? { ...p, stockTotal: newStock } : p
    );
    if (!productos.find(p => p.productoId === productoId)) {
      productos.push({ productoId, stockTotal: newStock, reservado: 0 });
    }
    await updateCamionProductos(productos);
  }

  async function handleUpdatePrecio(productoId, newPrecio) {
    await updateProducto(productoId, { precioDefault: newPrecio });
  }

  async function handleDeleteProducto(productoId) {
    try {
      await deleteProductoFn(productoId);
      toast('Producto eliminado', 'success');
    } catch {
      toast('Error al eliminar', 'error');
    }
  }

  async function crearProducto() {
    if (!newNombre.trim()) { toast('Ingresa el nombre', 'error'); return; }
    await crearProductoFn({
      nombre: newNombre.trim(),
      emoji: newEmoji.trim(),
      unidad: newUnidad,
      precioDefault: 0,
      nombreVariantes: [newNombre.trim().toLowerCase()]
    });
    setNewNombre('');
    setNewEmoji('🍏');
    setNewUnidad('unidad');
    setShowEmojiPicker(false);
    setEmojiQuery('');
    setShowModal(false);
    toast('Producto creado', 'success');
  }

  function cerrarModal() {
    setNewNombre('');
    setNewEmoji('🍏');
    setNewUnidad('unidad');
    setShowEmojiPicker(false);
    setEmojiQuery('');
    setShowModal(false);
  }

  function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  const filteredProductos = state.productos
    .filter(p => normalize(p.nombre).includes(normalize(search)))
    .sort((a, b) => {
      const stockA = getCamionProduct(a.id).stockTotal;
      const stockB = getCamionProduct(b.id).stockTotal;
      if (sortOrder === 'less') return stockA - stockB;
      if (sortOrder === 'more') return stockB - stockA;
      return normalize(a.nombre).localeCompare(normalize(b.nombre));
    });

  const filteredEmojis = EMOJI_LIST.filter(item =>
    item.tags.some(tag => normalize(tag).includes(normalize(emojiQuery)))
  );

  const showCustomOption = emojiQuery.trim() && !filteredEmojis.some(e => e.emoji === emojiQuery.trim());
  const displayEmojis = [...filteredEmojis];
  if (showCustomOption && emojiQuery.trim().length <= 4) {
    displayEmojis.unshift({ emoji: emojiQuery.trim(), tags: [emojiQuery.trim()] });
  }

  function openExcel() {
    const data = state.productos.map(p => {
      const cp = getCamionProduct(p.id);
      return {
        id: p.id,
        emoji: p.emoji,
        nombre: p.nombre,
        unidad: p.unidad,
        stock: String(cp.stockTotal),
        precio: String(p.precioDefault || 0)
      };
    });
    setExcelData(data);
    setShowExcel(true);
  }

  function updateExcelField(id, field, value) {
    setExcelData(prev => prev.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  }

  function saveExcel() {
    excelData.forEach(row => {
      const cp = getCamionProduct(row.id);
      const newStock = Number(row.stock) || 0;
      const newPrecio = Number(row.precio) || 0;
      if (cp.stockTotal !== newStock) {
        handleUpdateStock(row.id, newStock);
      }
      if ((state.productos.find(p => p.id === row.id)?.precioDefault || 0) !== newPrecio) {
        handleUpdatePrecio(row.id, newPrecio);
      }
    });
    if (newExcelRow.productoId) {
      addExcelProduct();
    }
    setShowExcel(false);
    toast('Precios y stock actualizados', 'success');
  }

  function addExcelProduct() {
    const pid = newExcelRow.productoId;
    if (!pid) return;
    handleUpdateStock(pid, Number(newExcelRow.stock) || 0);
    handleUpdatePrecio(pid, Number(newExcelRow.precio) || 0);
    setNewExcelRow({ productoId: '', stock: '', precio: '' });
    toast('Producto agregado', 'success');
  }

  const productosNoEnExcel = state.productos.filter(p => !excelData.some(e => e.id === p.id));

  return (
    <div className="inventario">
      <div className="inventario-header">
        <h1 className="inventario-title">Inventario</h1>
        <span className="inventario-count">{state.productos.length}</span>
        <button className="excel-btn" onClick={openExcel} title="Vista rapida">
          <Table2 size={18} />
        </button>
        <button className="fab-inventario" onClick={() => setShowModal(true)}>
          <Plus size={20} />
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sort-filters">
        <button
          className={`sort-btn ${sortOrder === 'alpha' ? 'active' : ''}`}
          onClick={() => setSortOrder('alpha')}
        >
          A-Z
        </button>
        <button
          className={`sort-btn ${sortOrder === 'less' ? 'active' : ''}`}
          onClick={() => setSortOrder('less')}
        >
          Menos stock
        </button>
        <button
          className={`sort-btn ${sortOrder === 'more' ? 'active' : ''}`}
          onClick={() => setSortOrder('more')}
        >
          Mas stock
        </button>
      </div>

      <div className="product-grid">
        {filteredProductos.map(producto => {
          const cp = getCamionProduct(producto.id);
          return (
            <ProductCard
              key={producto.id}
              producto={producto}
              stockTotal={cp.stockTotal}
              reservado={cp.reservado}
              onUpdateStock={(newStock) => handleUpdateStock(producto.id, newStock)}
              onUpdatePrecio={(newPrecio) => handleUpdatePrecio(producto.id, newPrecio)}
              onDelete={handleDeleteProducto}
            />
          );
        })}
      </div>

      {filteredProductos.length === 0 && (
        <div className="inventario-empty-state">
          <p>No se encontraron productos</p>
        </div>
      )}

      {showExcel && (
        <div className="modal-overlay" onClick={() => setShowExcel(false)}>
          <div className="modal-sheet excel-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Precios y Stock</h2>
              <button className="modal-close" onClick={() => setShowExcel(false)}><X size={20} /></button>
            </div>
            <div className="modal-body excel-body">
              <div className="excel-table-wrapper">
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th className="excel-th-name">Producto</th>
                      <th className="excel-th-stock">Stock</th>
                      <th className="excel-th-precio">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.map(row => (
                      <tr key={row.id}>
                        <td className="excel-emoji">{row.emoji}</td>
                        <td className="excel-name">{row.nombre}</td>
                        <td>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="excel-input"
                            value={row.stock}
                            onChange={(e) => updateExcelField(row.id, 'stock', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="excel-input"
                            value={row.precio}
                            onChange={(e) => updateExcelField(row.id, 'precio', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                    {productosNoEnExcel.length > 0 && (
                      <tr className="excel-add-row">
                        <td className="excel-emoji">+</td>
                        <td>
                          <select
                            className="excel-select"
                            value={newExcelRow.productoId}
                            onChange={(e) => setNewExcelRow(prev => ({ ...prev, productoId: e.target.value }))}
                          >
                            <option value="">Agregar producto...</option>
                            {productosNoEnExcel.map(p => (
                              <option key={p.id} value={p.id}>{p.emoji} {p.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="excel-input"
                            placeholder="Stock"
                            value={newExcelRow.stock}
                            onChange={(e) => setNewExcelRow(prev => ({ ...prev, stock: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="excel-input"
                            placeholder="Precio"
                            value={newExcelRow.precio}
                            onChange={(e) => setNewExcelRow(prev => ({ ...prev, precio: e.target.value }))}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Button onClick={saveExcel} fullWidth>Guardar cambios</Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Producto</h2>
              <button className="modal-close" onClick={cerrarModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="emoji-input-row">
                <div className="emoji-picker-container" ref={emojiPickerRef}>
                  <button
                    type="button"
                    className="emoji-trigger-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {newEmoji || '🍏'}
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-picker-dropdown">
                      <input
                        type="text"
                        placeholder="Buscar emoji... (ej: tomate)"
                        value={emojiQuery}
                        onChange={(e) => setEmojiQuery(e.target.value)}
                        className="emoji-search-input"
                        autoFocus
                      />
                      <div className="emoji-picker-grid">
                        {displayEmojis.map(item => (
                          <button
                            key={item.emoji}
                            type="button"
                            className="emoji-option-btn"
                            onClick={() => {
                              setNewEmoji(item.emoji);
                              setShowEmojiPicker(false);
                              setEmojiQuery('');
                            }}
                          >
                            {item.emoji}
                          </button>
                        ))}
                        {displayEmojis.length === 0 && (
                          <div className="no-emoji-found">No hay resultados</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="modal-input flex-1"
                />
              </div>
              <div className="unidad-select">
                <label className="unidad-label">Unidad</label>
                <div className="unidad-options">
                  {UNIDADES_OPCIONALES.map(u => (
                    <button
                      key={u}
                      className={`unidad-btn ${newUnidad === u ? 'active' : ''}`}
                      onClick={() => setNewUnidad(u)}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={crearProducto} fullWidth>Crear Producto</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
