'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useStore, useActiveCamion, useCamionProductos } from '../context/StoreContext';
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
  const { state, dispatch } = useStore();
  const activeCamion = useActiveCamion();
  const camionProductos = useCamionProductos();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newEmoji, setNewEmoji] = useState('🍏');
  const [newUnidad, setNewUnidad] = useState('unidad');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState('');
  const emojiPickerRef = useRef(null);

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
        <h2>No hay camion activo</h2>
      </div>
    );
  }

  function getCamionProduct(productoId) {
    return camionProductos.find(cp => cp.productoId === productoId) || { stockTotal: 0, reservado: 0 };
  }

  function handleUpdateStock(productoId, newStock) {
    const camion = state.camiones.find(c => c.id === state.activeCamionId);
    if (!camion) return;
    const productos = camion.productos.map(p =>
      p.productoId === productoId ? { ...p, stockTotal: newStock } : p
    );
    if (!productos.find(p => p.productoId === productoId)) {
      productos.push({ productoId, stockTotal: newStock, reservado: 0 });
    }
    dispatch({ type: 'UPDATE_CAMION_PRODUCTOS', payload: productos });
  }

  function handleUpdatePrecio(productoId, newPrecio) {
    dispatch({ type: 'UPDATE_PRODUCTO', payload: { id: productoId, precioDefault: newPrecio } });
  }

  function crearProducto() {
    if (!newNombre.trim()) { toast('Ingresa el nombre', 'error'); return; }
    const id = 'p' + Date.now().toString(36);
    dispatch({
      type: 'ADD_PRODUCTO',
      payload: {
        id,
        nombre: newNombre.trim(),
        emoji: newEmoji.trim(),
        unidad: newUnidad,
        activo: true,
        precioDefault: 0,
        nombreVariantes: [newNombre.trim().toLowerCase()]
      }
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

  const filteredProductos = state.productos.filter(p =>
    normalize(p.nombre).includes(normalize(search))
  );

  const filteredEmojis = EMOJI_LIST.filter(item =>
    item.tags.some(tag => normalize(tag).includes(normalize(emojiQuery)))
  );

  const showCustomOption = emojiQuery.trim() && !filteredEmojis.some(e => e.emoji === emojiQuery.trim());
  const displayEmojis = [...filteredEmojis];
  if (showCustomOption && emojiQuery.trim().length <= 4) {
    displayEmojis.unshift({ emoji: emojiQuery.trim(), tags: [emojiQuery.trim()] });
  }

  return (
    <div className="inventario">
      <div className="inventario-header">
        <h1 className="inventario-title">Inventario</h1>
        <span className="inventario-count">{state.productos.length}</span>
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
            />
          );
        })}
      </div>

      {filteredProductos.length === 0 && (
        <div className="inventario-empty-state">
          <p>No se encontraron productos</p>
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
