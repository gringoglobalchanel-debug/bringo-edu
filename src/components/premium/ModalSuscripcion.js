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

  if (!mostrar) return null;

  console.log("🎯 MODAL VISIBLE - renderizando...");

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2 style={{color: 'red', fontSize: '24px', textAlign: 'center'}}>
          🎉 ¡MODAL FUNCIONANDO!
        </h2>
        <p>Plan: {planSeleccionado}</p>
        <p>Usuario: {usuario?.email}</p>
        <button 
          onClick={onCerrar}
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            marginTop: '20px'
          }}
        >
          CERRAR MODAL
        </button>
      </div>
    </div>
  );
};

export default ModalSuscripcion;
