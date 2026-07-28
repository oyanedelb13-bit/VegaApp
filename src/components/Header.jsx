'use client';
import { Leaf } from 'lucide-react';
import { CamionSelector } from './CamionSelector';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <Leaf size={22} className="logo-icon" />
          <span className="logo-text">Vega</span>
        </div>
        <div className="header-center">
          <CamionSelector />
        </div>
      </div>
    </header>
  );
}
