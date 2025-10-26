import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, AlertCircle, Users, Home, ChevronDown, ChevronUp, ClipboardList, Calendar, Sparkles, User, LogOut, LogIn, TrendingUp, BarChart3, Target, Award, AlertTriangle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCdRpj7y3L4PIwWiJgzYRHDU3XxcIVfmW4",
  authDomain: "bringoedu.firebaseapp.com",
  projectId: "bringoedu",
  storageBucket: "bringoedu.firebasestorage.app", 
  messagingSenderId: "667720262345",
  appId: "1:667720262345:web:ad55dd71c19ffcb73fa318"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Componente para gráfico de distribución - CORREGIDO
const DistribucionNotas = ({ estudiantes, calcularPromedioFinal }) => {
  const calcularDistribucion = () => {
    const distribucion = {
      excelente: 0, // 4.5 - 5.0
      bueno: 0,     // 3.5 - 4.4
      regular: 0,   // 3.0 - 3.4
      riesgo: 0     // 0 - 2.9
    };

    estudiantes.forEach(estudiante => {
      const promedio = parseFloat(calcularPromedioFinal(estudiante));
      if (promedio >= 4.5) distribucion.excelente++;
      else if (promedio >= 3.5) distribucion.bueno++;
      else if (promedio >= 3.0) distribucion.regular++;
      else if (promedio > 0) distribucion.riesgo++;
    });

    return distribucion;
  };

  const distribucion = calcularDistribucion();
  const total = estudiantes.length;
  
  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay datos suficientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-green-600">Excelente (4.5-5.0)</span>
        <span className="text-sm font-bold">{distribucion.excelente} ({Math.round((distribucion.excelente/total)*100)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-green-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${(distribucion.excelente/total)*100}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-blue-600">Bueno (3.5-4.4)</span>
        <span className="text-sm font-bold">{distribucion.bueno} ({Math.round((distribucion.bueno/total)*100)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${(distribucion.bueno/total)*100}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-yellow-600">Regular (3.0-3.4)</span>
        <span className="text-sm font-bold">{distribucion.regular} ({Math.round((distribucion.regular/total)*100)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${(distribucion.regular/total)*100}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-red-600">En Riesgo (0-2.9)</span>
        <span className="text-sm font-bold">{distribucion.riesgo} ({Math.round((distribucion.riesgo/total)*100)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-red-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${(distribucion.riesgo/total)*100}%` }}
        ></div>
      </div>
    </div>
  );
};

// Componentes de Modal fuera del componente principal para evitar re-renders
const ModalLogin = ({ 
  mostrarLogin, 
  setMostrarLogin, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  errorAuth, 
  cargandoAuth, 
  iniciarSesion, 
  limpiarFormulariosAuth,
  setMostrarRegistro 
}) => {
  if (!mostrarLogin) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    iniciarSesion();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 text-center">
          <div className="inline-block bg-white rounded-full p-4 mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">¡Bienvenido de nuevo!</h3>
          <p className="text-purple-100 text-sm">Ingresa a tu cuenta de Bringo Edu</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          {errorAuth && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm font-semibold">{errorAuth}</p>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span className="text-purple-600">📧</span> Email
              </label>
              <input
                type="email"
                placeholder="profesor@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span className="text-purple-600">🔒</span> Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={cargandoAuth}
            className={`w-full mt-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              cargandoAuth
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl transform hover:scale-[1.02]'
            } text-white`}
          >
            {cargandoAuth ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setMostrarLogin(false);
              limpiarFormulariosAuth();
            }}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-semibold"
          >
            Cancelar
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">¿No tienes cuenta?</p>
            <button
              type="button"
              onClick={() => {
                setMostrarLogin(false);
                setMostrarRegistro(true);
              }}
              className="text-purple-600 hover:text-purple-800 font-bold text-lg hover:underline"
            >
              Regístrate aquí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModalRegistro = ({ 
  mostrarRegistro, 
  setMostrarRegistro, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  nombreUsuario, 
  setNombreUsuario, 
  confirmarPassword, 
  setConfirmarPassword, 
  errorAuth, 
  cargandoAuth, 
  registrarUsuario, 
  limpiarFormulariosAuth,
  setMostrarLogin 
}) => {
  if (!mostrarRegistro) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    registrarUsuario();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-900/95 via-teal-900/95 to-blue-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        <div className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 p-8 text-center">
          <div className="inline-block bg-white rounded-full p-4 mb-4 shadow-lg">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">¡Únete a Bringo Edu!</h3>
          <p className="text-green-100 text-sm">Crea tu cuenta y comienza a gestionar tus clases</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          {errorAuth && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm font-semibold">{errorAuth}</p>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span className="text-green-600">👤</span> Nombre Completo
              </label>
              <input
                type="text"
                placeholder="Prof. Juan Pérez"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span className="text-green-600">📧</span> Email
              </label>
              <input
                type="email"
                placeholder="profesor@escuela.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span className="text-green-600">🔒</span> Contraseña
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">Usa letras, números y símbolos</p>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span className="text-green-600">✅</span> Confirmar Contraseña
              </label>
              <input
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={cargandoAuth}
            className={`w-full mt-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              cargandoAuth
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 hover:shadow-xl transform hover:scale-[1.02]'
            } text-white`}
          >
            {cargandoAuth ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setMostrarRegistro(false);
              limpiarFormulariosAuth();
            }}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-semibold"
          >
            Cancelar
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">¿Ya tienes cuenta?</p>
            <button
              type="button"
              onClick={() => {
                setMostrarRegistro(false);
                setMostrarLogin(true);
              }}
              className="text-green-600 hover:text-green-800 font-bold text-lg hover:underline"
            >
              Inicia sesión aquí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AsistenteProfesor() {
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [errorAuth, setErrorAuth] = useState('');
  const [cargandoAuth, setCargandoAuth] = useState(false);
  
  const [view, setView] = useState('home');
  const [clases, setClases] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [nombreClase, setNombreClase] = useState('');
  const [grado, setGrado] = useState('');
  const [seccion, setSeccion] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [nombreEstudiante, setNombreEstudiante] = useState('');
  const [expandido, setExpandido] = useState({});
  const [fechaActual, setFechaActual] = useState(new Date().toISOString().split('T')[0]);
  
  const [nombreProfesor, setNombreProfesor] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [gradoPlan, setGradoPlan] = useState('');
  const [materia, setMateria] = useState('');
  const [trimestre, setTrimestre] = useState('Primer Trimestre');
  const [planGenerado, setPlanGenerado] = useState(null);
  const [generandoPlan, setGenerandoPlan] = useState(false);

  // Efecto para manejar el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuario({ 
          email: user.email, 
          nombre: user.displayName || user.email.split('@')[0],
          uid: user.uid 
        });
        cargarClases(user.uid);
      } else {
        setUsuario(null);
        setClases([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Cargar clases desde Firestore
  const cargarClases = async (userId) => {
    try {
      const q = query(collection(db, 'clases'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const clasesData = [];
      querySnapshot.forEach((doc) => {
        clasesData.push({ id: doc.id, ...doc.data() });
      });
      setClases(clasesData);
    } catch (error) {
      console.error('Error cargando clases:', error);
    }
  };

  const registrarUsuario = async () => {
    setErrorAuth('');
    
    if (!email || !password || !nombreUsuario) {
      setErrorAuth('Por favor completa todos los campos');
      return;
    }
    
    if (password !== confirmarPassword) {
      setErrorAuth('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setErrorAuth('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargandoAuth(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUsuario({ 
        email: userCredential.user.email, 
        nombre: nombreUsuario,
        uid: userCredential.user.uid 
      });
      setMostrarRegistro(false);
      limpiarFormulariosAuth();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorAuth('Este correo ya está registrado');
      } else if (error.code === 'auth/weak-password') {
        setErrorAuth('La contraseña es muy débil');
      } else {
        setErrorAuth('Error al registrar: ' + error.message);
      }
    } finally {
      setCargandoAuth(false);
    }
  };

  const iniciarSesion = async () => {
    setErrorAuth('');
    
    if (!email || !password) {
      setErrorAuth('Por favor ingresa email y contraseña');
      return;
    }

    setCargandoAuth(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUsuario({ 
        email: userCredential.user.email, 
        nombre: userCredential.user.displayName || userCredential.user.email.split('@')[0],
        uid: userCredential.user.uid 
      });
      setMostrarLogin(false);
      limpiarFormulariosAuth();
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setErrorAuth('Usuario no encontrado');
      } else if (error.code === 'auth/wrong-password') {
        setErrorAuth('Contraseña incorrecta');
      } else {
        setErrorAuth('Error al iniciar sesión: ' + error.message);
      }
    } finally {
      setCargandoAuth(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      setUsuario(null);
      setView('home');
      setClaseSeleccionada(null);
      setClases([]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const limpiarFormulariosAuth = () => {
    setEmail('');
    setPassword('');
    setNombreUsuario('');
    setConfirmarPassword('');
    setErrorAuth('');
  };

  // ✅ FUNCIÓN ACTUALIZADA: Generar plan trimestral
 // ✅ FUNCIÓN CORREGIDA: Generar plan trimestral con debug
const generarPlanConOpenAI = async () => {
  // DEBUG: Verificar los datos antes de enviar
  console.log('🔍 DEBUG - Datos del formulario:', {
    nombreProfesor,
    institucion,
    gradoPlan,
    materia,
    trimestre
  });

  if (!nombreProfesor.trim() || !institucion.trim() || !gradoPlan.trim() || !materia.trim() || !trimestre.trim()) {
    alert('Por favor completa todos los campos');
    return;
  }

  setGenerandoPlan(true);

  try {
    const BACKEND_URL = 'https://bringo-edu-backend-2.onrender.com/api/generate-plan';
    
    console.log('🚀 Enviando solicitud al backend...', BACKEND_URL);

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombreProfesor,
        institucion,
        gradoPlan,
        materia,
        trimestre
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status} del servidor`);
    }

    const data = await response.json();
    
    // DEBUG CRÍTICO: Ver qué está devolviendo realmente el backend
    console.log('🎯 RESPUESTA COMPLETA DEL BACKEND:', data);
    console.log('📚 Contenidos recibidos:', data.contenidos);
    console.log('💪 Competencias recibidas:', data.competencias);
    console.log('📖 Metodología recibida:', data.metodologia);
    console.log('🔑 Tiene generadoPorIA:', data.generadoPorIA);
    
    // Verificar si la respuesta tiene contenido real de IA
    if (!data.contenidos || !Array.isArray(data.contenidos) || data.contenidos.length === 0) {
      console.warn('⚠️ El backend no devolvió contenidos válidos');
      alert('El servicio de IA no generó contenido. Intenta nuevamente.');
      return;
    }
    
    console.log('✅ Plan trimestral generado exitosamente!', data);
    
    setPlanGenerado({
      ...data,
      fecha: data.fecha || new Date().toLocaleDateString('es-PA'),
      generadoPorIA: true
    });

  } catch (error) {
    console.error('❌ Error al generar plan:', error);
    alert(`Error al generar el plan: ${error.message}`);
  } finally {
    setGenerandoPlan(false);
  }
};
  // ✅ FUNCIÓN MEJORADA: Descargar plan trimestral
  const descargarPlan = () => {
    if (!planGenerado) return;

    let contenido = `PLAN TRIMESTRAL - BRINGO EDU\n`;
    contenido += `${'='.repeat(80)}\n\n`;
    
    contenido += `INFORMACIÓN GENERAL\n`;
    contenido += `-`.repeat(80) + `\n`;
    contenido += `Profesor: ${planGenerado.docente || planGenerado.profesor || nombreProfesor}\n`;
    contenido += `Institución: ${planGenerado.institucion}\n`;
    contenido += `Grado: ${planGenerado.grado || gradoPlan}\n`;
    contenido += `Asignatura: ${planGenerado.asignatura || planGenerado.materia || materia}\n`;
    contenido += `Trimestre: ${planGenerado.trimestre}\n`;
    contenido += `Año Escolar: ${planGenerado.anioEscolar || new Date().getFullYear()}\n`;
    contenido += `Duración: ${planGenerado.duracionSemanas || '10-12'} semanas\n`;
    contenido += `Fecha de generación: ${planGenerado.fecha || new Date().toLocaleDateString('es-PA')}\n\n`;

    if (planGenerado.contenidos && planGenerado.contenidos.length > 0) {
      contenido += `CONTENIDOS DEL TRIMESTRE\n`;
      contenido += `-`.repeat(80) + `\n`;
      planGenerado.contenidos.forEach((cont, i) => {
        contenido += `${i + 1}. ${cont}\n`;
      });
      contenido += `\n`;
    }

    if (planGenerado.competencias && planGenerado.competencias.length > 0) {
      contenido += `COMPETENCIAS A DESARROLLAR\n`;
      contenido += `-`.repeat(80) + `\n`;
      planGenerado.competencias.forEach((comp, i) => {
        contenido += `${i + 1}. ${comp}\n`;
      });
      contenido += `\n`;
    }

    if (planGenerado.indicadoresLogro && planGenerado.indicadoresLogro.length > 0) {
      contenido += `INDICADORES DE LOGRO\n`;
      contenido += `-`.repeat(80) + `\n`;
      planGenerado.indicadoresLogro.forEach((ind, i) => {
        contenido += `• ${ind}\n`;
      });
      contenido += `\n`;
    }

    if (planGenerado.metodologia) {
      contenido += `ESTRATEGIAS METODOLÓGICAS\n`;
      contenido += `-`.repeat(80) + `\n`;
      contenido += `${planGenerado.metodologia}\n\n`;
    }

    if (planGenerado.recursos && planGenerado.recursos.length > 0) {
      contenido += `RECURSOS EDUCATIVOS\n`;
      contenido += `-`.repeat(80) + `\n`;
      planGenerado.recursos.forEach((rec, i) => {
        contenido += `• ${rec}\n`;
      });
      contenido += `\n`;
    }

    if (planGenerado.evaluacion && Array.isArray(planGenerado.evaluacion) && planGenerado.evaluacion.length > 0) {
      contenido += `INSTRUMENTOS DE EVALUACIÓN\n`;
      contenido += `-`.repeat(80) + `\n`;
      planGenerado.evaluacion.forEach((evalItem, i) => {
        contenido += `• ${evalItem}\n`;
      });
      contenido += `\n`;
    }
   
    if (planGenerado.adaptaciones && planGenerado.adaptaciones.length > 0) {
      contenido += `ADAPTACIONES CURRICULARES\n`;
      contenido += `-`.repeat(80) + `\n`;
      planGenerado.adaptaciones.forEach((adap, i) => {
        contenido += `• ${adap}\n`;
      });
      contenido += `\n`;
    }

    if (planGenerado.observaciones) {
      contenido += `OBSERVACIONES\n`;
      contenido += `-`.repeat(80) + `\n`;
      contenido += `${planGenerado.observaciones}\n\n`;
    }

    contenido += `\n${'='.repeat(80)}\n`;
    contenido += `Generado con Bringo Edu - Asistente Inteligente para Profesores\n`;
    contenido += `Fecha: ${new Date().toLocaleDateString('es-PA')}\n`;

    const elemento = document.createElement('a');
    const archivo = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    elemento.href = URL.createObjectURL(archivo);
    elemento.download = `Plan_Trimestral_${planGenerado.asignatura || materia}_${planGenerado.trimestre.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
  };

  // FUNCIÓN MEJORADA CON DEBUG PARA CREAR CLASES
  const agregarClase = async () => {
    console.log('🔍 DEBUG - Iniciando agregarClase');
    console.log('Usuario:', usuario);
    console.log('Usuario UID:', usuario?.uid);
    
    if (!usuario) {
      console.log('❌ Usuario no autenticado');
      alert('Debes iniciar sesión para crear clases');
      setMostrarLogin(true);
      return;
    }

    if (!nombreClase.trim() || !grado.trim() || !seccion.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      console.log('🔄 Intentando conectar con Firestore...');
      
      const nuevaClase = {
        nombre: `${nombreClase} ${grado}${seccion}`,
        grado,
        seccion,
        materia: nombreClase,
        estudiantes: [],
        userId: usuario.uid,
        fechaCreacion: new Date().toISOString()
      };
      
      console.log('📦 Datos a guardar:', nuevaClase);
      
      const docRef = await addDoc(collection(db, 'clases'), nuevaClase);
      console.log('✅ Clase creada con ID:', docRef.id);
      
      setClases([...clases, { id: docRef.id, ...nuevaClase }]);
      setNombreClase('');
      setGrado('');
      setSeccion('');
      
    } catch (error) {
      console.error('❌ Error agregando clase:', error);
      console.error('Detalles del error:', error.message, error.code);
      alert(`Error al crear la clase: ${error.message}`);
    }
  };

  const eliminarClase = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta clase?')) {
      try {
        await deleteDoc(doc(db, 'clases', id));
        setClases(clases.filter(c => c.id !== id));
        if (claseSeleccionada?.id === id) {
          setClaseSeleccionada(null);
          setView('home');
        }
      } catch (error) {
        console.error('Error eliminando clase:', error);
        alert('Error al eliminar la clase');
      }
    }
  };

  const seleccionarClase = (clase) => {
    if (!usuario) {
      alert('Debes iniciar sesión para acceder a las clases');
      setMostrarLogin(true);
      return;
    }
    
    setClaseSeleccionada(clase);
    setEstudiantes(clase.estudiantes || []);
    setView('clase');
  };

  const agregarEstudiante = async () => {
    if (!nombreEstudiante.trim()) {
      alert('Ingresa el nombre del estudiante');
      return;
    }
    
    try {
      const nuevoEstudiante = {
        id: Date.now().toString(),
        nombre: nombreEstudiante,
        notasDiarias: [],
        apreciacion: [],
        examen: [],
        asistencia: {}
      };
      
      const nuevosEstudiantes = [...estudiantes, nuevoEstudiante];
      setEstudiantes(nuevosEstudiantes);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'clases', claseSeleccionada.id), {
        estudiantes: nuevosEstudiantes
      });
      
      // Actualizar estado local
      const clasesActualizadas = clases.map(c => 
        c.id === claseSeleccionada.id 
          ? { ...c, estudiantes: nuevosEstudiantes }
          : c
      );
      setClases(clasesActualizadas);
      setNombreEstudiante('');
    } catch (error) {
      console.error('Error agregando estudiante:', error);
      alert('Error al agregar estudiante');
    }
  };

  const marcarAsistencia = async (estudianteId, fecha, estado) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          return {
            ...e,
            asistencia: {
              ...e.asistencia,
              [fecha]: estado
            }
          };
        }
        return e;
      });
      setEstudiantes(nuevosEstudiantes);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'clases', claseSeleccionada.id), {
        estudiantes: nuevosEstudiantes
      });
      
      // Actualizar estado local
      const clasesActualizadas = clases.map(c => 
        c.id === claseSeleccionada.id 
          ? { ...c, estudiantes: nuevosEstudiantes }
          : c
      );
      setClases(clasesActualizadas);
    } catch (error) {
      console.error('Error marcando asistencia:', error);
    }
  };

  const agregarNota = async (estudianteId, seccion) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          return {
            ...e,
            [seccion]: [...e[seccion], { valor: '', fecha: new Date().toISOString().split('T')[0] }]
          };
        }
        return e;
      });
      setEstudiantes(nuevosEstudiantes);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'clases', claseSeleccionada.id), {
        estudiantes: nuevosEstudiantes
      });
      
      // Actualizar estado local
      const clasesActualizadas = clases.map(c => 
        c.id === claseSeleccionada.id 
          ? { ...c, estudiantes: nuevosEstudiantes }
          : c
      );
      setClases(clasesActualizadas);
    } catch (error) {
      console.error('Error agregando nota:', error);
    }
  };

  const actualizarNota = async (estudianteId, seccion, indice, campo, valor) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          const nuevasNotas = [...e[seccion]];
          nuevasNotas[indice] = { ...nuevasNotas[indice], [campo]: valor };
          return {
            ...e,
            [seccion]: nuevasNotas
          };
        }
        return e;
      });
      setEstudiantes(nuevosEstudiantes);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'clases', claseSeleccionada.id), {
        estudiantes: nuevosEstudiantes
      });
      
      // Actualizar estado local
      const clasesActualizadas = clases.map(c => 
        c.id === claseSeleccionada.id 
          ? { ...c, estudiantes: nuevosEstudiantes }
          : c
      );
      setClases(clasesActualizadas);
    } catch (error) {
      console.error('Error actualizando nota:', error);
    }
  };

  const eliminarNota = async (estudianteId, seccion, indice) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          const nuevasNotas = e[seccion].filter((_, i) => i !== indice);
          return {
            ...e,
            [seccion]: nuevasNotas
          };
        }
        return e;
      });
      setEstudiantes(nuevosEstudiantes);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'clases', claseSeleccionada.id), {
        estudiantes: nuevosEstudiantes
      });
      
      // Actualizar estado local
      const clasesActualizadas = clases.map(c => 
        c.id === claseSeleccionada.id 
          ? { ...c, estudiantes: nuevosEstudiantes }
          : c
      );
      setClases(clasesActualizadas);
    } catch (error) {
      console.error('Error eliminando nota:', error);
    }
  };

  const eliminarEstudiante = async (id) => {
    try {
      const nuevosEstudiantes = estudiantes.filter(e => e.id !== id);
      setEstudiantes(nuevosEstudiantes);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'clases', claseSeleccionada.id), {
        estudiantes: nuevosEstudiantes
      });
      
      // Actualizar estado local
      const clasesActualizadas = clases.map(c => 
        c.id === claseSeleccionada.id 
          ? { ...c, estudiantes: nuevosEstudiantes }
          : c
      );
      setClases(clasesActualizadas);
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      alert('Error al eliminar estudiante');
    }
  };

  const contarAsistencias = (estudiante) => {
    const registros = estudiante.asistencia || {};
    const presente = Object.values(registros).filter(v => v === 'presente').length;
    const ausente = Object.values(registros).filter(v => v === 'ausente').length;
    const tardanza = Object.values(registros).filter(v => v === 'tardanza').length;
    return { presente, ausente, tardanza };
  };

  const calcularTotalSeccion = (notas) => {
    if (!notas || notas.length === 0) return 0;
    const numeros = notas.map(n => {
      const valor = typeof n === 'object' ? parseFloat(n.valor) : parseFloat(n);
      return isNaN(valor) ? 0 : valor;
    }).filter(v => v > 0);
    if (numeros.length === 0) return 0;
    return (numeros.reduce((a, b) => a + b, 0) / numeros.length).toFixed(2);
  };

  const calcularPromedioFinal = (estudiante) => {
    const totalDiarias = parseFloat(calcularTotalSeccion(estudiante.notasDiarias));
    const totalApreciacion = parseFloat(calcularTotalSeccion(estudiante.apreciacion));
    const totalExamen = parseFloat(calcularTotalSeccion(estudiante.examen));
    
    const totales = [totalDiarias, totalApreciacion, totalExamen].filter(t => t > 0);
    if (totales.length === 0) return 0;
    
    return ((totalDiarias + totalApreciacion + totalExamen) / 3).toFixed(2);
  };

  const toggleExpansion = (estudianteId) => {
    setExpandido(prev => ({
      ...prev,
      [estudianteId]: !prev[estudianteId]
    }));
  };

  const estudiantesEnRiesgo = estudiantes.filter(e => parseFloat(calcularPromedioFinal(e)) < 3.0 && parseFloat(calcularPromedioFinal(e)) > 0);

  const promedioGeneral = () => {
    const promedios = estudiantes.map(e => parseFloat(calcularPromedioFinal(e))).filter(p => p > 0);
    if (promedios.length === 0) return 0;
    return (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(1);
  };

  // FUNCIONES PARA LA VISTA DE PROGRESO
  const obtenerRankingEstudiantes = () => {
    return estudiantes
      .map(estudiante => ({
        ...estudiante,
        promedio: parseFloat(calcularPromedioFinal(estudiante))
      }))
      .filter(e => e.promedio > 0)
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 5); // Top 5
  };

  const obtenerEvolucionNotas = (estudiante) => {
    const todasLasNotas = [
      ...estudiante.notasDiarias,
      ...estudiante.apreciacion, 
      ...estudiante.examen
    ].filter(nota => nota.valor && parseFloat(nota.valor) > 0);
    
    return todasLasNotas
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(-6); // Últimas 6 notas
  };

  // FUNCIONES MEJORADAS DE DESCARGA
  const generarReporteNotasPDF = () => {
    if (!claseSeleccionada) return;

    let contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Notas - ${claseSeleccionada.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #4f46e5; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #4f46e5; color: white; padding: 12px; text-align: left; }
          .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .table tr:nth-child(even) { background: #f9fafb; }
          .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .badge-excelente { background: #dcfce7; color: #166534; }
          .badge-bueno { background: #dbeafe; color: #1e40af; }
          .badge-regular { background: #fef3c7; color: #92400e; }
          .badge-riesgo { background: #fee2e2; color: #991b1b; }
          .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte de Notas</h1>
          <p><strong>Clase:</strong> ${claseSeleccionada.nombre}</p>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>📈 Promedio General</h3>
            <p style="font-size: 24px; font-weight: bold; color: #4f46e5; margin: 10px 0;">${promedioGeneral()}/5.0</p>
          </div>
          <div class="stat-card">
            <h3>👥 Total Estudiantes</h3>
            <p style="font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0;">${estudiantes.length}</p>
          </div>
          <div class="stat-card">
            <h3>⚠️ En Riesgo</h3>
            <p style="font-size: 24px; font-weight: bold; color: #dc2626; margin: 10px 0;">${estudiantesEnRiesgo.length}</p>
          </div>
          <div class="stat-card">
            <h3>📅 Período</h3>
            <p style="font-size: 18px; font-weight: bold; color: #7c3aed; margin: 10px 0;">${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Notas Diarias</th>
              <th>Apreciación</th>
              <th>Examen</th>
              <th>Promedio Final</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
    `;

    estudiantes.forEach(estudiante => {
      const promedio = parseFloat(calcularPromedioFinal(estudiante));
      let estadoClass = '';
      let estadoText = '';
      
      if (promedio >= 4.5) {
        estadoClass = 'badge-excelente';
        estadoText = 'Excelente';
      } else if (promedio >= 3.5) {
        estadoClass = 'badge-bueno';
        estadoText = 'Bueno';
      } else if (promedio >= 3.0) {
        estadoClass = 'badge-regular';
        estadoText = 'Regular';
      } else if (promedio > 0) {
        estadoClass = 'badge-riesgo';
        estadoText = 'En Riesgo';
      } else {
        estadoClass = 'badge-riesgo';
        estadoText = 'Sin Notas';
      }

      contenido += `
        <tr>
          <td><strong>${estudiante.nombre}</strong></td>
          <td>${calcularTotalSeccion(estudiante.notasDiarias)}</td>
          <td>${calcularTotalSeccion(estudiante.apreciacion)}</td>
          <td>${calcularTotalSeccion(estudiante.examen)}</td>
          <td><strong>${calcularPromedioFinal(estudiante)}</strong></td>
          <td><span class="badge ${estadoClass}">${estadoText}</span></td>
        </tr>
      `;
    });

    contenido += `
          </tbody>
        </table>

        ${estudiantesEnRiesgo.length > 0 ? `
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">⚠️ Estudiantes que Requieren Atención</h3>
          <ul>
            ${estudiantesEnRiesgo.map(e => `<li><strong>${e.nombre}</strong> - Promedio: ${calcularPromedioFinal(e)}/5.0</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generado con Bringo Edu - Asistente Inteligente para Profesores</p>
          <p>${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </body>
      </html>
    `;

    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  const generarReporteAsistenciaPDF = () => {
    if (!claseSeleccionada) return;

    // Calcular estadísticas de asistencia
    const totalDias = Object.keys(estudiantes[0]?.asistencia || {}).length;
    const estadisticasAsistencia = estudiantes.map(estudiante => {
      const asist = contarAsistencias(estudiante);
      const totalRegistros = asist.presente + asist.ausente + asist.tardanza;
      const porcentajeAsistencia = totalRegistros > 0 ? Math.round((asist.presente / totalRegistros) * 100) : 0;
      
      return {
        nombre: estudiante.nombre,
        ...asist,
        porcentajeAsistencia,
        totalRegistros
      };
    });

    let contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Asistencia - ${claseSeleccionada.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #059669; margin: 0; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #bbf7d0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #059669; color: white; padding: 12px; text-align: left; }
          .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .presente { color: #059669; font-weight: bold; }
          .tardanza { color: #d97706; font-weight: bold; }
          .ausente { color: #dc2626; font-weight: bold; }
          .progress-bar { background: #e5e7eb; border-radius: 10px; height: 10px; margin: 5px 0; }
          .progress-fill { background: #059669; height: 100%; border-radius: 10px; }
          .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Reporte de Asistencia</h1>
          <p><strong>Clase:</strong> ${claseSeleccionada.nombre}</p>
          <p><strong>Período:</strong> ${totalDias} días registrados</p>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>✅ Presente</h3>
            <p style="font-size: 24px; font-weight: bold; color: #059669;">
              ${estadisticasAsistencia.reduce((sum, e) => sum + e.presente, 0)}
            </p>
          </div>
          <div class="stat-card">
            <h3>⏰ Tardanza</h3>
            <p style="font-size: 24px; font-weight: bold; color: #d97706;">
              ${estadisticasAsistencia.reduce((sum, e) => sum + e.tardanza, 0)}
            </p>
          </div>
          <div class="stat-card">
            <h3>❌ Ausente</h3>
            <p style="font-size: 24px; font-weight: bold; color: #dc2626;">
              ${estadisticasAsistencia.reduce((sum, e) => sum + e.ausente, 0)}
            </p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Presente</th>
              <th>Tardanza</th>
              <th>Ausente</th>
              <th>Total Registros</th>
              <th>% Asistencia</th>
            </tr>
          </thead>
          <tbody>
    `;

    estadisticasAsistencia.forEach(estadistica => {
      contenido += `
        <tr>
          <td><strong>${estadistica.nombre}</strong></td>
          <td class="presente">${estadistica.presente}</td>
          <td class="tardanza">${estadistica.tardanza}</td>
          <td class="ausente">${estadistica.ausente}</td>
          <td>${estadistica.totalRegistros}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>${estadistica.porcentajeAsistencia}%</span>
              <div class="progress-bar" style="flex: 1;">
                <div class="progress-fill" style="width: ${estadistica.porcentajeAsistencia}%"></div>
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    contenido += `
          </tbody>
        </table>

        <div class="footer">
          <p>Generado con Bringo Edu - Asistente Inteligente para Profesores</p>
          <p>${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </body>
      </html>
    `;

    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  const generarReporteProgresoPDF = () => {
    if (!claseSeleccionada) return;

    const distribucion = {
      excelente: 0, bueno: 0, regular: 0, riesgo: 0
    };

    estudiantes.forEach(estudiante => {
      const promedio = parseFloat(calcularPromedioFinal(estudiante));
      if (promedio >= 4.5) distribucion.excelente++;
      else if (promedio >= 3.5) distribucion.bueno++;
      else if (promedio >= 3.0) distribucion.regular++;
      else if (promedio > 0) distribucion.riesgo++;
    });

    const topEstudiantes = obtenerRankingEstudiantes();

    let contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Dashboard de Progreso - ${claseSeleccionada.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #7c3aed; margin: 0; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { padding: 20px; border-radius: 8px; color: white; text-align: center; }
          .stat-card h3 { margin: 0 0 10px 0; font-size: 14px; opacity: 0.9; }
          .stat-card p { margin: 0; font-size: 24px; font-weight: bold; }
          .distribution { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .distribution-item { display: flex; justify-content: between; align-items: center; margin: 10px 0; }
          .distribution-bar { flex: 1; background: #e5e7eb; border-radius: 10px; height: 12px; margin: 0 15px; overflow: hidden; }
          .distribution-fill { height: 100%; border-radius: 10px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #7c3aed; color: white; padding: 12px; text-align: left; }
          .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .ranking-badge { display: inline-block; width: 24px; height: 24px; border-radius: 50%; color: white; text-align: center; line-height: 24px; font-weight: bold; margin-right: 10px; }
          .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📈 Dashboard de Progreso</h1>
          <p><strong>Clase:</strong> ${claseSeleccionada.nombre}</p>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
            <h3>📊 Promedio General</h3>
            <p>${promedioGeneral()}/5.0</p>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #10b981, #047857);">
            <h3>👥 Total Estudiantes</h3>
            <p>${estudiantes.length}</p>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
            <h3>⚠️ En Riesgo</h3>
            <p>${estudiantesEnRiesgo.length}</p>
          </div>
          <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
            <h3>🏆 Mejor Promedio</h3>
            <p>${topEstudiantes[0] ? topEstudiantes[0].promedio.toFixed(1) : 0}/5.0</p>
          </div>
        </div>

        <div class="distribution">
          <h3 style="margin-top: 0;">Distribución de Rendimiento</h3>
          <div class="distribution-item">
            <span style="color: #059669; font-weight: bold;">Excelente (4.5-5.0)</span>
            <div class="distribution-bar">
              <div class="distribution-fill" style="width: ${(distribucion.excelente/estudiantes.length)*100}%; background: #059669;"></div>
            </div>
            <span>${distribucion.excelente} (${Math.round((distribucion.excelente/estudiantes.length)*100)}%)</span>
          </div>
          <div class="distribution-item">
            <span style="color: #3b82f6; font-weight: bold;">Bueno (3.5-4.4)</span>
            <div class="distribution-bar">
              <div class="distribution-fill" style="width: ${(distribucion.bueno/estudiantes.length)*100}%; background: #3b82f6;"></div>
            </div>
            <span>${distribucion.bueno} (${Math.round((distribucion.bueno/estudiantes.length)*100)}%)</span>
          </div>
          <div class="distribution-item">
            <span style="color: #f59e0b; font-weight: bold;">Regular (3.0-3.4)</span>
            <div class="distribution-bar">
              <div class="distribution-fill" style="width: ${(distribucion.regular/estudiantes.length)*100}%; background: #f59e0b;"></div>
            </div>
            <span>${distribucion.regular} (${Math.round((distribucion.regular/estudiantes.length)*100)}%)</span>
          </div>
          <div class="distribution-item">
            <span style="color: #dc2626; font-weight: bold;">En Riesgo (0-2.9)</span>
            <div class="distribution-bar">
              <div class="distribution-fill" style="width: ${(distribucion.riesgo/estudiantes.length)*100}%; background: #dc2626;"></div>
            </div>
            <span>${distribucion.riesgo} (${Math.round((distribucion.riesgo/estudiantes.length)*100)}%)</span>
          </div>
        </div>

        <h3>🏆 Ranking de Estudiantes</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Posición</th>
              <th>Estudiante</th>
              <th>Promedio</th>
              <th>Total Notas</th>
            </tr>
          </thead>
          <tbody>
    `;

    topEstudiantes.forEach((estudiante, index) => {
      const totalNotas = estudiante.notasDiarias.length + estudiante.apreciacion.length + estudiante.examen.length;
      const badgeColor = index === 0 ? '#f59e0b' : index === 1 ? '#6b7280' : index === 2 ? '#d97706' : '#8b5cf6';
      
      contenido += `
        <tr>
          <td>
            <span class="ranking-badge" style="background: ${badgeColor};">${index + 1}</span>
          </td>
          <td><strong>${estudiante.nombre}</strong></td>
          <td><strong style="color: ${badgeColor};">${estudiante.promedio.toFixed(1)}/5.0</strong></td>
          <td>${totalNotas} notas</td>
        </tr>
      `;
    });

    contenido += `
          </tbody>
        </table>

        ${estudiantesEnRiesgo.length > 0 ? `
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">📋 Estudiantes que Requieren Atención Especial</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            ${estudiantesEnRiesgo.map(estudiante => {
              const asistencia = contarAsistencias(estudiante);
              return `
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #fecaca;">
                  <strong style="color: #dc2626;">${estudiante.nombre}</strong>
                  <div style="font-size: 14px; margin-top: 5px;">
                    <div>Promedio: ${calcularPromedioFinal(estudiante)}/5.0</div>
                    <div>Asistencia: ${asistencia.presente}P ${asistencia.tardanza}T ${asistencia.ausente}A</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generado con Bringo Edu - Asistente Inteligente para Profesores</p>
          <p>${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </body>
      </html>
    `;

    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <ModalLogin
        mostrarLogin={mostrarLogin}
        setMostrarLogin={setMostrarLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        errorAuth={errorAuth}
        cargandoAuth={cargandoAuth}
        iniciarSesion={iniciarSesion}
        limpiarFormulariosAuth={limpiarFormulariosAuth}
        setMostrarRegistro={setMostrarRegistro}
      />

      <ModalRegistro
        mostrarRegistro={mostrarRegistro}
        setMostrarRegistro={setMostrarRegistro}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        nombreUsuario={nombreUsuario}
        setNombreUsuario={setNombreUsuario}
        confirmarPassword={confirmarPassword}
        setConfirmarPassword={setConfirmarPassword}
        errorAuth={errorAuth}
        cargandoAuth={cargandoAuth}
        registrarUsuario={registrarUsuario}
        limpiarFormulariosAuth={limpiarFormulariosAuth}
        setMostrarLogin={setMostrarLogin}
      />

      {/* HEADER MEJORADO CON RESPONSIVE */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📚</span>
            <div>
              <h1 className="text-2xl font-bold">Bringo Edu</h1>
              <p className="text-sm text-purple-100">Asistente Inteligente para Profesores</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {usuario ? (
              <>
                <div className="text-right mr-4 hidden md:block">
                  <p className="font-semibold text-sm">👋 Hola, {usuario.nombre}</p>
                  <p className="text-xs text-purple-200">{usuario.email}</p>
                </div>
                <button
                  onClick={cerrarSesion}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMostrarLogin(true)}
                  className="flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg transition font-semibold"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </button>
                <button
                  onClick={() => setMostrarRegistro(true)}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition font-semibold"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Registrarse</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* NAVEGACIÓN MEJORADA */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            <button
              onClick={() => setView('home')}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                view === 'home' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-sm md:text-base">Inicio</span>
            </button>
            
            {usuario && claseSeleccionada && (
              <>
                <button
                  onClick={() => setView('clase')}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    view === 'clase' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-sm md:text-base">Estudiantes</span>
                </button>
                <button
                  onClick={() => setView('asistencia')}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    view === 'asistencia' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm md:text-base">Asistencia</span>
                </button>
                <button
                  onClick={() => setView('notas')}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    view === 'notas' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ClipboardList className="w-5 h-5" />
                  <span className="text-sm md:text-base">Notas</span>
                </button>
                <button
                  onClick={() => setView('progreso')}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    view === 'progreso' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm md:text-base">Progreso</span>
                </button>
              </>
            )}
            
            <button
              onClick={() => setView('planificacion')}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                view === 'planificacion' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm md:text-base">Plan IA</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {view === 'home' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="text-4xl">🏫</span>
                Mis Clases
              </h2>
              
              {!usuario && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-yellow-900 mb-2">Inicia sesión para acceder</h3>
                      <p className="text-yellow-800 mb-4">
                        Crea una cuenta o inicia sesión para gestionar tus clases, estudiantes y generar planes de estudio con IA.
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => setMostrarLogin(true)}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
                        >
                          Iniciar Sesión
                        </button>
                        <button
                          onClick={() => setMostrarRegistro(true)}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                        >
                          Registrarse
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {usuario && (
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Crear Nueva Clase</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Materia (ej: Matemáticas)"
                      value={nombreClase}
                      onChange={(e) => setNombreClase(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Grado (ej: 5to)"
                      value={grado}
                      onChange={(e) => setGrado(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Sección (ej: A)"
                      value={seccion}
                      onChange={(e) => setSeccion(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={agregarClase}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Crear
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clases.length === 0 && usuario && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <p className="text-lg">No tienes clases creadas aún</p>
                    <p className="text-sm mt-2">Crea tu primera clase usando el formulario arriba</p>
                  </div>
                )}
                
                {clases.map(clase => (
                  <div
                    key={clase.id}
                    className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
                    onClick={() => seleccionarClase(clase)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{clase.nombre}</h3>
                        <p className="text-purple-100">{clase.estudiantes?.length || 0} estudiantes</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarClase(clase.id);
                        }}
                        className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-400">
                      <p className="text-sm text-purple-100">Click para gestionar</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'clase' && claseSeleccionada && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                {claseSeleccionada.nombre}
              </h2>
              <button
                onClick={() => {
                  setClaseSeleccionada(null);
                  setView('home');
                }}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition font-semibold"
              >
                Volver
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Agregar Estudiante</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Nombre completo del estudiante"
                  value={nombreEstudiante}
                  onChange={(e) => setNombreEstudiante(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarEstudiante()}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={agregarEstudiante}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {estudiantes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No hay estudiantes en esta clase</p>
                  <p className="text-sm mt-2">Agrega tu primer estudiante usando el formulario arriba</p>
                </div>
              )}
              
              {estudiantes.map(estudiante => (
                <div key={estudiante.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                        {estudiante.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">{estudiante.nombre}</h4>
                        <p className="text-sm text-gray-600">
                          Promedio: {calcularPromedioFinal(estudiante)}/5
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar a ${estudiante.nombre}?`)) {
                          eliminarEstudiante(estudiante.id);
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition mt-4 md:mt-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'asistencia' && claseSeleccionada && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                Asistencia - {claseSeleccionada.nombre}
              </h2>
              <div className="flex gap-4">
                <input
                  type="date"
                  value={fechaActual}
                  onChange={(e) => setFechaActual(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={generarReporteAsistenciaPDF}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition font-bold flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Descargar
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {estudiantes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No hay estudiantes en esta clase</p>
                </div>
              )}
              
              {estudiantes.map(estudiante => {
                const asist = contarAsistencias(estudiante);
                const estadoHoy = estudiante.asistencia?.[fechaActual];
                
                return (
                  <div key={estudiante.id} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 mb-2">{estudiante.nombre}</h4>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600 font-semibold">✓ {asist.presente}P</span>
                          <span className="text-yellow-600 font-semibold">⏰ {asist.tardanza}T</span>
                          <span className="text-red-600 font-semibold">✗ {asist.ausente}A</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap mt-4 md:mt-0">
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'presente')}
                          className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition text-sm md:text-base ${
                            estadoHoy === 'presente'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'tardanza')}
                          className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition text-sm md:text-base ${
                            estadoHoy === 'tardanza'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          Tardanza
                        </button>
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'ausente')}
                          className={`px-4 md:px-6 py-3 rounded-lg font-semibold transition text-sm md:text-base ${
                            estadoHoy === 'ausente'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          Ausente
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'notas' && claseSeleccionada && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-purple-600" />
                Notas - {claseSeleccionada.nombre}
              </h2>
              <div className="flex gap-4 flex-wrap">
                <div className="bg-purple-100 px-4 md:px-6 py-3 rounded-lg">
                  <span className="text-xs md:text-sm text-purple-600 font-semibold">Promedio:</span>
                  <span className="ml-2 text-xl md:text-2xl font-bold text-purple-800">{promedioGeneral()}/5</span>
                </div>
                <button
                  onClick={generarReporteNotasPDF}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold flex items-center gap-2 text-sm md:text-base"
                >
                  <Download className="w-5 h-5" />
                  Descargar
                </button>
              </div>
            </div>
            
            {estudiantesEnRiesgo.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-2">⚠️ Estudiantes en Riesgo ({estudiantesEnRiesgo.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {estudiantesEnRiesgo.map(e => (
                        <span key={e.id} className="bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm font-semibold">
                          {e.nombre}: {calcularPromedioFinal(e)}/5
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {estudiantes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No hay estudiantes en esta clase</p>
              </div>
            )}
            
            <div className="space-y-6">
              {estudiantes.map(estudiante => (
                <div key={estudiante.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => toggleExpansion(estudiante.id)}
                    className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 cursor-pointer hover:from-purple-200 hover:to-blue-200 transition"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {estudiante.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-800">{estudiante.nombre}</h4>
                          <div className="flex flex-wrap gap-2 md:gap-4 mt-1 text-xs md:text-sm">
                            <span>Diarias: {calcularTotalSeccion(estudiante.notasDiarias)}</span>
                            <span>Apreciación: {calcularTotalSeccion(estudiante.apreciacion)}</span>
                            <span>Examen: {calcularTotalSeccion(estudiante.examen)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="text-right">
                          <p className="text-xs md:text-sm text-gray-600">Promedio</p>
                          <p className={`text-2xl md:text-3xl font-bold ${
                            parseFloat(calcularPromedioFinal(estudiante)) >= 3.5 ? 'text-green-600' :
                            parseFloat(calcularPromedioFinal(estudiante)) >= 3.0 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {calcularPromedioFinal(estudiante)}/5
                          </p>
                        </div>
                        {expandido[estudiante.id] ? (
                          <ChevronUp className="w-6 h-6 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandido[estudiante.id] && (
                    <div className="p-6 space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-bold text-lg text-gray-800">📝 Notas Diarias</h5>
                          <button
                            onClick={() => agregarNota(estudiante.id, 'notasDiarias')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {estudiante.notasDiarias.map((nota, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg flex gap-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                placeholder="Nota"
                                value={nota.valor || ''}
                                onChange={(e) => actualizarNota(estudiante.id, 'notasDiarias', idx, 'valor', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                              />
                              <input
                                type="date"
                                value={nota.fecha || ''}
                                onChange={(e) => actualizarNota(estudiante.id, 'notasDiarias', idx, 'fecha', e.target.value)}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => eliminarNota(estudiante.id, 'notasDiarias', idx)}
                                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-600">Promedio: </span>
                          <span className="font-bold text-lg text-blue-600">{calcularTotalSeccion(estudiante.notasDiarias)}/5</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-bold text-lg text-gray-800">⭐ Apreciación</h5>
                          <button
                            onClick={() => agregarNota(estudiante.id, 'apreciacion')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {estudiante.apreciacion.map((nota, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg flex gap-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                placeholder="Nota"
                                value={nota.valor || ''}
                                onChange={(e) => actualizarNota(estudiante.id, 'apreciacion', idx, 'valor', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                              />
                              <input
                                type="date"
                                value={nota.fecha || ''}
                                onChange={(e) => actualizarNota(estudiante.id, 'apreciacion', idx, 'fecha', e.target.value)}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                              />
                              <button
                                onClick={() => eliminarNota(estudiante.id, 'apreciacion', idx)}
                                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-600">Promedio: </span>
                          <span className="font-bold text-lg text-green-600">{calcularTotalSeccion(estudiante.apreciacion)}/5</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-bold text-lg text-gray-800">📋 Examen</h5>
                          <button
                            onClick={() => agregarNota(estudiante.id, 'examen')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-semibold flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {estudiante.examen.map((nota, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg flex gap-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                placeholder="Nota"
                                value={nota.valor || ''}
                                onChange={(e) => actualizarNota(estudiante.id, 'examen', idx, 'valor', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                              />
                              <input
                                type="date"
                                value={nota.fecha || ''}
                                onChange={(e) => actualizarNota(estudiante.id, 'examen', idx, 'fecha', e.target.value)}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={() => eliminarNota(estudiante.id, 'examen', idx)}
                                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-600">Promedio: </span>
                          <span className="font-bold text-lg text-purple-600">{calcularTotalSeccion(estudiante.examen)}/5</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA DE PROGRESO CORREGIDA */}
        {view === 'progreso' && claseSeleccionada && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                Dashboard de Progreso - {claseSeleccionada.nombre}
              </h2>
              <button
                onClick={generarReporteProgresoPDF}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Descargar Dashboard
              </button>
            </div>

            {/* ESTADÍSTICAS GENERALES */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm opacity-90">Promedio General</p>
                <p className="text-3xl font-bold">{promedioGeneral()}/5</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm opacity-90">Total Estudiantes</p>
                <p className="text-3xl font-bold">{estudiantes.length}</p>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm opacity-90">En Riesgo</p>
                <p className="text-3xl font-bold">{estudiantesEnRiesgo.length}</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 text-center">
                <Award className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm opacity-90">Mejor Promedio</p>
                <p className="text-3xl font-bold">
                  {estudiantes.length > 0 ? Math.max(...estudiantes.map(e => parseFloat(calcularPromedioFinal(e)))).toFixed(1) : 0}/5
                </p>
              </div>
            </div>

            {/* GRÁFICO DE DISTRIBUCIÓN Y RANKING - CORREGIDO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  Distribución de Rendimiento
                </h3>
                <DistribucionNotas 
                  estudiantes={estudiantes} 
                  calcularPromedioFinal={calcularPromedioFinal} 
                />
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-600" />
                  Ranking de Estudiantes
                </h3>
                <div className="space-y-3">
                  {obtenerRankingEstudiantes().map((estudiante, index) => (
                    <div key={estudiante.id} className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{estudiante.nombre}</p>
                          <p className="text-sm text-gray-600">
                            {estudiante.notasDiarias.length + estudiante.apreciacion.length + estudiante.examen.length} notas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          estudiante.promedio >= 4.5 ? 'text-green-600' :
                          estudiante.promedio >= 3.5 ? 'text-blue-600' :
                          estudiante.promedio >= 3.0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {estudiante.promedio.toFixed(1)}/5
                        </p>
                      </div>
                    </div>
                  ))}
                  {obtenerRankingEstudiantes().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay datos suficientes para ranking</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ALERTAS DE BAJO RENDIMIENTO */}
            {estudiantesEnRiesgo.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Alertas de Bajo Rendimiento ({estudiantesEnRiesgo.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {estudiantesEnRiesgo.map(estudiante => {
                    const asistencia = contarAsistencias(estudiante);
                    return (
                      <div key={estudiante.id} className="bg-white rounded-lg p-4 border-2 border-red-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                            {estudiante.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-red-800">{estudiante.nombre}</p>
                            <p className="text-sm text-red-600">Promedio: {calcularPromedioFinal(estudiante)}/5</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Asistencia: {asistencia.presente}P {asistencia.tardanza}T {asistencia.ausente}A</p>
                          <p>Total notas: {estudiante.notasDiarias.length + estudiante.apreciacion.length + estudiante.examen.length}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MÉTRICAS CONSOLIDADAS POR ESTUDIANTE */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Métricas por Estudiante
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-purple-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Estudiante</th>
                      <th className="px-4 py-3 text-center">Promedio</th>
                      <th className="px-4 py-3 text-center">Notas Diarias</th>
                      <th className="px-4 py-3 text-center">Apreciación</th>
                      <th className="px-4 py-3 text-center">Examen</th>
                      <th className="px-4 py-3 text-center">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map(estudiante => {
                      const asistencia = contarAsistencias(estudiante);
                      const totalAsistencias = asistencia.presente + asistencia.tardanza + asistencia.ausente;
                      const porcentajeAsistencia = totalAsistencias > 0 ? Math.round((asistencia.presente / totalAsistencias) * 100) : 0;
                      
                      return (
                        <tr key={estudiante.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{estudiante.nombre}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${
                              parseFloat(calcularPromedioFinal(estudiante)) >= 4.5 ? 'text-green-600' :
                              parseFloat(calcularPromedioFinal(estudiante)) >= 3.5 ? 'text-blue-600' :
                              parseFloat(calcularPromedioFinal(estudiante)) >= 3.0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {calcularPromedioFinal(estudiante)}/5
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {calcularTotalSeccion(estudiante.notasDiarias)} ({estudiante.notasDiarias.length})
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {calcularTotalSeccion(estudiante.apreciacion)} ({estudiante.apreciacion.length})
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {calcularTotalSeccion(estudiante.examen)} ({estudiante.examen.length})
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${
                              porcentajeAsistencia >= 90 ? 'text-green-600' :
                              porcentajeAsistencia >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {porcentajeAsistencia}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {estudiantes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay estudiantes en esta clase</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'planificacion' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              Generador de Planes Trimestrales con IA
            </h2>
            
            {!planGenerado ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-purple-900 text-lg mb-2">✨ Planes Trimestrales con IA</h3>
                      <p className="text-purple-800 text-sm">
                        Genera planes trimestrales completos alineados con el currículo del MEDUCA de Panamá. 
                        Nuestra IA crea contenido detallado con contenidos, competencias, metodologías y evaluaciones 
                        específicas para cada trimestre.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Información del Plan Trimestral</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre del Profesor"
                      value={nombreProfesor}
                      onChange={(e) => setNombreProfesor(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Institución Educativa"
                      value={institucion}
                      onChange={(e) => setInstitucion(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Grado (ej: 5to)"
                      value={gradoPlan}
                      onChange={(e) => setGradoPlan(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Materia (ej: Matemáticas)"
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <select
                      value={trimestre}
                      onChange={(e) => setTrimestre(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="Primer Trimestre">Primer Trimestre</option>
                      <option value="Segundo Trimestre">Segundo Trimestre</option>
                      <option value="Tercer Trimestre">Tercer Trimestre</option>
                    </select>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-2">
                        💡 Selecciona el trimestre para el cual deseas generar el plan de estudios completo.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={generarPlanConOpenAI}
                    disabled={generandoPlan || !nombreProfesor || !institucion || !gradoPlan || !materia || !trimestre}
                    className={`w-full mt-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition ${
                      generandoPlan || !nombreProfesor || !institucion || !gradoPlan || !materia || !trimestre
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {generandoPlan ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Generando Plan Trimestral...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Generar Plan Trimestral con IA
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Plan {planGenerado.trimestre}</h3>
                    <p className="text-gray-600 mt-1">
                      {planGenerado.asignatura || planGenerado.materia || materia} - {planGenerado.grado || gradoPlan} | {planGenerado.institucion || institucion}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Profesor: {planGenerado.docente || planGenerado.profesor || nombreProfesor}</p>
                    <p className="text-sm text-gray-500">Trimestre: {planGenerado.trimestre} | Fecha: {planGenerado.fecha}</p>
                    {planGenerado.duracionSemanas && (
                      <p className="text-sm text-gray-500">Duración: {planGenerado.duracionSemanas} semanas</p>
                    )}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={descargarPlan}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Descargar Plan
                    </button>
                    <button
                      onClick={() => setPlanGenerado(null)}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-bold"
                    >
                      Nuevo Plan
                    </button>
                  </div>
                </div>
                
                {/* SECCIÓN ACTUALIZADA CON VERIFICACIONES DE SEGURIDAD */}
                {planGenerado.contenidos && Array.isArray(planGenerado.contenidos) && planGenerado.contenidos.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                      📚 Contenidos del {planGenerado.trimestre}
                    </h4>
                    <ul className="space-y-2">
                      {planGenerado.contenidos.map((cont, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-blue-600 font-bold">{i + 1}.</span>
                          <span className="text-gray-800">{cont}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {planGenerado.competencias && Array.isArray(planGenerado.competencias) && planGenerado.competencias.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                      💪 Competencias a Desarrollar
                    </h4>
                    <ul className="space-y-2">
                      {planGenerado.competencias.map((comp, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-purple-600">{i + 1}.</span>
                          <span className="text-gray-800">{comp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {planGenerado.indicadoresLogro && Array.isArray(planGenerado.indicadoresLogro) && planGenerado.indicadoresLogro.length > 0 && (
                  <div className="bg-teal-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-teal-900 mb-4 flex items-center gap-2">
                      ✅ Indicadores de Logro
                    </h4>
                    <ul className="space-y-2">
                      {planGenerado.indicadoresLogro.map((ind, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-teal-600">•</span>
                          <span className="text-gray-800">{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {planGenerado.metodologia && (
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                      📖 Estrategias Metodológicas
                    </h4>
                    <p className="text-gray-800">{planGenerado.metodologia}</p>
                  </div>
                )}
                
                {planGenerado.recursos && Array.isArray(planGenerado.recursos) && planGenerado.recursos.length > 0 && (
                  <div className="bg-indigo-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      🛠️ Recursos Educativos
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {planGenerado.recursos.map((rec, i) => (
                        <li key={i} className="flex gap-2 items-center">
                          <span className="text-indigo-600">•</span>
                          <span className="text-gray-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {planGenerado.evaluacion && Array.isArray(planGenerado.evaluacion) && planGenerado.evaluacion.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                      📊 Instrumentos de Evaluación
                    </h4>
                    <ul className="space-y-2">
                      {planGenerado.evaluacion.map((evalItem, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-red-600">•</span>
                          <span className="text-gray-800">{evalItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {planGenerado.adaptaciones && Array.isArray(planGenerado.adaptaciones) && planGenerado.adaptaciones.length > 0 && (
                  <div className="bg-orange-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                      ♿ Adaptaciones Curriculares
                    </h4>
                    <ul className="space-y-2">
                      {planGenerado.adaptaciones.map((adap, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-orange-600">•</span>
                          <span className="text-gray-800">{adap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {planGenerado.observaciones && (
                  <div className="bg-gray-100 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      📝 Observaciones
                    </h4>
                    <p className="text-gray-800">{planGenerado.observaciones}</p>
                  </div>
                )}

                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 text-center">
                  <p className="text-purple-800 font-semibold">
                    ✅ Plan trimestral generado exitosamente con IA
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Puedes descargar este plan en formato de texto para guardarlo o imprimirlo.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2025 Bringo Edu - Asistente Inteligente para Profesores
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Desarrollado por GermanApp | Potenciado por IA
          </p>
        </div>
      </footer>
    </div>
  );
}