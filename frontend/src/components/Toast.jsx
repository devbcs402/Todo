import React from 'react';

const Toast = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type || 'info'}`}
          onClick={() => onDismiss(toast.id)}
          role="status"
          style={{ cursor: 'pointer' }}
          title="Click to dismiss"
        >
          <span aria-hidden="true">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default Toast;
