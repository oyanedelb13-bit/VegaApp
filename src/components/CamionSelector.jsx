'use client';
import { useState } from 'react';
import { ChevronDown, Plus, Check, Truck } from 'lucide-react';
import { useStore, useActiveCamion } from '../context/StoreContext';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import './CamionSelector.css';

export function CamionSelector() {
  const { state, dispatch } = useStore();
  const activeCamion = useActiveCamion();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCamionName, setNewCamionName] = useState('');

  const openCamiones = state.camiones.filter(c => c.estado === 'abierto');
  const closedCamiones = state.camiones.filter(c => c.estado === 'cerrado');

  function handleSelectCamion(id) {
    dispatch({ type: 'SET_ACTIVE_CAMION', payload: id });
    setIsOpen(false);
  }

  function handleCreateCamion() {
    if (!newCamionName.trim()) return;

    dispatch({
      type: 'CREATE_CAMION',
      payload: {
        nombre: newCamionName.trim(),
        fecha: new Date().toISOString()
      }
    });
    setNewCamionName('');
    setShowNewModal(false);
    setIsOpen(false);
  }

  function handleCloseCamion() {
    dispatch({ type: 'CLOSE_CAMION' });
    setIsOpen(false);
  }

  if (!activeCamion) return null;

  return (
    <>
      <button className="camion-selector" onClick={() => setIsOpen(!isOpen)}>
        <Truck size={18} className="camion-icon" />
        <span className="camion-name">{activeCamion.nombre}</span>
        <span className={`camion-status ${activeCamion.estado}`}>
          {activeCamion.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
        </span>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="camion-dropdown">
          <div className="camion-dropdown-header">
            <span>Seleccionar Camión</span>
            <button className="new-camion-btn" onClick={() => setShowNewModal(true)}>
              <Plus size={16} />
              Nuevo
            </button>
          </div>

          {openCamiones.length > 0 && (
            <div className="camion-list">
              <span className="camion-list-label">Abiertos</span>
              {openCamiones.map(c => (
                <button
                  key={c.id}
                  className={`camion-item ${c.id === activeCamion.id ? 'active' : ''}`}
                  onClick={() => handleSelectCamion(c.id)}
                >
                  <span>{c.nombre}</span>
                  {c.id === activeCamion.id && <Check size={16} />}
                </button>
              ))}
            </div>
          )}

          {closedCamiones.length > 0 && (
            <div className="camion-list">
              <span className="camion-list-label">Cerrados</span>
              {closedCamiones.map(c => (
                <button
                  key={c.id}
                  className={`camion-item ${c.id === activeCamion.id ? 'active' : ''}`}
                  onClick={() => handleSelectCamion(c.id)}
                >
                  <span>{c.nombre}</span>
                  {c.id === activeCamion.id && <Check size={16} />}
                </button>
              ))}
            </div>
          )}

          {activeCamion.estado === 'abierto' && (
            <button className="close-camion-btn" onClick={handleCloseCamion}>
              Cerrar Jornada
            </button>
          )}
        </div>
      )}

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nuevo Camión"
        size="small"
      >
        <div className="new-camion-form">
          <Input
            label="Nombre del Camión"
            value={newCamionName}
            onChange={(e) => setNewCamionName(e.target.value)}
            placeholder="Ej: Camión Miércoles 30/Jul"
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNewModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateCamion} disabled={!newCamionName.trim()}>
            Crear Camión
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
