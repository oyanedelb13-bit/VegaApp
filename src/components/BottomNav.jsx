import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Package, BarChart3 } from 'lucide-react';
import './BottomNav.css';

const tabs = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = pathname === `/${tab.id}`;

        return (
          <button
            key={tab.id}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => router.push(`/${tab.id}`)}
          >
            <Icon size={22} className="nav-icon" />
            <span className="nav-label">{tab.label}</span>
            {isActive && <span className="nav-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
