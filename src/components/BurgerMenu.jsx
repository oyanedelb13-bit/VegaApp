'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, LayoutDashboard, ClipboardList, Package, BarChart3, X } from 'lucide-react';
import './BurgerMenu.css';

const tabs = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'analytics', label: 'Estadisticas', icon: BarChart3 }
];

export function BurgerMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="burger-btn" onClick={() => setIsOpen(true)}>
        <Menu size={24} />
      </button>

      {isOpen && (
        <>
          <div className="burger-overlay" onClick={() => setIsOpen(false)} />
          <div className="burger-drawer">
            <div className="burger-header">
              <span className="burger-title">Vega</span>
              <button className="burger-close" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="burger-nav">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = pathname === `/${tab.id}`;
                return (
                  <button
                    key={tab.id}
                    className={`burger-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      router.push(`/${tab.id}`);
                      setIsOpen(false);
                    }}
                  >
                    <Icon size={22} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
