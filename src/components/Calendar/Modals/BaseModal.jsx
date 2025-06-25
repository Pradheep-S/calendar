import React, { useEffect, useState } from 'react';

const BaseModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  showCloseButton = true,
  fullScreenOnMobile = false
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  
  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-2 touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full overflow-hidden animate-scaleIn
          ${fullScreenOnMobile ? 'sm:max-w-md' : 'max-w-sm sm:max-w-md'}`}
        style={{
          maxHeight: isMobile ? '90vh' : '85vh',
          height: isMobile && fullScreenOnMobile ? 'auto' : 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">{typeof title === 'string' ? title : title}</h3>
          {showCloseButton && (
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
              aria-label="Close modal"
            >
              &times;
            </button>
          )}
        </div>
        
        {/* Content - Better height handling for mobile */}
        <div 
          className="overflow-y-auto p-3 sm:p-4" 
          style={{
            maxHeight: isMobile ? 'calc(80vh - 70px)' : 'calc(85vh - 130px)',
            minHeight: isMobile ? '50vh' : 'auto'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;