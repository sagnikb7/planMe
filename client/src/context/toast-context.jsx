import './toast-context.css';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, variant = 'success') => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

function Toaster({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-viewport" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className="toast" data-variant={t.variant} role="status">
          <span>{t.message}</span>
          <button className="toast-dismiss" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
