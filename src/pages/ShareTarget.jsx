import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ShareTarget() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const title = searchParams.get('title') || '';
    const text = searchParams.get('text') || '';
    const url = searchParams.get('url') || '';
    const notes = [title, text, url].filter(Boolean).join(' — ');

    if (!currentUser) {
      // Not logged in — go to login, then come back
      navigate('/login', { state: { from: '/share-target', sharedNotes: notes } });
      return;
    }

    // Logged in — go to the add log page with shared content pre-filled as notes
    navigate('/add', { state: { sharedNotes: notes } });
  }, [currentUser, navigate, searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f8fafc',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '4px solid #3b82f6',
            borderTopColor: 'transparent',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b' }}>Opening Fuel Guard…</p>
      </div>
    </div>
  );
}
