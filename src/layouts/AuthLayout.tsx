import React from 'react';
import { motion } from 'framer-motion';

const AuthLayout: React.FC<{ children: React.ReactNode; title: string; subtitle: string }> = ({ children, title, subtitle }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Left side: Branding / Pattern */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          flex: 1,
          background: 'var(--brand-gradient)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: 'white',
          position: 'relative'
        }}
      >
        {/* Abstract shapes for premium feel */}
        <div style={{
          position: 'absolute', top: '10%', left: '10%', width: 300, height: 300,
          background: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400,
          background: 'rgba(16,185,129,0.3)', borderRadius: '50%', filter: 'blur(60px)'
        }} />
        
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>TaskFlow</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '400px', lineHeight: 1.6 }}>Manage your engineering tasks with clarity, precision, and speed.</p>
        </div>
      </motion.div>

      {/* Right side: Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        position: 'relative'
      }}>
        {/* Soft background glow */}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card"
          style={{ width: '100%', maxWidth: 440, padding: '40px', zIndex: 1 }}
        >
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{title}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
