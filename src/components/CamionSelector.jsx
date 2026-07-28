'use client';
import { useState } from 'react';
import { ChevronDown, Plus, Check, Truck, Trash2 } from 'lucide-react';
import { useStore, useActiveCamion } from '../context/StoreContext';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useToast } from './Toast';
import './CamionSelector.css';

export function CamionSelector() {
  const { state, crearCamion, cerrarCamion, deleteCamion, setActiveCamion } = useStore();
  const activeCamion = useActiveCamion();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCamionName, setNewCamionName] = useState('');

  const openCamiones = state.camiones.filter(c => c.estado === 'abierto');
  const closedCamiones = state.camiones.filter(c => c.estado === 'cerrado');

  async function handleSelectCamion(id) {
    await setActiveCamion(id);
    setIsOpen(false);
  }

  async function handleCreateCamion() {
    if (!newCamionName.trim()) return;
    await crearCamion(newCamionName.trim(), new Date().toISOString());
    setNewCamionName('');
    setShowNewModal(false);
    setIsOpen(false);
  }

  async function handleCloseCamion() {
    await cerrarCamion();
    setIsOpen(false);
  }

  async function handleDeleteCamion(camionId, camionNombre) {
    if (!confirm(`¿Borrar "${camionNombre}"?\n\nSe eliminarán todos sus pedidos y stock permanentemente.`)) return;
    await deleteCamion(camionId);
    toast('Camión eliminado', 'success');
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
                <div key={c.id} className="camion-item-row">
                  <button
                    className={`camion-item ${c.id === activeCamion.id ? 'active' : ''}`}
                    onClick={() => handleSelectCamion(c.id)}
                  >
                    <span>{c.nombre}</span>
                    {c.id === activeCamion.id && <Check size={16} />}
                  </button>
                  {state.camiones.length > 1 && (
                    <button
                      className="camion-delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCamion(c.id, c.nombre); }}
                      title="Borrar camión"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {closedCamiones.length > 0 && (
            <div className="camion-list">
              <span className="camion-list-label">Cerrados</span>
              {closedCamiones.map(c => (
                <div key={c.id} className="camion-item-row">
                  <button
                    className={`camion-item ${c.id === activeCamion.id ? 'active' : ''}`}
                    onClick={() => handleSelectCamion(c.id)}
                  >
                    <span>{c.nombre}</span>
                    {c.id === activeCamion.id && <Check size={16} />}
                  </button>
                  <button
                    className="camion-delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteCamion(c.id, c.nombre); }}
                    title="Borrar camión"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
