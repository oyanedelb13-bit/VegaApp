'use client';
import { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import './Toast.css';

export function Toast() {
  const { state, dispatch } = useStore();
  const toast = state.toast;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

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
  const { dispatch } = useStore();

  return (message, type = 'info', duration = 3000) => {
    dispatch({
      type: 'SHOW_TOAST',
      payload: { message, type, duration }
    });
  };
}
