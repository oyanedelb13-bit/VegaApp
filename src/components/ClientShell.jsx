'use client';
import { StoreProvider } from '../context/StoreContext';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Toast } from './Toast';
import { ChatBot } from './ChatBot';

export function ClientShell({ children }) {
  return (
    <StoreProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          {children}
        </main>
        <BottomNav />
        <Toast />
        <ChatBot />
      </div>
    </StoreProvider>
  );
}
