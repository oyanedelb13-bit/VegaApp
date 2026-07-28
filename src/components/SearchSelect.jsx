'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Plus, Trash2 } from 'lucide-react';
import './SearchSelect.css';

export function SearchSelect({ value, onChange, options, placeholder = 'Buscar...', allowClear = true, onCreateNew, onDeleteOption }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const showCreate = onCreateNew && query.trim() && !filtered.some(o => o.label.toLowerCase() === query.trim().toLowerCase());
  const totalItems = filtered.length + (showCreate ? 1 : 0);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  function handleSelect(opt) {
    onChange(opt.value);
    setIsOpen(false);
    setQuery('');
  }

  function handleCreate() {
    onCreateNew(query.trim());
    setIsOpen(false);
    setQuery('');
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showCreate && highlightIndex === filtered.length) {
        handleCreate();
      } else if (filtered[highlightIndex]) {
        handleSelect(filtered[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }

  return (
    <div className="search-select" ref={containerRef}>
      <button
        className={`search-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 50); }}
        type="button"
      >
        {selected ? (
          <span className="ss-selected">
            {selected.label}
          </span>
        ) : (
          <span className="ss-placeholder">{placeholder}</span>
        )}
        <span className="ss-chevron">
          {allowClear && value ? (
            <X size={14} onClick={(e) => { e.stopPropagation(); onChange(''); }} />
          ) : (
            <ChevronDown size={16} />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="ss-dropdown">
          <div className="ss-search-wrapper">
            <Search size={14} className="ss-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="ss-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribir para buscar..."
            />
          </div>
          <div className="ss-options">
            {filtered.length === 0 && !showCreate ? (
              <div className="ss-empty">Sin resultados</div>
            ) : (
              <>
                {filtered.map((opt, i) => (
                  <div
                    key={opt.value}
                    className={`ss-option-wrapper ${opt.value === value ? 'selected' : ''} ${i === highlightIndex ? 'highlighted' : ''}`}
                    onMouseEnter={() => setHighlightIndex(i)}
                  >
                    <button
                      className={`ss-option-btn ${opt.value === value ? 'selected' : ''}`}
                      onClick={() => handleSelect(opt)}
                      type="button"
                    >
                      <span>{opt.label}</span>
                    </button>
                    {onDeleteOption && (
                      <button
                        className="ss-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOption(opt.value);
                        }}
                        type="button"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {showCreate && (
                  <button
                    className={`ss-option ss-create ${highlightIndex === filtered.length ? 'highlighted' : ''}`}
                    onClick={handleCreate}
                    onMouseEnter={() => setHighlightIndex(filtered.length)}
                    type="button"
                  >
                    <Plus size={14} />
                    <span>Crear "{query.trim()}"</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
