import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const db = getFirestore();

export class PremiumService {
  static async verificarSuscripcion(usuario) {
    if (!usuario) return { tienePremium: false, diasRestantes: 0 };
    
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', usuario.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const suscripcion = userData.suscripcion || {};
        
        if (suscripcion.estado === 'active') {
          return { tienePremium: false, diasRestantes: 0, plan: suscripcion.plan };
        }
        
        // Verificar período de prueba (14 días)
        if (userData.fechaRegistro) {
          const fechaRegistro = new Date(userData.fechaRegistro);
          const hoy = new Date();
          const diasTranscurridos = Math.floor((hoy - fechaRegistro) / (1000 * 60 * 60 * 24));
          const diasRestantes = Math.max(0, 14 - diasTranscurridos);
          
          return { 
            tienePremium: diasRestantes > 0, 
            diasRestantes, 
            enPrueba: diasRestantes > 0 
          };
        }
      }
      
      // Usuario nuevo - crear registro
      if (usuario.uid) {
        await setDoc(doc(db, 'usuarios', usuario.uid), {
          email: usuario.email,
          nombre: usuario.nombre,
          fechaRegistro: new Date().toISOString(),
          suscripcion: { estado: 'trial' }
        });
        return { tienePremium: false, diasRestantes: 14, enPrueba: true };
      }
      
      return { tienePremium: false, diasRestantes: 0 };
    } catch (error) {
      console.error('Error verificando suscripción:', error);
      return { tienePremium: false, diasRestantes: 0 };
    }
  }

  static async activarSuscripcion(usuario, plan) {
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid), {
        'suscripcion.estado': 'active',
        'suscripcion.plan': plan,
        'suscripcion.fechaActivacion': new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error activando suscripción:', error);
      return false;
    }
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
// Fri Nov 14 17:21:22 EST 2025 - free mode
