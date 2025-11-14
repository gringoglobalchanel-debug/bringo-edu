import { useState, useEffect } from 'react';
import { PremiumService } from '../services/premium-service';

export const usePremium = (usuario, clases = []) => {
  const [estadoPremium, setEstadoPremium] = useState({
    tienePremium: false,
    diasRestantes: 0,
    enPrueba: false,
    cargando: true
  });

  useEffect(() => {
    const verificarPremium = async () => {
      if (usuario) {
        setEstadoPremium(prev => ({ ...prev, cargando: true }));
        const resultado = await PremiumService.verificarSuscripcion(usuario);
        setEstadoPremium({ ...resultado, cargando: false });
      } else {
        setEstadoPremium({ 
          tienePremium: false, 
          diasRestantes: 0, 
          enPrueba: false, 
          cargando: false 
        });
      }
    };

    verificarPremium();
  }, [usuario]);

  const puedeCrearClase = PremiumService.puedeCrearClase(clases, estadoPremium.tienePremium);
  const esVistaDisponible = (vista) => {
    if (!PremiumService.esVistaPremium(vista)) return true;
    return estadoPremium.tienePremium;
  };

  const activarSuscripcion = async (plan) => {
    const exito = await PremiumService.activarSuscripcion(usuario, plan);
    if (exito) {
      setEstadoPremium(prev => ({ 
        ...prev, 
        tienePremium: true, 
        enPrueba: false,
        diasRestantes: 0 
      }));
    }
    return exito;
  };

  return {
    ...estadoPremium,
    puedeCrearClase,
    esVistaDisponible,
    activarSuscripcion,
    vistasPremium: PremiumService.getVistasPremium()
  };
};
