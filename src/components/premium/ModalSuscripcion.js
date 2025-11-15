import React, { useState } from 'react';
import { Crown, CheckCircle, CreditCard, Star, X } from 'lucide-react';

const ModalSuscripcion = ({ 
  mostrar, 
  onCerrar, 
  onSuscribirse, 
  trackEvent,
  usuario 
}) => {
  const [planSeleccionado, setPlanSeleccionado] = useState('monthly');

  if (!mostrar) {
    console.log("🚫 Modal no mostrar");
    return null;
  }

  console.log("✅ Modal SÍ mostrar - renderizando");

  // ESTILOS INLINE que NO pueden fallar
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px'
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: '3px solid #8b5cf6'
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <h1 style={{color: '#8b5cf6', fontSize: '28px', fontWeight: 'bold', marginBottom: '10px'}}>
            🎉 ¡MODAL VISIBLE!
          </h1>
          <p style={{color: '#666', fontSize: '16px'}}>
            El sistema premium funciona correctamente
          </p>
        </div>

        <div style={{backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '10px', marginBottom: '20px'}}>
          <h2 style={{color: '#0369a1', marginBottom: '10px'}}>Planes Disponibles</h2>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
            <button 
              onClick={() => setPlanSeleccionado('monthly')}
              style={{
                backgroundColor: planSeleccionado === 'monthly' ? '#8b5cf6' : '#e5e7eb',
                color: planSeleccionado === 'monthly' ? 'white' : '#374151',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              $9/mes
            </button>
            <button 
              onClick={() => setPlanSeleccionado('yearly')}
              style={{
                backgroundColor: planSeleccionado === 'yearly' ? '#8b5cf6' : '#e5e7eb',
                color: planSeleccionado === 'yearly' ? 'white' : '#374151',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              $54/año
            </button>
          </div>
        </div>

        <button 
          onClick={onCerrar}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            width: '100%',
            fontSize: '16px'
          }}
        >
          CERRAR MODAL DE PRUEBA
        </button>

        <p style={{textAlign: 'center', marginTop: '15px', color: '#6b7280', fontSize: '12px'}}>
          Usuario: {usuario?.email}
        </p>
      </div>
    </div>
  );
};

export default ModalSuscripcion;
