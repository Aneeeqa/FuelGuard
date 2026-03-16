import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicNavBar({ showToggle = false, toggleValue = false, onToggle, isBlue = false }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/login', label: 'Login' },
    { to: '/signup', label: 'Sign Up' },
  ];

  // Theme-aware accent colors
  const accentText   = isBlue ? '#60A5FA' : '#FB923C';
  const accentBg     = isBlue ? 'rgba(37,99,235,0.12)' : 'rgba(234,88,12,0.12)';
  const accentBorder = isBlue ? '#2563EB' : '#EA580C';
  const dropdownBg   = isBlue ? 'rgba(3, 10, 28, 0.97)' : 'rgba(9, 7, 4, 0.97)';
  const dropdownBorderColor = isBlue ? 'rgba(37,99,235,0.28)' : 'rgba(234,88,12,0.18)';
  const dropdownShadow = isBlue ? '0 8px 32px rgba(37,99,235,0.18)' : '0 8px 32px rgba(0,0,0,0.5)';

  const ToggleSwitch = () => (
    <button
      onClick={onToggle}
      aria-label="Switch homepage style"
      style={{
        position: 'relative',
        width: '42px',
        height: '23px',
        borderRadius: '999px',
        backgroundColor: toggleValue ? '#2563EB' : '#EA580C',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background-color 0.35s',
        boxShadow: toggleValue
          ? '0 0 10px rgba(37,99,235,0.5)'
          : '0 0 10px rgba(234,88,12,0.5)',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2.5px',
        left: toggleValue ? '21px' : '2.5px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
        transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }} />
    </button>
  );

  // Desktop: fully transparent — no ribbon visible at all
  // Mobile: dark frosted glass with logo
  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9000,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    transition: 'background-color 0.35s, border-color 0.35s',
    backgroundColor: isMobile
      ? (scrolled ? 'rgba(9, 7, 4, 0.95)' : 'rgba(9, 7, 4, 0.85)')
      : 'transparent',
    backdropFilter: isMobile ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isMobile ? 'blur(20px)' : 'none',
    borderBottom: isMobile
      ? (scrolled ? `1px solid ${dropdownBorderColor}` : '1px solid rgba(255,255,255,0.05)')
      : 'none',
  };

  return (
    <>
      <nav style={navStyle}>
        {/* Logo + brand — mobile only */}
        {isMobile && (
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', flexShrink: 0 }}
          >
            <img
              src="/logo.png"
              alt="Fuel Guard"
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
            />
            <span style={{
              color: '#fff', fontWeight: 700, fontSize: '15px',
              letterSpacing: '-0.01em', userSelect: 'none',
            }}>
              Fuel Guard
            </span>
          </Link>
        )}

        {/* Right side: toggle + hamburger */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showToggle && <ToggleSwitch />}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle navigation menu"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.9)', padding: '4px', display: 'flex',
              alignItems: 'center', borderRadius: '6px', flexShrink: 0,
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(10px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '60px',
              right: '16px',
              zIndex: 8999,
              backgroundColor: dropdownBg,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: `1px solid ${dropdownBorderColor}`,
              borderRadius: '16px',
              padding: '8px',
              minWidth: '160px',
              boxShadow: dropdownShadow,
            }}
          >
            {links.map((link, i) => {
              const active = pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: active ? accentText : 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    backgroundColor: active ? accentBg : 'transparent',
                    marginBottom: i < links.length - 1 ? '2px' : 0,
                    borderLeft: active ? `2px solid ${accentBorder}` : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
