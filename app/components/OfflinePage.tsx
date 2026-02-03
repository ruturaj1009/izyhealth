'use client';

import { useState, useEffect } from 'react';

export default function OfflinePage() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Initial check
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .offline-container {
          animation: fadeIn 1.5s ease-out forwards;
        }
      `}</style>
      <div 
        className="offline-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.95)', // Deep blue-gray with blur opacity
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e2e8f0',
          fontFamily: '"Segoe UI", sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}
      >
        <div style={{ 
          marginBottom: '24px', 
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '30px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <i className="fa-solid fa-wifi" style={{ fontSize: '40px', color: '#f43f5e' }}></i>
        </div>
        
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
           No Internet Connection
        </h2>
        
        <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '300px', lineHeight: '1.6', marginBottom: '30px' }}>
          It seems you're offline. Check your connection or try again later.
        </p>
        
        <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 32px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
        >
            Try Again
        </button>
      </div>
    </>
  );
}
