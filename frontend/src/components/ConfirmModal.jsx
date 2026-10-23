import React, { useEffect } from 'react';

const ConfirmModal = ({ isOpen, title, message, itemName, onConfirm, onCancel, isProcessing }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="modal-dialog">
        <div className="modal-icon-badge" aria-hidden="true">
          ⚠️
        </div>

        <div className="modal-text">
          <h3 id="confirm-modal-title">{title || 'Confirm Action'}</h3>
          <p>{message || 'Are you sure you want to proceed? This action cannot be undone.'}</p>
          {itemName && (
            <span className="modal-target-title" title={itemName}>
              {itemName}
            </span>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isProcessing}
            id="cancel-delete-modal-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isProcessing}
            id="confirm-delete-modal-btn"
            autoFocus
          >
            {isProcessing ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Deleting...</span>
              </>
            ) : (
              'Delete Record'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
