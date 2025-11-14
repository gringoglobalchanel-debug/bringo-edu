import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

export class PremiumService {
  static async verificarSuscripcion(usuario) {
    console.log("🔍 Verificando suscripción para:", usuario?.email);
    
    // SIMULACIÓN: Siempre devolver FREE para testing
    return { 
      tienePremium: false, 
      diasRestantes: 0, 
      enPrueba: false 
    };
  }

  static async activarSuscripcion(usuario, plan) {
    console.log("🎯 Activando suscripción:", usuario?.email, plan);
    return true;
  }

  static puedeCrearClase(clases = [], tienePremium) {
    return tienePremium || clases.length < 1;
  }

  static getVistasPremium() {
    return ['porcentajes', 'progreso', 'planificacion'];
  }

  static esVistaPremium(vista) {
    return this.getVistasPremium().includes(vista);
  }
}
