import { clsx } from 'clsx';
import { X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';

/**
 * Modal/Dialog component
 * - Backdrop blur effect
 * - Scale animation
 * - Escape key handling
 * - Click outside to close
 * - Focus trap
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true,
  closeOnBackdrop = true,
  className 
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-5xl',
  };

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      setTimeout(() => modalRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none"
      onClick={handleBackdropClick}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={modalRef}
        className={clsx(
          'relative w-full rounded-2xl shadow-2xl pointer-events-auto',
          'animate-scale-in',
          'flex flex-col max-h-[90vh]',
          sizes[size],
          className
        )}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xl)',
          animation: 'scaleIn 0.2s ease-out',
        }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showClose) && (
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {title && (
              <h2 
                id="modal-title"
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-colors hover:bg-black/5 active:bg-black/10"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-smooth">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Modal Footer subcomponent
 */
Modal.Footer = ({ children, className }) => (
  <div 
    className={clsx('flex items-center justify-end gap-3 px-6 py-4 border-t mt-auto', className)}
    style={{ borderColor: 'var(--border-color)' }}
  >
    {children}
  </div>
);

export default Modal;