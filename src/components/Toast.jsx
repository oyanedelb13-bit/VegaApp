'use client';
import { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import './Toast.css';

export function Toast() {
  const { state, hideToast } = useStore();
  const toast = state.toast;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}

export function useToast() {
  const { showToast } = useStore();
  return showToast;
}
