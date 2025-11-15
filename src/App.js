import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, AlertCircle, Users, Home, ChevronDown, ChevronUp, ClipboardList, Calendar, Sparkles, User, LogOut, LogIn, TrendingUp, BarChart3, Target, Award, AlertTriangle, Search, Share, Eye, EyeOff, PieChart, UserX, Activity } from 'lucide-react';
import { usePremium } from "./hooks/usePremium";
import { 
  BannerUpgrade, 
  ModalSuscripcion, 
  NavegacionPremium, 
  AlertaLimiteClases 
} from "./components/premium";
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';

// Importar librerías REALES de exportación
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, AlignmentType } from 'docx';

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
const analytics = getAnalytics(app);

// === SISTEMA DE ANALYTICS - NUEVO ===
const useAnalytics = () => {
  const prevViewRef = React.useRef('');

  const trackPageView = (screenName, additionalParams = {}) => {
    if (screenName && screenName !== prevViewRef.current) {
      logEvent(analytics, 'screen_view', {
        screen_name: screenName,
        app_name: 'Bringo Edu',
        ...additionalParams
      });
      prevViewRef.current = screenName;
    }
  };

  const trackEvent = (eventName, parameters = {}) => {
    console.log(`📊 Analytics Event: ${eventName}`, parameters);
    logEvent(analytics, eventName, {
      app_name: 'Bringo Edu',
      timestamp: new Date().toISOString(),
      ...parameters
    });
  };

  const setUserAnalytics = (user) => {
    if (user) {
      setUserId(analytics, user.uid);
      setUserProperties(analytics, {
        user_type: 'teacher',
        sign_up_method: 'email',
        has_premium: 'false'
      });
    } else {
      setUserId(analytics, null);
    }
  };

  return {
    trackPageView,
    trackEvent,
    setUserAnalytics
  };
};
// === FIN SISTEMA ANALYTICS ===

// FUNCIÓN PARA DETECTAR TRIMESTRE AUTOMÁTICAMENTE
const detectarTrimestre = () => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  
  // Calendario escolar de Panamá (ajustable)
  const trimestres = [
    { 
      nombre: 'Primer Trimestre', 
      inicio: new Date(año, 2, 1), // 1 de Marzo
      fin: new Date(año, 4, 31)    // 31 de Mayo
    },
    { 
      nombre: 'Segundo Trimestre', 
      inicio: new Date(año, 5, 1),  // 1 de Junio
      fin: new Date(año, 7, 31)     // 31 de Agosto
    },
    { 
      nombre: 'Tercer Trimestre', 
      inicio: new Date(año, 8, 1),  // 1 de Septiembre
      fin: new Date(año, 10, 30)    // 30 de Noviembre
    }
  ];

  const trimestreActual = trimestres.find(t => 
    hoy >= t.inicio && hoy <= t.fin
  );

  return trimestreActual ? trimestreActual.nombre : 'Vacaciones';
};

// FUNCIÓN PARA VERIFICAR SI ES DÍA HÁBIL (NO FINES DE SEMANA NI FERIADOS)
const esDiaHabil = (fecha = new Date()) => {
  const diaSemana = fecha.getDay();
  // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) {
    return false;
  }

  // Feriados oficiales de Panamá (puedes agregar más según sea necesario)
  const feriados = [
    '01-01', // Año Nuevo
    '01-09', // Día de los Mártires
    '03-01', // Carnaval
    '03-02', // Carnaval
    '05-01', // Día del Trabajo
    '11-03', // Independencia de Panamá
    '11-04', // Día de la Bandera
    '11-05', // Colón
    '11-10', // Primer Grito de Independencia
    '12-08', // Día de la Madre
    '12-25', // Navidad
  ];

  const mesDia = `${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  return !feriados.includes(mesDia);
};

// Componente para gráfico de distribución
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

// Componente para Fila de Calificaciones Rápidas CORREGIDO
const FilaCalificacionesRapidas = ({ estudiante, onAgregarCalificacion, calcularPromedioFinal, claseSeleccionada, usuario, actualizarCalificacion, tituloEvaluacion, trackEvent }) => {
  const [calificacionDiaria, setCalificacionDiaria] = useState('');
  const [calificacionApreciacion, setCalificacionApreciacion] = useState('');
  const [calificacionExamen, setCalificacionExamen] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const handleAgregarCalificacion = async (tipo, valor) => {
    if (valor && parseFloat(valor) >= 0 && parseFloat(valor) <= 5) {
      try {
        await onAgregarCalificacion(estudiante.id, tipo, parseFloat(valor), fecha, tituloEvaluacion);
        
        // Track del evento de calificación
        trackEvent('calificacion_agregada', {
          tipo_calificacion: tipo,
          valor: parseFloat(valor),
          estudiante: estudiante.nombre,
          clase: claseSeleccionada?.nombre,
          titulo_evaluacion: tituloEvaluacion
        });

        // Limpiar el campo
        if (tipo === 'calificacionesDiarias') setCalificacionDiaria('');
        if (tipo === 'apreciacion') setCalificacionApreciacion('');
        if (tipo === 'examen') setCalificacionExamen('');

      } catch (error) {
        console.error('Error agregando calificación:', error);
        alert('Error al agregar la calificación');
      }
    } else {
      alert('Por favor ingresa una calificación válida entre 0 y 5');
    }
  };

  const compartirPorWhatsApp = () => {
    const formatoCalificaciones = (calificaciones) => {
      return calificaciones
        .filter(n => n.valor && parseFloat(n.valor) > 0)
        .map(n => `📅 ${n.fecha}: ${n.valor}/5.0${n.titulo ? ` - ${n.titulo}` : ''}`)
        .join('\n') || '📭 Sin calificaciones registradas';
    };

    const mensaje = `📊 REPORTE DE CALIFICACIONES - ${claseSeleccionada?.nombre}

*Estudiante:* ${estudiante.nombre}
*Profesor:* ${usuario?.nombre}
*Institución:* ${claseSeleccionada?.institucion || 'Bringo Edu'}
*Fecha de reporte:* ${new Date().toLocaleDateString('es-PA')}
*Trimestre:* ${detectarTrimestre()}

*📝 CALIFICACIONES DIARIAS:*
${formatoCalificaciones(estudiante.calificacionesDiarias || [])}

*⭐ APRECIACIÓN:*
${formatoCalificaciones(estudiante.apreciacion || [])}

*📋 EXAMEN:*
${formatoCalificaciones(estudiante.examen || [])}

*🏆 PROMEDIO FINAL:* ${calcularPromedioFinal(estudiante)}/5.0

---
Generado con Bringo Edu 📚 | Transparente y Confiable`;

    // Track del evento de compartir
    trackEvent('reporte_compartido', {
      plataforma: 'whatsapp',
      estudiante: estudiante.nombre,
      clase: claseSeleccionada?.nombre
    });

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3 font-semibold">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
            {estudiante.nombre.charAt(0).toUpperCase()}
          </div>
          <span>{estudiante.nombre}</span>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            placeholder="0-5"
            value={calificacionDiaria}
            onChange={(e) => setCalificacionDiaria(e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center"
          />
          <button
            onClick={() => handleAgregarCalificacion('calificacionesDiarias', calificacionDiaria)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
          >
            +
          </button>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            placeholder="0-5"
            value={calificacionApreciacion}
            onChange={(e) => setCalificacionApreciacion(e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-center"
          />
          <button
            onClick={() => handleAgregarCalificacion('apreciacion', calificacionApreciacion)}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold"
          >
            +
          </button>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            placeholder="0-5"
            value={calificacionExamen}
            onChange={(e) => setCalificacionExamen(e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center"
          />
          <button
            onClick={() => handleAgregarCalificacion('examen', calificacionExamen)}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
          >
            +
          </button>
        </div>
      </td>
      
      <td className="px-4 py-3 text-center">
        <span className={`text-xl font-bold ${
          parseFloat(calcularPromedioFinal(estudiante)) >= 4.5 ? 'text-green-600' :
          parseFloat(calcularPromedioFinal(estudiante)) >= 3.5 ? 'text-blue-600' :
          parseFloat(calcularPromedioFinal(estudiante)) >= 3.0 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {calcularPromedioFinal(estudiante)}
        </span>
      </td>
      
      <td className="px-4 py-3 text-center">
        <button
          onClick={compartirPorWhatsApp}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2 text-sm"
        >
          <Share className="w-4 h-4" />
          WhatsApp
        </button>
      </td>
    </tr>
  );
};

// Componente de Modal Login
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
  setMostrarRegistro,
  trackEvent 
}) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  if (!mostrarLogin) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent('login_intento', { email: email });
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
              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
              trackEvent('login_cancelado');
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
                trackEvent('registro_desde_login');
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

// Componente de Modal Registro
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
  setMostrarLogin,
  trackEvent 
}) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

  if (!mostrarRegistro) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent('registro_intento', { 
      email: email,
      nombre: nombreUsuario 
    });
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
              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">Usa letras, números y símbolos</p>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span className="text-green-600">✅</span> Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarConfirmarPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {mostrarConfirmarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
              trackEvent('registro_cancelado');
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
                trackEvent('login_desde_registro');
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

// NUEVO COMPONENTE: Modal de Confirmación para Retirar Estudiante
const ModalConfirmacionRetiro = ({ mostrar, onCerrar, onConfirmar, estudiante }) => {
  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-t-2xl text-center">
          <div className="inline-block bg-white rounded-full p-4 mb-4 shadow-lg">
            <UserX className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Retirar Estudiante</h3>
          <p className="text-orange-100">Confirmar retiro del estudiante</p>
        </div>
        
        <div className="p-6 text-center">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4">
            <div className="text-4xl mb-4">⚠️</div>
            <h4 className="text-xl font-bold text-orange-800 mb-2">¿Estás seguro?</h4>
            <p className="text-orange-700">
              Estás a punto de retirar al estudiante <strong>{estudiante?.nombre}</strong>.
            </p>
          </div>
          
          <p className="text-gray-600 mb-6">
            El estudiante será marcado como "Retirado" en el sistema. Esta acción no se puede deshacer.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold"
            >
              Sí, Retirar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Barra de Búsqueda de ESTUDIANTES MEJORADO con sugerencias - MOVIDA FUERA DEL CUADRO DE CLASES
const BarraBusquedaEstudiantes = ({ clases, onBuscarEstudiante, busquedaEstudiante, setBusquedaEstudiante, trackEvent }) => {
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Obtener todos los estudiantes de todas las clases
  const todosLosEstudiantes = clases.flatMap(clase => 
    (clase.estudiantes || []).map(estudiante => ({
      ...estudiante,
      claseNombre: clase.nombre,
      claseId: clase.id
    }))
  );

  // Normalizar texto para búsqueda (minúsculas, sin tildes, sin comas)
  const normalizarTexto = (texto) => {
    return texto
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // eliminar tildes
      .replace(/[.,]/g, ""); // eliminar comas y puntos
  };

  // Filtrar sugerencias en tiempo real
  useEffect(() => {
    if (busquedaEstudiante.length >= 2) {
      const textoBusqueda = normalizarTexto(busquedaEstudiante);
      const sugerenciasFiltradas = todosLosEstudiantes.filter(estudiante => 
        normalizarTexto(estudiante.nombre).includes(textoBusqueda)
      );
      setSugerencias(sugerenciasFiltradas);
      setMostrarSugerencias(true);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  }, [busquedaEstudiante, todosLosEstudiantes]);

  const buscarYRedirigirEstudiante = (nombre) => {
    if (!nombre.trim()) return;
    
    const estudianteEncontrado = todosLosEstudiantes.find(e => 
      normalizarTexto(e.nombre).includes(normalizarTexto(nombre))
    );
    
    if (estudianteEncontrado) {
      trackEvent('busqueda_estudiante', {
        termino_busqueda: nombre,
        estudiante_encontrado: estudianteEncontrado.nombre,
        clase: estudianteEncontrado.claseNombre
      });
      
      onBuscarEstudiante(estudianteEncontrado);
      setBusquedaEstudiante('');
      setMostrarSugerencias(false);
    } else {
      trackEvent('busqueda_estudiante_no_encontrado', {
        termino_busqueda: nombre
      });
      alert('Estudiante no encontrado');
    }
  };

  const seleccionarSugerencia = (estudiante) => {
    trackEvent('busqueda_sugerencia_seleccionada', {
      estudiante: estudiante.nombre,
      clase: estudiante.claseNombre
    });
    
    onBuscarEstudiante(estudiante);
    setBusquedaEstudiante('');
    setMostrarSugerencias(false);
  };

  return (
    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            🔍 Buscar Estudiante (en todas las clases)
          </label>
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el nombre del estudiante..."
                value={busquedaEstudiante}
                onChange={(e) => setBusquedaEstudiante(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarYRedirigirEstudiante(busquedaEstudiante)}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm md:text-base"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
            
            {/* Lista de sugerencias */}
            {mostrarSugerencias && sugerencias.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {sugerencias.map((estudiante) => (
                  <div
                    key={`${estudiante.claseId}-${estudiante.id}`}
                    onClick={() => seleccionarSugerencia(estudiante)}
                    className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {estudiante.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{estudiante.nombre}</span>
                        <p className="text-xs text-gray-500 mt-1">Clase: {estudiante.claseNombre}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Comienza a escribir para ver sugerencias. Ignora mayúsculas, tildes y comas.
          </p>
        </div>
        
        <div className="mt-4 md:mt-6">
          <button
            onClick={() => buscarYRedirigirEstudiante(busquedaEstudiante)}
            className="bg-purple-600 text-white px-4 md:px-6 py-3 rounded-lg hover:bg-purple-700 transition font-bold flex items-center gap-2 text-sm md:text-base"
          >
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para Cuadro de Porcentajes CORREGIDO
const CuadroPorcentajes = ({ estudiantes, calcularPromedioFinal, claseSeleccionada, trackEvent }) => {
  const calcularEstadisticas = () => {
    const anoActual = new Date().getFullYear();
    const anoLectivo = `${anoActual}-${anoActual + 1}`;
    
    // Filtrar estudiantes activos (no retirados)
    const estudiantesActivos = estudiantes.filter(e => !e.retirado);
    const totalEstudiantes = estudiantesActivos.length;
    
    if (totalEstudiantes === 0) {
      return {
        anoLectivo,
        aprobados: { total: 0, porcentaje: 0 },
        fracasados: { total: 0, porcentaje: 0 },
        fracasadosFecha: { total: 0, porcentaje: 0 },
        sinCalificaciones: 0,
        retirados: estudiantes.filter(e => e.retirado).length
      };
    }

    // Calcular estadísticas
    const aprobados = estudiantesActivos.filter(e => {
      const promedio = parseFloat(calcularPromedioFinal(e));
      return promedio >= 3.0 && promedio > 0;
    });

    const fracasados = estudiantesActivos.filter(e => {
      const promedio = parseFloat(calcularPromedioFinal(e));
      return promedio < 3.0 && promedio > 0;
    });

    // Fracasados a la fecha (estudiantes con al menos una nota pero promedio bajo 3.0)
    const fracasadosFecha = estudiantesActivos.filter(e => {
      const promedio = parseFloat(calcularPromedioFinal(e));
      const tieneNotas = (e.calificacionesDiarias && e.calificacionesDiarias.length > 0) || 
                        (e.apreciacion && e.apreciacion.length > 0) || 
                        (e.examen && e.examen.length > 0);
      return promedio < 3.0 && tieneNotas;
    });

    // Sin calificaciones (estudiantes sin ninguna nota registrada)
    const sinCalificaciones = estudiantesActivos.filter(e => {
      return (!e.calificacionesDiarias || e.calificacionesDiarias.length === 0) && 
             (!e.apreciacion || e.apreciacion.length === 0) && 
             (!e.examen || e.examen.length === 0);
    });

    const retirados = estudiantes.filter(e => e.retirado).length;

    return {
      anoLectivo,
      aprobados: {
        total: aprobados.length,
        porcentaje: totalEstudiantes > 0 ? (aprobados.length / totalEstudiantes * 100).toFixed(1) : 0
      },
      fracasados: {
        total: fracasados.length,
        porcentaje: totalEstudiantes > 0 ? (fracasados.length / totalEstudiantes * 100).toFixed(1) : 0
      },
      fracasadosFecha: {
        total: fracasadosFecha.length,
        porcentaje: totalEstudiantes > 0 ? (fracasadosFecha.length / totalEstudiantes * 100).toFixed(1) : 0
      },
      sinCalificaciones: sinCalificaciones.length,
      retirados: retirados
    };
  };

  const estadisticas = calcularEstadisticas();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <PieChart className="w-8 h-8 text-purple-600" />
          Cuadro de Porcentajes Académicos - {detectarTrimestre()}
        </h2>
        
        <OpcionesExportacion
          datos={JSON.stringify({
            tipo: 'porcentajes',
            clase: claseSeleccionada?.nombre,
            profesor: claseSeleccionada?.profesor,
            institucion: claseSeleccionada?.institucion,
            fecha: new Date().toLocaleDateString('es-PA'),
            trimestre: detectarTrimestre(),
            anoLectivo: estadisticas.anoLectivo,
            totalEstudiantes: estudiantes.filter(e => !e.retirado).length,
            estudiantesRetirados: estadisticas.retirados,
            estadisticas: estadisticas,
            estudiantes: estudiantes.map(e => ({
              nombre: e.nombre,
              promedio: calcularPromedioFinal(e),
              estado: parseFloat(calcularPromedioFinal(e)) >= 3.0 ? 'Aprobado' : 
                     parseFloat(calcularPromedioFinal(e)) > 0 ? 'Fracasado' : 'Sin calificaciones',
              retirado: e.retirado,
              tieneNotas: (e.calificacionesDiarias && e.calificacionesDiarias.length > 0) || 
                         (e.apreciacion && e.apreciacion.length > 0) || 
                         (e.examen && e.examen.length > 0),
              calificacionesDiarias: e.calificacionesDiarias ? e.calificacionesDiarias.length : 0,
              apreciacion: e.apreciacion ? e.apreciacion.length : 0,
              examen: e.examen ? e.examen.length : 0
            }))
          })}
          nombreArchivo={`Cuadro_Porcentajes_${claseSeleccionada?.nombre.replace(/\s+/g, '_')}_${detectarTrimestre().replace(/\s+/g, '_')}`}
          trackEvent={trackEvent}
        />
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Estadísticas del Año Lectivo</h3>
        <p className="text-gray-600 mb-4">
          Resumen académico basado en el rendimiento actual de los estudiantes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left font-bold text-lg">Año Lectivo</th>
              <th className="px-6 py-4 text-center font-bold text-lg">Aprobados</th>
              <th className="px-6 py-4 text-center font-bold text-lg">Fracasados</th>
              <th className="px-6 py-4 text-center font-bold text-lg">Fracasados a la Fecha</th>
              <th className="px-6 py-4 text-center font-bold text-lg">Sin Calificaciones</th>
              <th className="px-6 py-4 text-center font-bold text-lg">Retirados</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4 font-semibold text-gray-800">
                {estadisticas.anoLectivo}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-green-600">
                    {estadisticas.aprobados.total}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({estadisticas.aprobados.porcentaje}%)
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-red-600">
                    {estadisticas.fracasados.total}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({estadisticas.fracasados.porcentaje}%)
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-orange-600">
                    {estadisticas.fracasadosFecha.total}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({estadisticas.fracasadosFecha.porcentaje}%)
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-2xl font-bold text-yellow-600">
                  {estadisticas.sinCalificaciones}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-2xl font-bold text-gray-600">
                  {estadisticas.retirados}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Leyenda explicativa */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">📝 Leyenda:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span><strong>Aprobados:</strong> Estudiantes con promedio ≥ 3.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span><strong>Fracasados:</strong> Estudiantes con promedio &lt; 3.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span><strong>Fracasados a la fecha:</strong> Estudiantes con notas pero promedio &lt; 3.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span><strong>Sin calificaciones:</strong> Estudiantes sin notas registradas</span>
          </div>
        </div>
      </div>

      {/* Resumen adicional */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{estadisticas.aprobados.total}</p>
          <p className="text-sm text-green-800">Estudiantes Aprobados</p>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {estadisticas.fracasados.total + estadisticas.fracasadosFecha.total}
          </p>
          <p className="text-sm text-red-800">Estudiantes en Riesgo</p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{estadisticas.retirados}</p>
          <p className="text-sm text-blue-800">Estudiantes Retirados</p>
        </div>
      </div>
    </div>
  );
};

// ✅ FUNCIONES DE EXPORTACIÓN CORREGIDAS - SIN ERRORES DE PROPIEDADES

// Utilidades comunes CORREGIDAS
const normalizarDatos = (datosIn) => {
  try {
    if (!datosIn) return {};
    if (typeof datosIn === 'string') {
      return JSON.parse(datosIn);
    }
    return datosIn || {};
  } catch (error) {
    console.error('Error normalizando datos:', error);
    return {};
  }
};

const objetoATabla = (obj) => {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, value]) => ({
    Campo: key,
    Valor: typeof value === 'object' ? JSON.stringify(value) : String(value || ''),
  }));
};

const descargarBlob = (blob, nombreArchivo) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Función auxiliar para calcular promedios CORREGIDA
const calcularTotalSeccionExport = (notas) => {
  if (!notas || !Array.isArray(notas) || notas.length === 0) return '0.00';
  const numeros = notas.map(n => {
    const valor = typeof n === 'object' ? parseFloat(n.valor) : parseFloat(n);
    return isNaN(valor) ? 0 : valor;
  }).filter(v => v > 0);
  if (numeros.length === 0) return '0.00';
  return (numeros.reduce((a, b) => a + b, 0) / numeros.length).toFixed(2);
};

// Función auxiliar para contar asistencias CORREGIDA
const contarAsistenciasExport = (estudiante) => {
  const registros = estudiante.asistencia || {};
  const presente = Object.values(registros).filter(v => v === 'presente').length;
  const ausente = Object.values(registros).filter(v => v === 'ausente').length;
  const tardanza = Object.values(registros).filter(v => v === 'tardanza').length;
  const fuga = Object.values(registros).filter(v => v === 'fuga').length;
  const ausenciaJustificada = Object.values(registros).filter(v => v === 'ausenciaJustificada').length;
  return { presente, ausente, tardanza, fuga, ausenciaJustificada };
};

// Exportar a Excel CORREGIDO - SIN ERRORES
const exportarAExcel = (datosIn, nombreArchivo, trackEvent) => {
  try {
    const datos = normalizarDatos(datosIn);
    const workbook = XLSX.utils.book_new();

    // Track del evento de exportación
    trackEvent('exportacion_excel', {
      tipo_datos: datos.tipo,
      nombre_archivo: nombreArchivo,
      clase: datos.clase
    });

    // Crear múltiples hojas según el tipo de datos
    if (datos.tipo === 'calificaciones') {
      // Hoja de resumen general
      const resumenData = [
        ['REPORTE DE CALIFICACIONES - BRINGO EDU'],
        [''],
        ['Información General'],
        [`Clase: ${datos.clase || ''}`],
        [`Profesor: ${datos.profesor || ''}`],
        [`Institución: ${datos.institucion || ''}`],
        [`Fecha: ${datos.fecha || ''}`],
        [`Trimestre: ${detectarTrimestre()}`],
        [`Promedio General: ${datos.promedioGeneral || '0'}/5.0`],
        [`Total Estudiantes: ${datos.totalEstudiantes || 0}`],
        [`Estudiantes en Riesgo: ${datos.estudiantesEnRiesgo || 0}`],
        [''],
        ['Distribución de Rendimiento'],
        [`Excelente (4.5-5.0): ${datos.distribucion?.excelente || 0}`],
        [`Bueno (3.5-4.4): ${datos.distribucion?.bueno || 0}`],
        [`Regular (3.0-3.4): ${datos.distribucion?.regular || 0}`],
        [`En Riesgo (0-2.9): ${datos.distribucion?.riesgo || 0}`],
        ['']
      ];
      
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

      // Hoja de calificaciones detalladas
      const calificacionesHeaders = [
        'Estudiante', 
        'Promedio Final', 
        'Calificaciones Diarias (Promedio)',
        'Cantidad Calificaciones Diarias',
        'Apreciación (Promedio)',
        'Cantidad Apreciación',
        'Examen (Promedio)',
        'Cantidad Examen',
        'Estado'
      ];
      
      const calificacionesData = (datos.estudiantes || []).map(estudiante => [
        estudiante.nombre || '',
        parseFloat(estudiante.promedioFinal || 0),
        parseFloat(calcularTotalSeccionExport(estudiante.calificacionesDiarias) || 0),
        (estudiante.calificacionesDiarias && estudiante.calificacionesDiarias.length) || 0,
        parseFloat(calcularTotalSeccionExport(estudiante.apreciacion) || 0),
        (estudiante.apreciacion && estudiante.apreciacion.length) || 0,
        parseFloat(calcularTotalSeccionExport(estudiante.examen) || 0),
        (estudiante.examen && estudiante.examen.length) || 0,
        parseFloat(estudiante.promedioFinal || 0) >= 3.5 ? 'Satisfactorio' : 
        parseFloat(estudiante.promedioFinal || 0) >= 3.0 ? 'Regular' : 'En Riesgo'
      ]);

      const wsCalificaciones = XLSX.utils.aoa_to_sheet([calificacionesHeaders, ...calificacionesData]);
      XLSX.utils.book_append_sheet(workbook, wsCalificaciones, 'Calificaciones Detalladas');

      // Hoja de calificaciones individuales por tipo
      const detalleHeaders = ['Estudiante', 'Tipo Calificación', 'Valor', 'Fecha', 'Título Evaluación'];
      const detalleData = [];
      
      (datos.estudiantes || []).forEach(estudiante => {
        const nombre = estudiante.nombre || '';
        
        // Calificaciones diarias
        (estudiante.calificacionesDiarias || []).forEach(calificacion => {
          detalleData.push([
            nombre,
            'Calificación Diaria',
            parseFloat(calificacion.valor || 0),
            calificacion.fecha || 'Sin fecha',
            calificacion.titulo || 'Sin título'
          ]);
        });
        
        // Apreciación
        (estudiante.apreciacion || []).forEach(calificacion => {
          detalleData.push([
            nombre,
            'Apreciación',
            parseFloat(calificacion.valor || 0),
            calificacion.fecha || 'Sin fecha',
            calificacion.titulo || 'Sin título'
          ]);
        });
        
        // Examen
        (estudiante.examen || []).forEach(calificacion => {
          detalleData.push([
            nombre,
            'Examen',
            parseFloat(calificacion.valor || 0),
            calificacion.fecha || 'Sin fecha',
            calificacion.titulo || 'Sin título'
          ]);
        });
      });

      if (detalleData.length > 0) {
        const wsDetalle = XLSX.utils.aoa_to_sheet([detalleHeaders, ...detalleData]);
        XLSX.utils.book_append_sheet(workbook, wsDetalle, 'Calificaciones Individuales');
      }

    } else if (datos.tipo === 'asistencia') {
      // Hoja de asistencia
      const asistenciaHeaders = [
        'Estudiante',
        'Fecha',
        'Estado',
        'Total Presente',
        'Total Tardanza',
        'Total Ausente',
        'Total Fuga',
        'Total Ausencia Justificada',
        'Porcentaje Asistencia'
      ];
      
      const asistenciaData = [];
      (datos.estudiantes || []).forEach(estudiante => {
        const asistencia = contarAsistenciasExport(estudiante);
        const totalAsistencias = asistencia.presente + asistencia.tardanza + asistencia.ausente + asistencia.fuga + asistencia.ausenciaJustificada;
        const porcentajeAsistencia = totalAsistencias > 0 ? 
          Math.round((asistencia.presente / totalAsistencias) * 100) : 0;
        
        // Resumen por estudiante
        asistenciaData.push([
          estudiante.nombre || '',
          'RESUMEN',
          '-',
          asistencia.presente,
          asistencia.tardanza,
          asistencia.ausente,
          asistencia.fuga,
          asistencia.ausenciaJustificada,
          `${porcentajeAsistencia}%`
        ]);

        // Detalle por fecha
        Object.entries(estudiante.asistencia || {}).forEach(([fecha, estado]) => {
          asistenciaData.push([
            estudiante.nombre || '',
            fecha,
            estado,
            '-', '-', '-', '-', '-', '-'
          ]);
        });
      });

      const wsAsistencia = XLSX.utils.aoa_to_sheet([asistenciaHeaders, ...asistenciaData]);
      XLSX.utils.book_append_sheet(workbook, wsAsistencia, 'Asistencia');

    } else if (datos.tipo === 'progreso') {
      // Hoja de progreso general
      const progresoData = [
        ['TABLERO DE PROGRESO - BRINGO EDU'],
        [''],
        ['ESTADÍSTICAS GENERALES'],
        [`Clase: ${datos.clase || ''}`],
        [`Profesor: ${datos.profesor || ''}`],
        [`Institución: ${datos.institucion || ''}`],
        [`Fecha: ${datos.fecha || ''}`],
        [`Trimestre: ${detectarTrimestre()}`],
        [`Promedio General: ${datos.promedioGeneral || '0'}/5.0`],
        [`Total Estudiantes: ${datos.totalEstudiantes || 0}`],
        [`Estudiantes en Riesgo: ${datos.estudiantesEnRiesgo || 0}`],
        [''],
        ['DISTRIBUCIÓN DE RENDIMIENTO'],
        [`Excelente (4.5-5.0): ${datos.distribucion?.excelente || 0} estudiantes`],
        [`Bueno (3.5-4.4): ${datos.distribucion?.bueno || 0} estudiantes`],
        [`Regular (3.0-3.4): ${datos.distribucion?.regular || 0} estudiantes`],
        [`En Riesgo (0-2.9): ${datos.distribucion?.riesgo || 0} estudiantes`],
        ['']
      ];

      const wsProgreso = XLSX.utils.aoa_to_sheet(progresoData);
      XLSX.utils.book_append_sheet(workbook, wsProgreso, 'Progreso General');

      // Hoja de ranking
      if (datos.ranking && Array.isArray(datos.ranking) && datos.ranking.length > 0) {
        const rankingHeaders = ['Posición', 'Estudiante', 'Promedio', 'Estado'];
        const rankingData = datos.ranking.map((est, index) => [
          index + 1,
          est.nombre || '',
          parseFloat(est.promedio || 0),
          parseFloat(est.promedio || 0) >= 4.5 ? 'Excelente' :
          parseFloat(est.promedio || 0) >= 3.5 ? 'Bueno' :
          parseFloat(est.promedio || 0) >= 3.0 ? 'Regular' : 'En Riesgo'
        ]);

        const wsRanking = XLSX.utils.aoa_to_sheet([rankingHeaders, ...rankingData]);
        XLSX.utils.book_append_sheet(workbook, wsRanking, 'Ranking');
      }

    } else if (datos.tipo === 'porcentajes') {
      // Hoja de porcentajes académicos
      const porcentajesData = [
        ['CUADRO DE PORCENTAJES ACADÉMICOS - BRINGO EDU'],
        [''],
        ['INFORMACIÓN GENERAL'],
        [`Clase: ${datos.clase || ''}`],
        [`Profesor: ${datos.profesor || ''}`],
        [`Institución: ${datos.institucion || ''}`],
        [`Fecha: ${datos.fecha || ''}`],
        [`Trimestre: ${detectarTrimestre()}`],
        [`Año Lectivo: ${datos.anoLectivo || ''}`],
        [`Total Estudiantes Activos: ${datos.totalEstudiantes || 0}`],
        [`Estudiantes Retirados: ${datos.estudiantesRetirados || 0}`],
        [''],
        ['ESTADÍSTICAS ACADÉMICAS'],
        [`Aprobados: ${datos.estadisticas?.aprobados?.total || 0} (${datos.estadisticas?.aprobados?.porcentaje || 0}%)`],
        [`Fracasados: ${datos.estadisticas?.fracasados?.total || 0} (${datos.estadisticas?.fracasados?.porcentaje || 0}%)`],
        [`Fracasados a la Fecha: ${datos.estadisticas?.fracasadosFecha?.total || 0} (${datos.estadisticas?.fracasadosFecha?.porcentaje || 0}%)`],
        [`Sin Calificaciones: ${datos.estadisticas?.sinCalificaciones || 0}`],
        ['']
      ];

      const wsPorcentajes = XLSX.utils.aoa_to_sheet(porcentajesData);
      XLSX.utils.book_append_sheet(workbook, wsPorcentajes, 'Porcentajes');

      // Hoja de detalle por estudiante
      const detalleHeaders = ['Estudiante', 'Promedio', 'Estado', 'Retirado', 'Tiene Calificaciones', 'Calificaciones Diarias', 'Apreciación', 'Examen'];
      const detalleData = (datos.estudiantes || []).map(estudiante => [
        estudiante.nombre || '',
        parseFloat(estudiante.promedio || 0),
        estudiante.estado || '',
        estudiante.retirado ? 'Sí' : 'No',
        estudiante.tieneCalificaciones ? 'Sí' : 'No',
        estudiante.calificacionesDiarias || 0,
        estudiante.apreciacion || 0,
        estudiante.examen || 0
      ]);

      const wsDetalle = XLSX.utils.aoa_to_sheet([detalleHeaders, ...detalleData]);
      XLSX.utils.book_append_sheet(workbook, wsDetalle, 'Detalle Estudiantes');

    } else if (datos.tipo === 'habitos') {
      // Hoja de hábitos y aptitudes
      const habitosHeaders = [
        'Estudiante',
        'Hábitos y Aptitudes',
        'Trimestre',
        'Fecha Evaluación'
      ];
      
      const habitosData = (datos.estudiantes || []).map(estudiante => [
        estudiante.nombre || '',
        estudiante.habitosAptitudes || 'No evaluado',
        detectarTrimestre(),
        new Date().toLocaleDateString('es-PA')
      ]);

      const wsHabitos = XLSX.utils.aoa_to_sheet([habitosHeaders, ...habitosData]);
      XLSX.utils.book_append_sheet(workbook, wsHabitos, 'Hábitos y Aptitudes');

    } else {
      // Exportación genérica para otros datos
      let worksheet;
      if (Array.isArray(datos)) {
        worksheet = XLSX.utils.json_to_sheet(datos);
      } else if (typeof datos === 'object' && datos) {
        worksheet = XLSX.utils.json_to_sheet(objetoATabla(datos));
      } else {
        worksheet = XLSX.utils.json_to_sheet([{ Valor: String(datos || '') }]);
      }
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    }

    XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
    console.log('✅ Archivo Excel generado exitosamente');
    
  } catch (error) {
    console.error('❌ Error al exportar a Excel:', error);
    trackEvent('error_exportacion', {
      tipo: 'excel',
      error: error.message
    });
    alert('Error al generar archivo Excel: ' + error.message);
  }
};

// Exportar a Word CORREGIDO - SIN ERRORES
const exportarAWord = async (datosIn, nombreArchivo, trackEvent) => {
  try {
    const datos = normalizarDatos(datosIn);
    const children = [];

    // Track del evento de exportación
    trackEvent('exportacion_word', {
      tipo_datos: datos.tipo,
      nombre_archivo: nombreArchivo,
      clase: datos.clase
    });

    // Título principal con formato atractivo
    children.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: '📊 BRINGO EDU - REPORTE ACADÉMICO', 
            bold: true, 
            size: 36,
            color: '2D3748'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        border: {
          bottom: {
            color: '6B46C1',
            space: 1,
            value: 'single',
            size: 8
          }
        }
      }),
      
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Generado: ${new Date().toLocaleDateString('es-PA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} | Trimestre: ${detectarTrimestre()}`, 
            italics: true, 
            size: 22,
            color: '718096'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );

    // Sección de información general con diseño mejorado
    if (datos.tipo === 'calificaciones' || datos.tipo === 'progreso') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: '🏫 INFORMACIÓN GENERAL', 
              bold: true, 
              size: 28,
              color: '2D3748'
            })
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Clase: ', bold: true, size: 24 }),
            new TextRun({ text: datos.clase || 'No especificada', size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Profesor: ', bold: true, size: 24 }),
            new TextRun({ text: datos.profesor || 'No especificado', size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Institución: ', bold: true, size: 24 }),
            new TextRun({ text: datos.institucion || 'No especificada', size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Promedio General: ', bold: true, size: 24 }),
            new TextRun({ 
              text: `${datos.promedioGeneral || '0'}/5.0`, 
              size: 24,
              color: parseFloat(datos.promedioGeneral || 0) >= 3.5 ? '38A169' : 'E53E3E'
            })
          ],
          spacing: { after: 200 },
        })
      );

      // Estadísticas destacadas
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: '📈 ESTADÍSTICAS DESTACADAS', 
              bold: true, 
              size: 28,
              color: '2D3748'
            })
          ],
          spacing: { before: 400, after: 200 },
        })
      );

      const stats = [
        { label: 'Total Estudiantes', value: datos.totalEstudiantes || 0, icon: '👥' },
        { label: 'Estudiantes en Riesgo', value: datos.estudiantesEnRiesgo || 0, icon: '⚠️' },
        { label: 'Promedio Más Alto', value: `${Math.max(...(datos.estudiantes || []).map(e => parseFloat(e.promedioFinal || 0))).toFixed(1)}/5.0`, icon: '🏆' }
      ];

      stats.forEach(stat => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${stat.icon} ${stat.label}: `, bold: true, size: 22 }),
              new TextRun({ text: String(stat.value), size: 22, color: '4A5568' })
            ],
            spacing: { after: 100 },
          })
        );
      });

      // Distribución de rendimiento con colores
      if (datos.distribucion) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ 
                text: '📊 DISTRIBUCIÓN DE RENDIMIENTO', 
                bold: true, 
                size: 28,
                color: '2D3748'
              })
            ],
            spacing: { before: 400, after: 200 },
          })
        );

        const distribuciones = [
          { label: 'Excelente (4.5-5.0)', value: datos.distribucion.excelente, color: '38A169' },
          { label: 'Bueno (3.5-4.4)', value: datos.distribucion.bueno, color: '3182CE' },
          { label: 'Regular (3.0-3.4)', value: datos.distribucion.regular, color: 'D69E2E' },
          { label: 'En Riesgo (0-2.9)', value: datos.distribucion.riesgo, color: 'E53E3E' }
        ];

        distribuciones.forEach(dist => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: '• ', size: 22 }),
                new TextRun({ text: dist.label, bold: true, size: 22 }),
                new TextRun({ text: `: ${dist.value} estudiantes`, size: 22, color: dist.color })
              ],
              spacing: { after: 80 },
            })
          );
        });
      }

      // Tabla de estudiantes con formato atractivo
      if (datos.estudiantes && Array.isArray(datos.estudiantes) && datos.estudiantes.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ 
                text: '👥 DETALLE DE ESTUDIANTES', 
                bold: true, 
                size: 28,
                color: '2D3748'
              })
            ],
            spacing: { before: 400, after: 200 },
          })
        );

        // Encabezados de la tabla con colores
        const tableRows = [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Estudiante', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Promedio', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Calificaciones Diarias', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Apreciación', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Examen', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Estado', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              })
            ],
          }),
          ...datos.estudiantes.map(estudiante => {
            const promedio = parseFloat(estudiante.promedioFinal || 0);
            const estadoColor = promedio >= 4.5 ? '38A169' :
                              promedio >= 3.5 ? '3182CE' :
                              promedio >= 3.0 ? 'D69E2E' : 'E53E3E';
            const estadoTexto = promedio >= 4.5 ? 'Excelente' :
                               promedio >= 3.5 ? 'Bueno' :
                               promedio >= 3.0 ? 'Regular' : 'En Riesgo';

            return new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: estudiante.nombre || '', size: 20 })],
                    alignment: AlignmentType.LEFT
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: promedio.toFixed(1), 
                      bold: true,
                      color: estadoColor,
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: calcularTotalSeccionExport(estudiante.calificacionesDiarias), 
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: calcularTotalSeccionExport(estudiante.apreciacion), 
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: calcularTotalSeccionExport(estudiante.examen), 
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: estadoTexto, 
                      bold: true,
                      color: estadoColor,
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                })
              ],
            });
          })
        ];

        children.push(
          new Table({ 
            width: { size: 100, type: 'pct' }, 
            rows: tableRows,
            margins: { top: 200, bottom: 200 }
          })
        );
      }

    } else if (datos.tipo === 'asistencia') {
      // Formato específico para asistencia
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: '📅 REPORTE DE ASISTENCIA', 
              bold: true, 
              size: 32,
              color: '2D3748'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Clase: ', bold: true, size: 24 }),
            new TextRun({ text: datos.clase || 'No especificada', size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Fecha: ', bold: true, size: 24 }),
            new TextRun({ text: datos.fecha || 'No especificada', size: 24 })
          ],
          spacing: { after: 400 },
        })
      );

      // Tabla de asistencia
      if (datos.estudiantes && Array.isArray(datos.estudiantes) && datos.estudiantes.length > 0) {
        const tableRows = [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Estudiante', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Asistencia', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Tardanzas', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Ausencias', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Fugas', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Ausencias Justificadas', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Porcentaje', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              })
            ],
          }),
          ...datos.estudiantes.map(estudiante => {
            const asistencia = contarAsistenciasExport(estudiante);
            const totalAsistencias = asistencia.presente + asistencia.tardanza + asistencia.ausente + asistencia.fuga + asistencia.ausenciaJustificada;
            const porcentajeAsistencia = totalAsistencias > 0 ? 
              Math.round((asistencia.presente / totalAsistencias) * 100) : 0;
            const porcentajeColor = porcentajeAsistencia >= 90 ? '38A169' :
                                  porcentajeAsistencia >= 80 ? 'D69E2E' : 'E53E3E';

            return new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: estudiante.nombre || '', size: 20 })],
                    alignment: AlignmentType.LEFT
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: String(asistencia.presente), 
                      color: '38A169',
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: String(asistencia.tardanza), 
                      color: 'D69E2E',
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: String(asistencia.ausente), 
                      color: 'E53E3E',
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: String(asistencia.fuga), 
                      color: 'E53E3E',
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: String(asistencia.ausenciaJustificada), 
                      color: 'D69E2E',
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: `${porcentajeAsistencia}%`, 
                      bold: true,
                      color: porcentajeColor,
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                })
              ],
            });
          })
        ];

        children.push(
          new Table({ 
            width: { size: 100, type: 'pct' }, 
            rows: tableRows 
          })
        );
      }
    } else if (datos.tipo === 'habitos') {
      // Formato específico para hábitos y aptitudes
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: '🌟 EVALUACIÓN DE HÁBITOS Y APTITUDES', 
              bold: true, 
              size: 32,
              color: '2D3748'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Clase: ', bold: true, size: 24 }),
            new TextRun({ text: datos.clase || 'No especificada', size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Trimestre: ', bold: true, size: 24 }),
            new TextRun({ text: detectarTrimestre(), size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Fecha: ', bold: true, size: 24 }),
            new TextRun({ text: datos.fecha || 'No especificada', size: 24 })
          ],
          spacing: { after: 400 },
        })
      );

      // Leyenda de calificaciones
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: '📝 LEYENDA DE CALIFICACIONES: S = Excelente, R = Regular, X = Malo', 
              bold: true, 
              size: 20,
              color: '4A5568'
            })
          ],
          spacing: { after: 200 },
        })
      );

      // Tabla de hábitos y aptitudes
      if (datos.estudiantes && Array.isArray(datos.estudiantes) && datos.estudiantes.length > 0) {
        const tableRows = [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Estudiante', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              }),
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: 'Hábitos y Aptitudes', bold: true, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER
                })],
                shading: { fill: '4C51BF' }
              })
            ],
          }),
          ...datos.estudiantes.map(estudiante => {
            const habitos = estudiante.habitosAptitudes || 'No evaluado';
            const color = habitos === 'S' ? '38A169' : 
                         habitos === 'R' ? 'D69E2E' : 
                         habitos === 'X' ? 'E53E3E' : '718096';
            
            const texto = habitos === 'S' ? 'Excelente' : 
                         habitos === 'R' ? 'Regular' : 
                         habitos === 'X' ? 'Malo' : 'No evaluado';

            return new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ text: estudiante.nombre || '', size: 20 })],
                    alignment: AlignmentType.LEFT
                  })],
                  shading: { fill: 'F7FAFC' }
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: `${habitos} - ${texto}`, 
                      bold: true,
                      color: color,
                      size: 20 
                    })],
                    alignment: AlignmentType.CENTER
                  })],
                  shading: { fill: 'F7FAFC' }
                })
              ],
            });
          })
        ];

        children.push(
          new Table({ 
            width: { size: 100, type: 'pct' }, 
            rows: tableRows 
          })
        );
      }
    } else if (datos.tipo === 'porcentajes') {
      // Formato específico para porcentajes académicos
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: '📊 CUADRO DE PORCENTAJES ACADÉMICOS', 
              bold: true, 
              size: 32,
              color: '2D3748'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Trimestre: ', bold: true, size: 24 }),
            new TextRun({ text: detectarTrimestre(), size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Clase: ', bold: true, size: 24 }),
            new TextRun({ text: datos.clase || 'No especificada', size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Profesor: ', bold: true, size: 24 }),
            new TextRun({ text: datos.profesor || 'No especificado', size: 24 })
          ],
          spacing: { after: 120 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Institución: ', bold: true, size: 24 }),
            new TextRun({ text: datos.institucion || 'No especificada', size: 24 })
          ],
          spacing: { after: 400 },
        })
      );

      // Tabla de estadísticas principales
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: 'Indicador', bold: true, color: 'FFFFFF' })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: '4C51BF' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: 'Cantidad', bold: true, color: 'FFFFFF' })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: '4C51BF' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: 'Porcentaje', bold: true, color: 'FFFFFF' })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: '4C51BF' }
            })
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: 'Aprobados', size: 20 })],
                alignment: AlignmentType.LEFT
              })],
              shading: { fill: 'F0FFF4' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: String(datos.estadisticas?.aprobados?.total || 0), 
                  size: 20,
                  color: '38A169'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'F0FFF4' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: `${datos.estadisticas?.aprobados?.porcentaje || 0}%`, 
                  size: 20,
                  color: '38A169'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'F0FFF4' }
            })
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: 'Fracasados', size: 20 })],
                alignment: AlignmentType.LEFT
              })],
              shading: { fill: 'FEF2F2' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: String(datos.estadisticas?.fracasados?.total || 0), 
                  size: 20,
                  color: 'E53E3E'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'FEF2F2' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: `${datos.estadisticas?.fracasados?.porcentaje || 0}%`, 
                  size: 20,
                  color: 'E53E3E'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'FEF2F2' }
            })
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: 'Fracasados a la Fecha', size: 20 })],
                alignment: AlignmentType.LEFT
              })],
              shading: { fill: 'FFFAF0' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: String(datos.estadisticas?.fracasadosFecha?.total || 0), 
                  size: 20,
                  color: 'DD6B20'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'FFFAF0' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: `${datos.estadisticas?.fracasadosFecha?.porcentaje || 0}%`, 
                  size: 20,
                  color: 'DD6B20'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'FFFAF0' }
            })
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: 'Sin Calificaciones', size: 20 })],
                alignment: AlignmentType.LEFT
              })],
              shading: { fill: 'FFFBEB' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: String(datos.estadisticas?.sinCalificaciones || 0), 
                  size: 20,
                  color: 'D69E2E'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'FFFBEB' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: '-', 
                  size: 20,
                  color: 'D69E2E'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'FFFBEB' }
            })
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: 'Retirados', size: 20 })],
                alignment: AlignmentType.LEFT
              })],
              shading: { fill: 'F7FAFC' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: String(datos.estadisticas?.retirados || 0), 
                  size: 20,
                  color: '4A5568'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'F7FAFC' }
            }),
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: '-', 
                  size: 20,
                  color: '4A5568'
                })],
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: 'F7FAFC' }
            })
          ],
        })
      ];

      children.push(
        new Table({ 
          width: { size: 100, type: 'pct' }, 
          rows: tableRows 
        })
      );
    }

    // Pie de página
    children.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: '\n---\nGenerado con Bringo Edu 📚 | Asistente Inteligente para Profesores', 
            italics: true, 
            size: 18,
            color: '718096'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreArchivo}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ Archivo Word generado exitosamente');
    
  } catch (error) {
    console.error('❌ Error al exportar a Word:', error);
    trackEvent('error_exportacion', {
      tipo: 'word',
      error: error.message
    });
    alert('Error al generar archivo Word: ' + error.message);
  }
};

// Generar Blob por formato CORREGIDO
const generarBlobPorFormato = async (datosIn, formato) => {
  const datos = normalizarDatos(datosIn);
  console.log(`📊 Generando blob para formato: ${formato}`, datos);

  if (formato === 'excel') {
    const workbook = XLSX.utils.book_new();
    let worksheet;
    
    if (Array.isArray(datos)) {
      worksheet = XLSX.utils.json_to_sheet(datos);
    } else if (typeof datos === 'object' && datos !== null) {
      worksheet = XLSX.utils.json_to_sheet(objetoATabla(datos));
    } else {
      worksheet = XLSX.utils.json_to_sheet([{ Valor: String(datos || '') }]);
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    const arrayBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    });
    
    return {
      blob: new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      }),
      ext: 'xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  if (formato === 'word') {
    const children = [
      new Paragraph({
        children: [new TextRun({ text: 'Reporte Bringo Edu', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Generado: ${new Date().toLocaleDateString('es-PA')} | Trimestre: ${detectarTrimestre()}`, italics: true, size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];

    if (Array.isArray(datos) && datos.length > 0) {
      const headers = Object.keys(datos[0]);
      const rows = [
        new TableRow({
          children: headers.map((k) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: k, bold: true })] })],
              shading: { fill: 'D0C9FF' },
            })
          ),
        }),
        ...datos.map(
          (row) =>
            new TableRow({
              children: headers.map((k) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k] || '') })] })],
                })
              ),
            })
        ),
      ];
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'Datos del Reporte', bold: true, size: 24 })], spacing: { after: 200 } }),
        new Table({ width: { size: 100, type: 'pct' }, rows })
      );
    } else if (typeof datos === 'object' && datos) {
      Object.entries(datos).forEach(([key, value]) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${key}: `, bold: true, size: 20 }),
              new TextRun({ text: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || ''), size: 20 }),
            ],
            spacing: { after: 200 },
          })
        );
      });
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: String(datos || ''), size: 20 })] }));
    }

    const docx = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(docx);
    return { 
      blob, 
      ext: 'docx', 
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    };
  }

  throw new Error(`Formato no soportado: ${formato}`);
};

// Subir a Google Drive CORREGIDO
const subirAGoogleDrive = async (datosIn, nombreArchivoBase, formato = 'excel', trackEvent) => {
  try {
    console.log('🔄 Iniciando subida a Google Drive...', { nombreArchivoBase, formato });
    
    const { blob, ext, mime } = await generarBlobPorFormato(datosIn, formato);
    const nombreArchivo = `${nombreArchivoBase}.${ext}`;

    console.log('📦 Preparando FormData...', { nombreArchivo, tipo: mime });
    
    const formData = new FormData();
    formData.append('file', blob, nombreArchivo);
    formData.append('filename', nombreArchivo);
    formData.append('mimeType', mime);

    // Track del evento de subida
    trackEvent('subida_drive_iniciada', {
      nombre_archivo: nombreArchivo,
      formato: formato
    });

    // Configurar headers de autenticación
    let headers = {
      'Accept': 'application/json',
    };

    // Agregar token de autenticación si está disponible
    if (auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 Token de autenticación incluido');
      } catch (tokenError) {
        console.warn('⚠️ No se pudo obtener token, intentando sin autenticación');
      }
    }

    const DRIVE_UPLOAD_URL = 'https://bringo-edu-backend-2.onrender.com/api/export-to-drive';
    
    console.log('🚀 Enviando a:', DRIVE_UPLOAD_URL);
    
    // Timeout de 25 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(DRIVE_UPLOAD_URL, {
      method: 'POST',
      headers: headers,
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📨 Respuesta del servidor:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      trackEvent('error_subida_drive', {
        error: errorText,
        status: response.status
      });
      throw new Error(`Error ${response.status}: ${errorText || 'Error del servidor'}`);
    }

    const result = await response.json();
    console.log('✅ Subida a Drive exitosa:', result);
    
    // Track del éxito
    trackEvent('subida_drive_exitosa', {
      nombre_archivo: nombreArchivo,
      formato: formato
    });
    
    // Mostrar mensaje de éxito
    alert(`🎉 ¡Archivo subido exitosamente a Google Drive!\n\n📁 Nombre: ${nombreArchivo}\n📊 Tipo: ${formato.toUpperCase()}\n📅 Trimestre: ${detectarTrimestre()}`);
    
    return result;

  } catch (error) {
    console.error('❌ Error completo en subida a Drive:', error);
    
    let mensajeUsuario = 'Error al subir a Google Drive';
    
    if (error.name === 'AbortError') {
      mensajeUsuario = '⏰ El servidor tardó demasiado en responder. Intenta nuevamente.';
    } else if (error.message.includes('Failed to fetch')) {
      mensajeUsuario = '🌐 Error de conexión. Verifica tu internet e intenta nuevamente.';
    } else if (error.message.includes('404')) {
      mensajeUsuario = '🔍 Servicio no encontrado. El backend podría estar en mantenimiento.';
    } else {
      mensajeUsuario = `❌ ${error.message}`;
    }
    
    trackEvent('error_subida_drive_final', {
      error: error.message,
      tipo_error: error.name
    });
    
    alert(mensajeUsuario);
    throw error;
  }
};

// Componente OpcionesExportacion CORREGIDO
function OpcionesExportacion({ datos, nombreArchivo, onExportar, trackEvent }) {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [mostrarDrive, setMostrarDrive] = useState(false);
  const [exportando, setExportando] = useState('');

  const handleExportar = async (formato, destino = 'descarga') => {
    const operacion = `${destino}-${formato}`;
    setExportando(operacion);
    
    try {
      console.log(`🚀 Iniciando exportación: ${destino} - ${formato}`);
      
      if (destino === 'descarga') {
        switch (formato) {
          case 'excel':
            exportarAExcel(datos, nombreArchivo, trackEvent);
            break;
          case 'word':
            await exportarAWord(datos, nombreArchivo, trackEvent);
            break;
        }
        trackEvent('exportacion_exitosa', {
          formato: formato,
          destino: destino,
          nombre_archivo: nombreArchivo
        });
        alert(`✅ Descarga completada: ${formato.toUpperCase()}`);
      } else if (destino === 'drive') {
        await subirAGoogleDrive(datos, nombreArchivo, formato, trackEvent);
        // El alert ya se muestra en subirAGoogleDrive
      }
      
      setMostrarOpciones(false);
      setMostrarDrive(false);
      if (onExportar) onExportar(formato, destino);
      
    } catch (error) {
      console.error(`Error en exportación ${formato} a ${destino}:`, error);
      trackEvent('error_exportacion', {
        formato: formato,
        destino: destino,
        error: error.message
      });
    } finally {
      setExportando('');
    }
  };

  const getBotonTexto = (formato, destino) => {
    if (exportando === `${destino}-${formato}`) {
      return '⏳ Procesando...';
    }
    
    const formatos = {
      excel: '📊 Excel',
      word: '📝 Word'
    };
    
    const destinos = {
      descarga: 'Descargar',
      drive: 'Subir a Drive'
    };
    
    return `${destinos[destino]} ${formatos[formato]}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setMostrarOpciones((v) => !v);
          setMostrarDrive(false);
          trackEvent('boton_exportar_click');
        }}
        disabled={!!exportando}
        className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold flex items-center gap-2 ${
          exportando ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {exportando ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Exportar
          </>
        )}
      </button>

      {mostrarOpciones && !exportando && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Descargas locales */}
          <div className="p-2">
            <h4 className="text-sm font-bold text-gray-700 mb-2 px-2">📥 Descargar Localmente</h4>
            <button
              onClick={() => handleExportar('excel', 'descarga')}
              className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-2 rounded-lg border-b border-gray-100 text-sm"
            >
              <span className="text-green-600">📊</span>
              <span>{getBotonTexto('excel', 'descarga')}</span>
            </button>
            <button
              onClick={() => handleExportar('word', 'descarga')}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-2 rounded-lg text-sm"
            >
              <span className="text-blue-600">📝</span>
              <span>{getBotonTexto('word', 'descarga')}</span>
            </button>
          </div>

          {/* Google Drive */}
          <div className="border-t border-gray-200">
            {!mostrarDrive ? (
              <button
                onClick={() => {
                  setMostrarDrive(true);
                  trackEvent('opcion_drive_seleccionada');
                }}
                className="w-full px-4 py-3 text-left hover:bg-yellow-50 flex items-center gap-2 text-sm"
              >
                <span className="text-yellow-600">☁️</span>
                <span>Google Drive</span>
                <span className="ml-auto">▶</span>
              </button>
            ) : (
              <div className="p-2 bg-yellow-50">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <button
                    onClick={() => setMostrarDrive(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ◀
                  </button>
                  <h4 className="text-sm font-bold text-gray-700">☁️ Subir a Google Drive</h4>
                </div>
                <button
                  onClick={() => handleExportar('excel', 'drive')}
                  className="w-full px-4 py-3 text-left hover:bg-white flex items-center gap-2 rounded-lg border-b border-yellow-100 text-sm"
                >
                  <span className="text-green-600">📊</span>
                  <span>{getBotonTexto('excel', 'drive')}</span>
                </button>
                <button
                  onClick={() => handleExportar('word', 'drive')}
                  className="w-full px-4 py-3 text-left hover:bg-white flex items-center gap-2 rounded-lg text-sm"
                >
                  <span className="text-blue-600">📝</span>
                  <span>{getBotonTexto('word', 'drive')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// NUEVO COMPONENTE: Hábitos y Aptitudes MEJORADO
const HabitosAptitudes = ({ estudiantes, claseSeleccionada, onActualizarHabitos, trackEvent }) => {
  const [habitosEstudiantes, setHabitosEstudiantes] = useState({});
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  // Inicializar hábitos desde los datos de los estudiantes
  useEffect(() => {
    const habitosIniciales = {};
    estudiantes.forEach(estudiante => {
      // Por defecto, todos los estudiantes tienen 'S' (Excelente) cada día
      habitosIniciales[estudiante.id] = 'S';
    });
    setHabitosEstudiantes(habitosIniciales);
  }, [estudiantes, fechaSeleccionada]);

  // Verificar si es día hábil
  const esDiaHabilSeleccionado = esDiaHabil(new Date(fechaSeleccionada));

  const handleCambiarHabitos = async (estudianteId, valor) => {
    if (!esDiaHabilSeleccionado) {
      alert('No se pueden modificar hábitos y aptitudes en días no hábiles (fines de semana o feriados)');
      return;
    }

    try {
      // Actualizar estado local
      const nuevosHabitos = {
        ...habitosEstudiantes,
        [estudianteId]: valor
      };
      setHabitosEstudiantes(nuevosHabitos);

      // Track del evento
      trackEvent('habitos_actualizados', {
        estudiante_id: estudianteId,
        valor: valor,
        fecha: fechaSeleccionada
      });

      // Llamar a la función de actualización
      await onActualizarHabitos(estudianteId, valor);
      
    } catch (error) {
      console.error('Error actualizando hábitos:', error);
      trackEvent('error_habitos', {
        error: error.message
      });
      alert('Error al actualizar hábitos y aptitudes');
    }
  };

  const getColorBoton = (estudianteId, valor) => {
    const actual = habitosEstudiantes[estudianteId];
    if (actual === valor) {
      return valor === 'S' ? 'bg-green-600 text-white' :
             valor === 'R' ? 'bg-yellow-600 text-white' :
             valor === 'X' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700';
    }
    return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  };

  const getTextoEstado = (valor) => {
    return valor === 'S' ? 'Excelente' :
           valor === 'R' ? 'Regular' :
           valor === 'X' ? 'Malo' : 'No evaluado';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Activity className="w-8 h-8 text-purple-600" />
          Hábitos y Aptitudes - {claseSeleccionada?.nombre} - {detectarTrimestre()}
        </h2>
        
        <OpcionesExportacion
          datos={JSON.stringify({
            tipo: 'habitos',
            clase: claseSeleccionada?.nombre,
            profesor: claseSeleccionada?.profesor,
            institucion: claseSeleccionada?.institucion,
            fecha: new Date().toLocaleDateString('es-PA'),
            trimestre: detectarTrimestre(),
            estudiantes: estudiantes.map(e => ({
              nombre: e.nombre,
              habitosAptitudes: e.habitosAptitudes || 'No evaluado',
              estado: getTextoEstado(e.habitosAptitudes)
            }))
          })}
          nombreArchivo={`Habitos_Aptitudes_${claseSeleccionada?.nombre.replace(/\s+/g, '_')}_${detectarTrimestre().replace(/\s+/g, '_')}`}
          trackEvent={trackEvent}
        />
      </div>

      {/* Selector de fecha */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">🌟 Sistema de Evaluación</h3>
            <p className="text-gray-600">
              Evalúa los hábitos de estudio, participación en clase, responsabilidad y actitud de cada estudiante.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Fecha de Evaluación:</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
            {!esDiaHabilSeleccionado && (
              <p className="text-sm text-red-600 font-semibold">
                ⚠️ Día no hábil - No se pueden modificar evaluaciones
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-4">
          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
            <span className="text-2xl font-bold text-green-800">S</span>
            <p className="text-sm text-green-700 font-semibold">Excelente</p>
          </div>
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
            <span className="text-2xl font-bold text-yellow-800">R</span>
            <p className="text-sm text-yellow-700 font-semibold">Regular</p>
          </div>
          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
            <span className="text-2xl font-bold text-red-800">X</span>
            <p className="text-sm text-red-700 font-semibold">Malo</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {estudiantes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No hay estudiantes en esta clase</p>
          </div>
        )}

        {estudiantes.map(estudiante => (
          <div key={estudiante.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                  {estudiante.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{estudiante.nombre}</h4>
                  <p className="text-sm text-gray-600">
                    Estado actual: <span className={`font-semibold ${
                      habitosEstudiantes[estudiante.id] === 'S' ? 'text-green-600' :
                      habitosEstudiantes[estudiante.id] === 'R' ? 'text-yellow-600' :
                      habitosEstudiantes[estudiante.id] === 'X' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {getTextoEstado(habitosEstudiantes[estudiante.id])}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => handleCambiarHabitos(estudiante.id, 'S')}
                  disabled={!esDiaHabilSeleccionado}
                  className={`px-4 py-3 rounded-lg font-bold transition ${getColorBoton(estudiante.id, 'S')} ${
                    !esDiaHabilSeleccionado ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  S
                </button>
                <button
                  onClick={() => handleCambiarHabitos(estudiante.id, 'R')}
                  disabled={!esDiaHabilSeleccionado}
                  className={`px-4 py-3 rounded-lg font-bold transition ${getColorBoton(estudiante.id, 'R')} ${
                    !esDiaHabilSeleccionado ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  R
                </button>
                <button
                  onClick={() => handleCambiarHabitos(estudiante.id, 'X')}
                  disabled={!esDiaHabilSeleccionado}
                  className={`px-4 py-3 rounded-lg font-bold transition ${getColorBoton(estudiante.id, 'X')} ${
                    !esDiaHabilSeleccionado ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  X
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de evaluación */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h4 className="text-lg font-bold text-blue-900 mb-4">📊 Resumen de Evaluación - {fechaSeleccionada}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 border-2 border-green-200">
            <p className="text-2xl font-bold text-green-600">
              {Object.values(habitosEstudiantes).filter(h => h === 'S').length}
            </p>
            <p className="text-sm text-green-800">Excelente (S)</p>
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">
              {Object.values(habitosEstudiantes).filter(h => h === 'R').length}
            </p>
            <p className="text-sm text-yellow-800">Regular (R)</p>
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-red-200">
            <p className="text-2xl font-bold text-red-600">
              {Object.values(habitosEstudiantes).filter(h => h === 'X').length}
            </p>
            <p className="text-sm text-red-800">Malo (X)</p>
          </div>
        </div>
        {!esDiaHabilSeleccionado && (
          <div className="mt-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 text-center">
            <p className="text-yellow-800 font-semibold">
              📅 Hoy es día no hábil. Las evaluaciones están bloqueadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AsistenteProfesor() {
  // === SISTEMA DE ANALYTICS INTEGRADO ===
  const { trackPageView, trackEvent, setUserAnalytics } = useAnalytics();
  
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
 const [mostrarSuscripcion, setMostrarSuscripcion] = useState(false);
const { 
  tienePremium, 
  diasRestantes, 
  enPrueba, 
  cargando: cargandoPremium,
  puedeCrearClase,
  esVistaDisponible,
  activarSuscripcion
} = usePremium(usuario, clases);

// Función que SÍ funciona
const abrirModalSuscripcion = () => {
  console.log("🔓 Abriendo modal de suscripción");
  setMostrarSuscripcion(true);
};

const [nombreClase, setNombreClase] = useState('');
const [grado, setGrado] = useState('');
const [seccion, setSeccion] = useState('');
const [nombreProfesorClase, setNombreProfesorClase] = useState('');
const [institucionClase, setInstitucionClase] = useState('');
const [estudiantes, setEstudiantes] = useState([]);
const [nombreEstudiante, setNombreEstudiante] = useState('');
const [expandido, setExpandido] = useState({});
const [fechaActual, setFechaActual] = useState(new Date().toISOString().split('T')[0]);
const [tituloEvaluacion, setTituloEvaluacion] = useState(''); const [nombreProfesor, setNombreProfesor] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [gradoPlan, setGradoPlan] = useState('');
  const [materia, setMateria] = useState('');
  const [trimestre, setTrimestre] = useState(detectarTrimestre());
  const [planGenerado, setPlanGenerado] = useState(null);
  const [generandoPlan, setGenerandoPlan] = useState(false);

  // Estado para búsqueda de estudiantes
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');

  // NUEVO ESTADO: Modal de confirmación para retirar estudiante
  const [mostrarModalRetiro, setMostrarModalRetiro] = useState(false);
  const [estudianteARetirar, setEstudianteARetirar] = useState(null);

  // === ANALYTICS: Track page views ===
  useEffect(() => {
    const screenName = getScreenName(view);
    trackPageView(screenName, {
      user_id: usuario?.uid,
      user_email: usuario?.email,
      clase_activa: claseSeleccionada?.nombre || 'ninguna'
    });
  }, [view, usuario, claseSeleccionada]);

  // === ANALYTICS: Set user properties ===
  useEffect(() => {
    setUserAnalytics(usuario);
  }, [usuario]);

  const getScreenName = (currentView) => {
    const screenMap = {
      'home': 'Inicio',
      'clase': 'Gestión de Clase', 
      'asistencia': 'Registro de Asistencia',
      'calificaciones': 'Gestión de Calificaciones',
      'habitos': 'Hábitos y Aptitudes',
      'porcentajes': 'Cuadro de Porcentajes',
      'progreso': 'Tablero de Progreso',
      'planificacion': 'Planificación con IA'
    };
    return screenMap[currentView] || currentView;
  };

  // Efecto para manejar el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userData = { 
          email: user.email, 
          nombre: user.displayName || user.email.split('@')[0],
          uid: user.uid 
        };
        setUsuario(userData);
        
        // Track del login exitoso
        trackEvent('login_exitoso', {
          user_id: user.uid,
          email: user.email
        });
        
        cargarClases(user.uid);
      } else {
        setUsuario(null);
        setClases([]);
        
        // Track del logout
        trackEvent('logout');
      }
    });
    return () => unsubscribe();
  }, []);

  // Actualizar trimestre automáticamente
  useEffect(() => {
    setTrimestre(detectarTrimestre());
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
      
      // Track de carga de clases
      trackEvent('clases_cargadas', {
        cantidad_clases: clasesData.length
      });
    } catch (error) {
      console.error('Error cargando clases:', error);
      trackEvent('error_carga_clases', {
        error: error.message
      });
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
      const userData = { 
        email: userCredential.user.email, 
        nombre: nombreUsuario,
        uid: userCredential.user.uid 
      };
      setUsuario(userData);
      setMostrarRegistro(false);
      
      // Track del registro exitoso
      trackEvent('registro_exitoso', {
        user_id: userCredential.user.uid,
        email: userCredential.user.email,
        nombre: nombreUsuario
      });
      
      limpiarFormulariosAuth();
    } catch (error) {
      let errorMessage = 'Error al registrar: ' + error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo ya está registrado';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      }
      setErrorAuth(errorMessage);
      
      // Track del error de registro
      trackEvent('registro_error', {
        error: error.code,
        email: email
      });
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
      const userData = { 
        email: userCredential.user.email, 
        nombre: userCredential.user.displayName || userCredential.user.email.split('@')[0],
        uid: userCredential.user.uid 
      };
      setUsuario(userData);
      setMostrarLogin(false);
      
      // Track del login exitoso
      trackEvent('login_exitoso', {
        user_id: userCredential.user.uid,
        email: userCredential.user.email
      });
      
      limpiarFormulariosAuth();
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión: ' + error.message;
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      }
      setErrorAuth(errorMessage);
      
      // Track del error de login
      trackEvent('login_error', {
        error: error.code,
        email: email
      });
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
      
      // Track del logout
      trackEvent('logout_manual');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      trackEvent('logout_error', {
        error: error.message
      });
    }
  };

  const limpiarFormulariosAuth = () => {
    setEmail('');
    setPassword('');
    setNombreUsuario('');
    setConfirmarPassword('');
    setErrorAuth('');
  };

  // FUNCIÓN NUEVA: Abrir modal de confirmación para retirar estudiante
  const abrirModalRetiro = (estudiante) => {
    setEstudianteARetirar(estudiante);
    setMostrarModalRetiro(true);
    
    // Track del intento de retiro
    trackEvent('retiro_estudiante_intento', {
      estudiante: estudiante.nombre,
      clase: claseSeleccionada?.nombre
    });
  };

  // FUNCIÓN NUEVA: Cerrar modal de confirmación
  const cerrarModalRetiro = () => {
    setMostrarModalRetiro(false);
    setEstudianteARetirar(null);
  };

  // FUNCIÓN NUEVA: Confirmar retiro de estudiante
  const confirmarRetiroEstudiante = async () => {
    if (!estudianteARetirar) return;
    
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteARetirar.id) {
          return {
            ...e,
            retirado: true,
            fechaRetiro: new Date().toISOString().split('T')[0]
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
      
      // Track del retiro exitoso
      trackEvent('estudiante_retirado', {
        estudiante: estudianteARetirar.nombre,
        clase: claseSeleccionada?.nombre
      });
      
      alert('Estudiante marcado como retirado');
      cerrarModalRetiro();
    } catch (error) {
      console.error('Error retirando estudiante:', error);
      trackEvent('error_retiro_estudiante', {
        error: error.message
      });
      alert('Error al retirar estudiante');
    }
  };

  // FUNCIÓN MEJORADA: Generar plan trimestral
  const generarPlanConOpenAI = async () => {
    if (!nombreProfesor.trim() || !institucion.trim() || !gradoPlan.trim() || !materia.trim() || !trimestre.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setGenerandoPlan(true);

    // Track del inicio de generación
    trackEvent('generacion_plan_iniciada', {
      materia: materia,
      grado: gradoPlan,
      trimestre: trimestre
    });

    try {
      const BACKEND_URL = 'https://bringo-edu-backend-2.onrender.com/api/generate-plan';

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
          trimestre,
          incluirDesarrolloClases: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status} del servidor`);
      }

      const data = await response.json();
      
      if (!data.contenidos || !Array.isArray(data.contenidos) || data.contenidos.length === 0) {
        alert('El servicio de IA no generó contenido. Intenta nuevamente.');
        return;
      }
      
      setPlanGenerado({
        ...data,
        fecha: data.fecha || new Date().toLocaleDateString('es-PA'),
        generadoPorIA: true
      });

      // Track de generación exitosa
      trackEvent('generacion_plan_exitosa', {
        materia: materia,
        grado: gradoPlan,
        cantidad_contenidos: data.contenidos?.length || 0
      });

    } catch (error) {
      console.error('❌ Error al generar plan:', error);
      
      // Track del error
      trackEvent('generacion_plan_error', {
        error: error.message,
        materia: materia
      });
      
      alert(`Error al generar el plan: ${error.message}`);
    } finally {
      setGenerandoPlan(false);
    }
  };

  // FUNCIÓN MEJORADA: Descargar plan trimestral con múltiples formatos
  const descargarPlan = (formato = 'txt') => {
    if (!planGenerado) return;

    // Track de la descarga
    trackEvent('plan_descargado', {
      formato: formato,
      materia: planGenerado.asignatura || materia,
      trimestre: planGenerado.trimestre || trimestre
    });

    let contenido = `PLAN TRIMESTRAL - BRINGO EDU\n`;
    contenido += `${'='.repeat(80)}\n\n`;
    
    contenido += `INFORMACIÓN GENERAL\n`;
    contenido += `-`.repeat(80) + `\n`;
    contenido += `Profesor: ${planGenerado.docente || planGenerado.profesor || nombreProfesor}\n`;
    contenido += `Institución: ${planGenerado.institucion}\n`;
    contenido += `Grado: ${planGenerado.grado || gradoPlan}\n`;
    contenido += `Asignatura: ${planGenerado.asignatura || planGenerado.materia || materia}\n`;
    contenido += `Trimestre: ${planGenerado.trimestre || trimestre}\n`;
    contenido += `Año Escolar: ${planGenerado.anioEscolar || new Date().getFullYear()}\n`;
    contenido += `Duración: ${planGenerado.duracionSemanas || '10-12'} semanas\n`;
    contenido += `Fecha de generación: ${planGenerado.fecha || new Date().toLocaleDateString('es-PA')}\n\n`;

    if (planGenerado.contenidos && Array.isArray(planGenerado.contenidos) && planGenerado.contenidos.length > 0) {
      contenido += `CONTENIDOS DEL TRIMESTRE\n`;
      contenido += `-`.repeat(80) + `\n`;
      planGenerado.contenidos.forEach((cont, i) => {
        contenido += `${i + 1}. ${cont}\n`;
      });
      contenido += `\n`;
    }

    // Desarrollo del Contenido para Clases
    if (planGenerado.desarrolloClases && Object.keys(planGenerado.desarrolloClases).length > 0) {
      contenido += `DESARROLLO DEL CONTENIDO PARA CLASES\n`;
      contenido += `-`.repeat(80) + `\n`;
      Object.entries(planGenerado.desarrolloClases).forEach(([contenidoKey, desarrollo]) => {
        contenido += `\n📝 ${contenidoKey}:\n`;
        contenido += `Duración: ${desarrollo.duracion || '3 sesiones de 45 minutos'}\n\n`;
        
        if (desarrollo.objetivos && desarrollo.objetivos.length > 0) {
          contenido += `Objetivos de Aprendizaje:\n`;
          desarrollo.objetivos.forEach(objetivo => {
            contenido += `- ${objetivo}\n`;
          });
          contenido += `\n`;
        }

        if (desarrollo.materiales && desarrollo.materiales.length > 0) {
          contenido += `Materiales necesarios:\n`;
          desarrollo.materiales.forEach(material => {
            contenido += `- ${material}\n`;
          });
          contenido += `\n`;
        }

        if (desarrollo.fases && desarrollo.fases.length > 0) {
          contenido += `Fases de la actividad:\n`;
          desarrollo.fases.forEach((fase, index) => {
            contenido += `\nSESIÓN ${index + 1} - ${fase.titulo || 'Desarrollo'}\n`;
            if (fase.actividades) {
              fase.actividades.forEach(actividad => {
                contenido += `${actividad.tiempo}: ${actividad.descripcion}\n`;
              });
            }
          });
          contenido += `\n`;
        }
        contenido += `-`.repeat(40) + `\n`;
      });
    }

    if (planGenerado.competencias && Array.isArray(planGenerado.competencias) && planGenerado.competencias.length > 0) {
      contenido += `COMPETENCIAS A DESARROLLAR\n`;
      contenido += `-`.repeat(80) + `\n`;
      planGenerado.competencias.forEach((comp, i) => {
        contenido += `${i + 1}. ${comp}\n`;
      });
      contenido += `\n`;
    }

    if (planGenerado.indicadoresLogro && Array.isArray(planGenerado.indicadoresLogro) && planGenerado.indicadoresLogro.length > 0) {
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

    if (planGenerado.recursos && Array.isArray(planGenerado.recursos) && planGenerado.recursos.length > 0) {
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
   
    if (planGenerado.adaptaciones && Array.isArray(planGenerado.adaptaciones) && planGenerado.adaptaciones.length > 0) {
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
    elemento.download = `Plan_Trimestral_${
      planGenerado.asignatura || 
      planGenerado.materia || 
      materia || 
      'Asignatura'
    }_${
      (planGenerado.trimestre || trimestre || 'Trimestre')
      .replace(/\s+/g, '_')
    }.txt`;
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
  };

  // FUNCIÓN MEJORADA: Agregar clase con nuevos campos
  const agregarClase = async () => {
    if (!usuario) {
      alert('Debes iniciar sesión para crear clases');
      setMostrarLogin(true);
      return;
    }

    if (!nombreClase.trim() || !grado.trim() || !seccion.trim() || !nombreProfesorClase.trim() || !institucionClase.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      const nuevaClase = {
        nombre: `${nombreClase} ${grado}${seccion}`,
        grado,
        seccion,
        materia: nombreClase,
        profesor: nombreProfesorClase,
        institucion: institucionClase,
        estudiantes: [],
        userId: usuario.uid,
        fechaCreacion: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'clases'), nuevaClase);
      setClases([...clases, { id: docRef.id, ...nuevaClase }]);
      
      // Track de la creación de clase
      trackEvent('clase_creada', {
        clase_id: docRef.id,
        nombre_clase: nuevaClase.nombre,
        materia: nombreClase,
        grado: grado,
        seccion: seccion
      });
      
      setNombreClase('');
      setGrado('');
      setSeccion('');
      setNombreProfesorClase('');
      setInstitucionClase('');
      
    } catch (error) {
      console.error('❌ Error agregando clase:', error);
      trackEvent('error_creacion_clase', {
        error: error.message
      });
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
        
        // Track de la eliminación
        trackEvent('clase_eliminada', {
          clase_id: id
        });
      } catch (error) {
        console.error('Error eliminando clase:', error);
        trackEvent('error_eliminacion_clase', {
          error: error.message
        });
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
    
    // Track de la selección de clase
    trackEvent('clase_seleccionada', {
      clase_id: clase.id,
      nombre_clase: clase.nombre,
      cantidad_estudiantes: clase.estudiantes?.length || 0
    });
  };

  // FUNCIÓN MEJORADA: Agregar estudiante
  const agregarEstudiante = async () => {
    if (!nombreEstudiante.trim()) {
      alert('Ingresa el nombre del estudiante');
      return;
    }
    
    try {
      const nuevoEstudiante = {
        id: Date.now().toString(),
        nombre: nombreEstudiante,
        calificacionesDiarias: [],
        apreciacion: [],
        examen: [],
        asistencia: {},
        habitosAptitudes: '',
        retirado: false
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
      
      // Track del estudiante agregado
      trackEvent('estudiante_agregado', {
        estudiante: nombreEstudiante,
        clase: claseSeleccionada?.nombre,
        total_estudiantes: nuevosEstudiantes.length
      });
      
      setNombreEstudiante('');
    } catch (error) {
      console.error('Error agregando estudiante:', error);
      trackEvent('error_agregar_estudiante', {
        error: error.message
      });
      alert('Error al agregar estudiante');
    }
  };

  // FUNCIÓN MEJORADA: Marcar asistencia con nuevos estados y valor por defecto
  const marcarAsistencia = async (estudianteId, fecha, estado) => {
    // Verificar si es día hábil
    if (!esDiaHabil(new Date(fecha))) {
      alert('No se puede marcar asistencia en días no hábiles (fines de semana o feriados)');
      return;
    }

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
      
      // Track de la asistencia
      trackEvent('asistencia_marcada', {
        estudiante_id: estudianteId,
        fecha: fecha,
        estado: estado,
        clase: claseSeleccionada?.nombre
      });
    } catch (error) {
      console.error('Error marcando asistencia:', error);
      trackEvent('error_asistencia', {
        error: error.message
      });
    }
  };

  // FUNCIÓN CORREGIDA: Agregar calificación - CON VALIDACIONES
  const agregarCalificacion = async (estudianteId, seccion, valor = '', fecha = new Date().toISOString().split('T')[0], titulo = tituloEvaluacion) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          const nuevaCalificacion = {
            valor: valor ? parseFloat(valor) : '',
            fecha: fecha,
            titulo: titulo || 'Sin título'
          };
          
          // Asegurarse de que la sección existe
          const seccionActual = e[seccion] || [];
          return {
            ...e,
            [seccion]: [...seccionActual, nuevaCalificacion]
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
      console.error('Error agregando calificación:', error);
      trackEvent('error_calificacion', {
        error: error.message
      });
      alert('Error al agregar calificación');
    }
  };

  const actualizarCalificacion = async (estudianteId, seccion, indice, campo, valor) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          const seccionActual = e[seccion] || [];
          const nuevasCalificaciones = [...seccionActual];
          if (nuevasCalificaciones[indice]) {
            nuevasCalificaciones[indice] = { ...nuevasCalificaciones[indice], [campo]: valor };
          }
          return {
            ...e,
            [seccion]: nuevasCalificaciones
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
      console.error('Error actualizando calificación:', error);
      trackEvent('error_actualizar_calificacion', {
        error: error.message
      });
    }
  };

  const eliminarCalificacion = async (estudianteId, seccion, indice) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          const seccionActual = e[seccion] || [];
          const nuevasCalificaciones = seccionActual.filter((_, i) => i !== indice);
          return {
            ...e,
            [seccion]: nuevasCalificaciones
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
      console.error('Error eliminando calificación:', error);
      trackEvent('error_eliminar_calificacion', {
        error: error.message
      });
    }
  };

  // FUNCIÓN NUEVA: Actualizar hábitos y aptitudes
  const actualizarHabitos = async (estudianteId, valor) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          return {
            ...e,
            habitosAptitudes: valor
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
      console.error('Error actualizando hábitos:', error);
      trackEvent('error_actualizar_habitos', {
        error: error.message
      });
      throw error;
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
      
      // Track de la eliminación
      trackEvent('estudiante_eliminado', {
        estudiante_id: id,
        clase: claseSeleccionada?.nombre
      });
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      trackEvent('error_eliminar_estudiante', {
        error: error.message
      });
      alert('Error al eliminar estudiante');
    }
  };

  // FUNCIÓN CORREGIDA: Contar asistencias con validaciones
  const contarAsistencias = (estudiante) => {
    const registros = estudiante.asistencia || {};
    const presente = Object.values(registros).filter(v => v === 'presente').length;
    const ausente = Object.values(registros).filter(v => v === 'ausente').length;
    const tardanza = Object.values(registros).filter(v => v === 'tardanza').length;
    const fuga = Object.values(registros).filter(v => v === 'fuga').length;
    const ausenciaJustificada = Object.values(registros).filter(v => v === 'ausenciaJustificada').length;
    return { presente, ausente, tardanza, fuga, ausenciaJustificada };
  };

  // FUNCIÓN CORREGIDA: Calcular total de sección con validaciones
  const calcularTotalSeccion = (calificaciones) => {
    if (!calificaciones || !Array.isArray(calificaciones) || calificaciones.length === 0) return 0;
    const numeros = calificaciones.map(n => {
      const valor = typeof n === 'object' ? parseFloat(n.valor) : parseFloat(n);
      return isNaN(valor) ? 0 : valor;
    }).filter(v => v > 0);
    if (numeros.length === 0) return 0;
    return (numeros.reduce((a, b) => a + b, 0) / numeros.length).toFixed(2);
  };

  // FUNCIÓN CORREGIDA: Calcular promedio final con validaciones
  const calcularPromedioFinal = (estudiante) => {
    // Asegurarse de que las propiedades existen
    const calificacionesDiarias = estudiante.calificacionesDiarias || [];
    const apreciacion = estudiante.apreciacion || [];
    const examen = estudiante.examen || [];
    
    const totalDiarias = parseFloat(calcularTotalSeccion(calificacionesDiarias)) || 0;
    const totalApreciacion = parseFloat(calcularTotalSeccion(apreciacion)) || 0;
    const totalExamen = parseFloat(calcularTotalSeccion(examen)) || 0;
    
    const totales = [totalDiarias, totalApreciacion, totalExamen].filter(t => t > 0);
    if (totales.length === 0) return 0;
    
    return ((totalDiarias + totalApreciacion + totalExamen) / 3).toFixed(2);
  };

  const toggleExpansion = (estudianteId) => {
    setExpandido(prev => ({
      ...prev,
      [estudianteId]: !prev[estudianteId]
    }));
    
    // Track de la expansión
    trackEvent('estudiante_expandido', {
      estudiante_id: estudianteId,
      expandido: !expandido[estudianteId]
    });
  };

  // FUNCIÓN CORREGIDA: Buscar y redirigir estudiante
  const buscarYRedirigirEstudiante = (estudiante) => {
    // Si estamos en home, vamos a calificaciones
    if (view === 'home') {
      setView('calificaciones');
    }
    
    // Expandir la sección del estudiante
    setExpandido(prev => ({
      ...prev,
      [estudiante.id]: true
    }));
    
    // Track de la búsqueda exitosa
    trackEvent('busqueda_estudiante_exitosa', {
      estudiante: estudiante.nombre,
      clase: estudiante.claseNombre
    });
    
    // Scroll a la sección del estudiante
    setTimeout(() => {
      const elemento = document.getElementById(`estudiante-${estudiante.id}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Resaltar temporalmente
        elemento.classList.add('bg-yellow-100');
        setTimeout(() => {
          elemento.classList.remove('bg-yellow-100');
        }, 2000);
      }
    }, 500);
    
    setBusquedaEstudiante('');
  };

  const estudiantesEnRiesgo = estudiantes.filter(e => parseFloat(calcularPromedioFinal(e)) < 3.0 && parseFloat(calcularPromedioFinal(e)) > 0);

  // FUNCIÓN CORREGIDA: Promedio general con validaciones
  const promedioGeneral = () => {
    const promedios = estudiantes.map(e => parseFloat(calcularPromedioFinal(e))).filter(p => p > 0);
    if (promedios.length === 0) return 0;
    return (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(1);
  };

  // FUNCIONES PARA LA VISTA DE PROGRESO CORREGIDAS
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

  // FUNCIÓN CORREGIDA: Exportar datos de progreso
  const exportarProgreso = (formato) => {
    const datosProgreso = {
      tipo: 'progreso',
      clase: claseSeleccionada?.nombre,
      profesor: claseSeleccionada?.profesor || nombreProfesorClase,
      institucion: claseSeleccionada?.institucion || institucionClase,
      fecha: new Date().toLocaleDateString('es-PA'),
      trimestre: detectarTrimestre(),
      promedioGeneral: promedioGeneral(),
      totalEstudiantes: estudiantes.length,
      estudiantesEnRiesgo: estudiantesEnRiesgo.length,
      ranking: obtenerRankingEstudiantes(),
      distribucion: calcularDistribucionNotas(),
      estudiantes: estudiantes.map(e => ({
        nombre: e.nombre,
        calificacionesDiarias: e.calificacionesDiarias || [],
        apreciacion: e.apreciacion || [],
        examen: e.examen || [],
        promedioFinal: calcularPromedioFinal(e),
        asistencia: e.asistencia || {},
        habitosAptitudes: e.habitosAptitudes || 'No evaluado'
      }))
    };

    const nombreArchivo = `Tablero_Progreso_${claseSeleccionada?.nombre.replace(/\s+/g, '_')}_${detectarTrimestre().replace(/\s+/g, '_')}`;

    switch (formato) {
      case 'excel':
        exportarAExcel(datosProgreso, nombreArchivo, trackEvent);
        break;
      case 'word':
        exportarAWord(datosProgreso, nombreArchivo, trackEvent);
        break;
      case 'drive':
        subirAGoogleDrive(datosProgreso, nombreArchivo, 'excel', trackEvent);
        break;
      default:
        break;
    }
  };

  // FUNCIÓN CORREGIDA: Calcular distribución de notas
  const calcularDistribucionNotas = () => {
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
        trackEvent={trackEvent}
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
        trackEvent={trackEvent}
      />

      {/* NUEVO MODAL: Confirmación para retirar estudiante */}
      <ModalConfirmacionRetiro
        mostrar={mostrarModalRetiro}
        onCerrar={cerrarModalRetiro}
        onConfirmar={confirmarRetiroEstudiante}
        estudiante={estudianteARetirar}
      />

      {/* HEADER MEJORADO */}
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
                  onClick={() => {
                    setMostrarLogin(true);
                    trackEvent('boton_login_click');
                  }}
                  className="flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg transition font-semibold"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </button>
                <button
                  onClick={() => {
                    setMostrarRegistro(true);
                    trackEvent('boton_registro_click');
                  }}
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

      {/* NAVEGACIÓN PREMIUM */}
<NavegacionPremium
  view={view}
  setView={setView}
  tienePremium={tienePremium}
  onUpgrade={abrirModalSuscripcion}
  trackEvent={trackEvent}
/>

{/* BANNER UPGRADE */}
{usuario && (
  <BannerUpgrade
    diasRestantes={diasRestantes}
    onUpgrade={() => setMostrarSuscripcion(true)}
    trackEvent={trackEvent}
  />
)}

      {/* ✅ BARRA DE BÚSQUEDA DE ESTUDIANTES - AHORA FUERA DEL CUADRO DE CLASES, JUSTO DEBAJO DE LAS PESTAÑAS */}
      {usuario && clases.length > 0 && (
        <div className="container mx-auto px-4 pt-4">
          <BarraBusquedaEstudiantes
            clases={clases}
            onBuscarEstudiante={buscarYRedirigirEstudiante}
            busquedaEstudiante={busquedaEstudiante}
            setBusquedaEstudiante={setBusquedaEstudiante}
            trackEvent={trackEvent}
          />
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {view === 'home' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="text-4xl">🏫</span>
                Mis Clases - {detectarTrimestre()}
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
                          onClick={() => {
                            setMostrarLogin(true);
                            trackEvent('cta_login_desde_home');
                          }}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
                        >
                          Iniciar Sesión
                        </button>
                        <button
                          onClick={() => {
                            setMostrarRegistro(true);
                            trackEvent('cta_registro_desde_home');
                          }}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <input
                      type="text"
                      placeholder="Nombre del Profesor"
                      value={nombreProfesorClase}
                      onChange={(e) => setNombreProfesorClase(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Institución Educativa"
                      value={institucionClase}
                      onChange={(e) => setInstitucionClase(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={agregarClase}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Crear Clase
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
                        <p className="text-purple-100 text-sm mt-1">Prof: {clase.profesor}</p>
                        <p className="text-purple-100 text-sm">Inst: {clase.institucion}</p>
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
                {claseSeleccionada.nombre} - {detectarTrimestre()}
              </h2>
              <button
                onClick={() => {
                  setClaseSeleccionada(null);
                  setView('home');
                  trackEvent('volver_inicio_desde_clase');
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
                          {estudiante.retirado && <span className="ml-2 text-red-600 font-semibold">(RETIRADO)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                      {/* BOTÓN MODIFICADO: Ahora abre modal de confirmación en lugar de retirar directamente */}
                      <button
                        onClick={() => abrirModalRetiro(estudiante)}
                        className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition"
                        title="Retirar estudiante"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar a ${estudiante.nombre}?`)) {
                            eliminarEstudiante(estudiante.id);
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'asistencia' && claseSeleccionada && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flexRow justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                Asistencia - {claseSeleccionada.nombre} - {detectarTrimestre()}
              </h2>
              <div className="flex gap-4">
                <input
                  type="date"
                  value={fechaActual}
                  onChange={(e) => setFechaActual(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <OpcionesExportacion
                  datos={JSON.stringify({
                    tipo: 'asistencia',
                    clase: claseSeleccionada.nombre,
                    profesor: claseSeleccionada.profesor,
                    institucion: claseSeleccionada.institucion,
                    fecha: fechaActual,
                    trimestre: detectarTrimestre(),
                    estudiantes: estudiantes.map(e => ({
                      nombre: e.nombre,
                      asistencia: e.asistencia || {},
                      ...contarAsistencias(e)
                    }))
                  })}
                  nombreArchivo={`Asistencia_${claseSeleccionada.nombre.replace(/\s+/g, '_')}_${fechaActual}`}
                  trackEvent={trackEvent}
                />
              </div>
            </div>

            {/* Indicador de día hábil */}
            {!esDiaHabil(new Date(fechaActual)) && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <h3 className="font-bold text-yellow-800">Día no hábil</h3>
                    <p className="text-yellow-700 text-sm">
                      Hoy es {new Date(fechaActual).toLocaleDateString('es-PA', { weekday: 'long' })}. 
                      No se puede marcar asistencia en fines de semana o feriados.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {estudiantes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No hay estudiantes en esta clase</p>
                </div>
              )}
              
              {estudiantes.map(estudiante => {
                const asist = contarAsistencias(estudiante);
                const estadoHoy = estudiante.asistencia?.[fechaActual];
                const esDiaHabilHoy = esDiaHabil(new Date(fechaActual));
                
                return (
                  <div key={estudiante.id} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 mb-2">{estudiante.nombre}</h4>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600 font-semibold">✓ {asist.presente}P</span>
                          <span className="text-yellow-600 font-semibold">⏰ {asist.tardanza}T</span>
                          <span className="text-red-600 font-semibold">✗ {asist.ausente}A</span>
                          <span className="text-orange-600 font-semibold">🏃 {asist.fuga}F</span>
                          <span className="text-blue-600 font-semibold">📝 {asist.ausenciaJustificada}AJ</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap mt-4 md:mt-0">
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'presente')}
                          disabled={!esDiaHabilHoy}
                          className={`px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold transition text-xs md:text-sm ${
                            estadoHoy === 'presente'
                              ? 'bg-green-600 text-white'
                              : esDiaHabilHoy 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'tardanza')}
                          disabled={!esDiaHabilHoy}
                          className={`px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold transition text-xs md:text-sm ${
                            estadoHoy === 'tardanza'
                              ? 'bg-yellow-600 text-white'
                              : esDiaHabilHoy 
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Tardanza
                        </button>
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'ausente')}
                          disabled={!esDiaHabilHoy}
                          className={`px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold transition text-xs md:text-sm ${
                            estadoHoy === 'ausente'
                              ? 'bg-red-600 text-white'
                              : esDiaHabilHoy 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Ausente
                        </button>
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'fuga')}
                          disabled={!esDiaHabilHoy}
                          className={`px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold transition text-xs md:text-sm ${
                            estadoHoy === 'fuga'
                              ? 'bg-orange-600 text-white'
                              : esDiaHabilHoy 
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Fuga
                        </button>
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'ausenciaJustificada')}
                          disabled={!esDiaHabilHoy}
                          className={`px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold transition text-xs md:text-sm ${
                            estadoHoy === 'ausenciaJustificada'
                              ? 'bg-blue-600 text-white'
                              : esDiaHabilHoy 
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Aus. Just.
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'calificaciones' && claseSeleccionada && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-purple-600" />
                Calificaciones - {claseSeleccionada.nombre} - {detectarTrimestre()}
              </h2>
              <div className="flex gap-4 flex-wrap">
                <div className="bg-purple-100 px-4 md:px-6 py-3 rounded-lg">
                  <span className="text-xs md:text-sm text-purple-600 font-semibold">Promedio:</span>
                  <span className="ml-2 text-xl md:text-2xl font-bold text-purple-800">{promedioGeneral()}/5</span>
                </div>

                <OpcionesExportacion
                  datos={JSON.stringify({
                    tipo: 'calificaciones',
                    clase: claseSeleccionada.nombre,
                    profesor: claseSeleccionada.profesor,
                    institucion: claseSeleccionada.institucion,
                    fecha: new Date().toLocaleDateString('es-PA'),
                    trimestre: detectarTrimestre(),
                    promedioGeneral: promedioGeneral(),
                    totalEstudiantes: estudiantes.length,
                    estudiantesEnRiesgo: estudiantesEnRiesgo.length,
                    distribucion: calcularDistribucionNotas(),
                    estudiantes: estudiantes.map(e => ({
                      nombre: e.nombre,
                      calificacionesDiarias: e.calificacionesDiarias || [],
                      apreciacion: e.apreciacion || [],
                      examen: e.examen || [],
                      promedioFinal: calcularPromedioFinal(e)
                    }))
                  })}
                  nombreArchivo={`Calificaciones_${claseSeleccionada.nombre.replace(/\s+/g, '_')}_${detectarTrimestre().replace(/\s+/g, '_')}`}
                  trackEvent={trackEvent}
                />
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
            
            {/* CUADRÍCULA DE CALIFICACIONES RÁPIDAS - MEJORADA CON TÍTULO DE EVALUACIÓN */}
            {estudiantes.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📊 Registro Rápido de Calificaciones - {new Date().toLocaleDateString('es-PA')}
                </h3>
                
                {/* CAMPO DE TÍTULO DE EVALUACIÓN GLOBAL */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-200">
                  <label className="block text-sm font-bold text-blue-800 mb-2">
                    📝 Título de Evaluación (aplicará a TODAS las calificaciones de hoy)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Evaluación de fracciones, Quiz de historia, etc."
                    value={tituloEvaluacion}
                    onChange={(e) => setTituloEvaluacion(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Este título se aplicará automáticamente a todas las calificaciones que agregues hoy.
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead className="bg-purple-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Estudiante</th>
                        <th className="px-4 py-3 text-center font-semibold">Calificaciones Diarias</th>
                        <th className="px-4 py-3 text-center font-semibold">Apreciación</th>
                        <th className="px-4 py-3 text-center font-semibold">Examen</th>
                        <th className="px-4 py-3 text-center font-semibold">Promedio</th>
                        <th className="px-4 py-3 text-center font-semibold">Compartir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map((estudiante) => (
                        <FilaCalificacionesRapidas
                          key={estudiante.id}
                          estudiante={estudiante}
                          onAgregarCalificacion={agregarCalificacion}
                          calcularPromedioFinal={calcularPromedioFinal}
                          claseSeleccionada={claseSeleccionada}
                          usuario={usuario}
                          actualizarCalificacion={actualizarCalificacion}
                          tituloEvaluacion={tituloEvaluacion}
                          trackEvent={trackEvent}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  💡 Ingresa las calificaciones (0-5) y presiona "+" para agregar. Las calificaciones se guardan automáticamente.
                </p>
              </div>
            )}
            
            {estudiantes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No hay estudiantes en esta clase</p>
              </div>
            )}
            
            <div className="space-y-6">
              {estudiantes.map(estudiante => (
                <div key={estudiante.id} id={`estudiante-${estudiante.id}`} className="border-2 border-gray-200 rounded-xl overflow-hidden transition-all duration-300">
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
                            <span>Diarias: {calcularTotalSeccion(estudiante.calificacionesDiarias)}</span>
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
                          <h5 className="font-bold text-lg text-gray-800">📝 Calificaciones Diarias</h5>
                          <button
                            onClick={() => agregarCalificacion(estudiante.id, 'calificacionesDiarias')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(estudiante.calificacionesDiarias || []).map((calificacion, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg flex gap-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                placeholder="Calificación"
                                value={calificacion.valor || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'calificacionesDiarias', idx, 'valor', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                              />
                              <input
                                type="date"
                                value={calificacion.fecha || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'calificacionesDiarias', idx, 'fecha', e.target.value)}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                              />
                              <input
                                type="text"
                                placeholder="Título"
                                value={calificacion.titulo || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'calificacionesDiarias', idx, 'titulo', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() => eliminarCalificacion(estudiante.id, 'calificacionesDiarias', idx)}
                                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-600">Promedio: </span>
                          <span className="font-bold text-lg text-blue-600">{calcularTotalSeccion(estudiante.calificacionesDiarias)}/5</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-bold text-lg text-gray-800">⭐ Apreciación</h5>
                          <button
                            onClick={() => agregarCalificacion(estudiante.id, 'apreciacion')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(estudiante.apreciacion || []).map((calificacion, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg flex gap-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                placeholder="Calificación"
                                value={calificacion.valor || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'apreciacion', idx, 'valor', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                              />
                              <input
                                type="date"
                                value={calificacion.fecha || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'apreciacion', idx, 'fecha', e.target.value)}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                              />
                              <input
                                type="text"
                                placeholder="Título"
                                value={calificacion.titulo || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'apreciacion', idx, 'titulo', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                              />
                              <button
                                onClick={() => eliminarCalificacion(estudiante.id, 'apreciacion', idx)}
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
                            onClick={() => agregarCalificacion(estudiante.id, 'examen')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-semibold flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(estudiante.examen || []).map((calificacion, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg flex gap-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                placeholder="Calificación"
                                value={calificacion.valor || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'examen', idx, 'valor', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                              />
                              <input
                                type="date"
                                value={calificacion.fecha || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'examen', idx, 'fecha', e.target.value)}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                              />
                              <input
                                type="text"
                                placeholder="Título"
                                value={calificacion.titulo || ''}
                                onChange={(e) => actualizarCalificacion(estudiante.id, 'examen', idx, 'titulo', e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={() => eliminarCalificacion(estudiante.id, 'examen', idx)}
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

        {/* NUEVA VISTA: HÁBITOS Y APTITUDES */}
        {view === 'habitos' && claseSeleccionada && (
          <HabitosAptitudes
            estudiantes={estudiantes}
            claseSeleccionada={claseSeleccionada}
            onActualizarHabitos={actualizarHabitos}
            trackEvent={trackEvent}
          />
        )}

        {/* VISTA DE CUADRO DE PORCENTAJES FUNCIONAL */}
        {view === 'porcentajes' && claseSeleccionada && (
          <CuadroPorcentajes 
            estudiantes={estudiantes} 
            calcularPromedioFinal={calcularPromedioFinal}
            claseSeleccionada={claseSeleccionada}
            trackEvent={trackEvent}
          />
        )}

        {/* VISTA DE PROGRESO MEJORADA */}
        {view === 'progreso' && claseSeleccionada && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                Tablero de Progreso - {claseSeleccionada.nombre} - {detectarTrimestre()}
              </h2>
              <OpcionesExportacion
                datos={JSON.stringify({
                  tipo: 'progreso',
                  clase: claseSeleccionada.nombre,
                  profesor: claseSeleccionada.profesor,
                  institucion: claseSeleccionada.institucion,
                  fecha: new Date().toLocaleDateString('es-PA'),
                  trimestre: detectarTrimestre(),
                  promedioGeneral: promedioGeneral(),
                  totalEstudiantes: estudiantes.length,
                  estudiantesEnRiesgo: estudiantesEnRiesgo.length,
                  ranking: obtenerRankingEstudiantes(),
                  distribucion: calcularDistribucionNotas(),
                  estudiantes: estudiantes.map(e => ({
                    nombre: e.nombre,
                    calificacionesDiarias: e.calificacionesDiarias || [],
                    apreciacion: e.apreciacion || [],
                    examen: e.examen || [],
                    promedioFinal: calcularPromedioFinal(e),
                    asistencia: e.asistencia || {},
                    habitosAptitudes: e.habitosAptitudes || 'No evaluado'
                  }))
                })}
                nombreArchivo={`Tablero_Progreso_${claseSeleccionada.nombre.replace(/\s+/g, '_')}_${detectarTrimestre().replace(/\s+/g, '_')}`}
                onExportar={exportarProgreso}
                trackEvent={trackEvent}
              />
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

            {/* GRÁFICO DE DISTRIBUCIÓN Y RANKING */}
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
                            {(estudiante.calificacionesDiarias?.length || 0) + (estudiante.apreciacion?.length || 0) + (estudiante.examen?.length || 0)} calificaciones
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
                          <p>Total calificaciones: {(estudiante.calificacionesDiarias?.length || 0) + (estudiante.apreciacion?.length || 0) + (estudiante.examen?.length || 0)}</p>
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
                      <th className="px-4 py-3 text-center">Calificaciones Diarias</th>
                      <th className="px-4 py-3 text-center">Apreciación</th>
                      <th className="px-4 py-3 text-center">Examen</th>
                      <th className="px-4 py-3 text-center">Asistencia</th>
                      <th className="px-4 py-3 text-center">Hábitos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map(estudiante => {
                      const asistencia = contarAsistencias(estudiante);
                      const totalAsistencias = asistencia.presente + asistencia.tardanza + asistencia.ausente + asistencia.fuga + asistencia.ausenciaJustificada;
                      const porcentajeAsistencia = totalAsistencias > 0 ? Math.round((asistencia.presente / totalAsistencias) * 100) : 0;
                      
                      const getTextoHabitos = (habitos) => {
                        return habitos === 'S' ? 'Excelente' :
                               habitos === 'R' ? 'Regular' :
                               habitos === 'X' ? 'Malo' : 'No eval.';
                      };

                      const getColorHabitos = (habitos) => {
                        return habitos === 'S' ? 'text-green-600' :
                               habitos === 'R' ? 'text-yellow-600' :
                               habitos === 'X' ? 'text-red-600' : 'text-gray-500';
                      };
                      
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
                            {calcularTotalSeccion(estudiante.calificacionesDiarias)} ({estudiante.calificacionesDiarias?.length || 0})
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {calcularTotalSeccion(estudiante.apreciacion)} ({estudiante.apreciacion?.length || 0})
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {calcularTotalSeccion(estudiante.examen)} ({estudiante.examen?.length || 0})
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${
                              porcentajeAsistencia >= 90 ? 'text-green-600' :
                              porcentajeAsistencia >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {porcentajeAsistencia}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${getColorHabitos(estudiante.habitosAptitudes)}`}>
                              {getTextoHabitos(estudiante.habitosAptitudes)}
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
                      <option value={detectarTrimestre()}>{detectarTrimestre()} (Actual)</option>
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
                    <h3 className="text-2xl font-bold text-gray-800">Plan {planGenerado.trimestre || trimestre}</h3>
                    <p className="text-gray-600 mt-1">
                      {planGenerado.asignatura || planGenerado.materia || materia} - {planGenerado.grado || gradoPlan} | {planGenerado.institucion || institucion}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Profesor: {planGenerado.docente || planGenerado.profesor || nombreProfesor}</p>
                    <p className="text-sm text-gray-500">Trimestre: {planGenerado.trimestre || trimestre} | Fecha: {planGenerado.fecha}</p>
                    {planGenerado.duracionSemanas && (
                      <p className="text-sm text-gray-500">Duración: {planGenerado.duracionSemanas} semanas</p>
                    )}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <OpcionesExportacion
                      datos={JSON.stringify(planGenerado)}
                      nombreArchivo={`Plan_Trimestral_${
                        planGenerado.asignatura || 
                        planGenerado.materia || 
                        materia || 
                        'Asignatura'
                      }_${
                        (planGenerado.trimestre || trimestre || 'Trimestre')
                        .replace(/\s+/g, '_')
                      }`}
                      trackEvent={trackEvent}
                    />
                    <button
                      onClick={() => {
                        setPlanGenerado(null);
                        trackEvent('nuevo_plan_iniciado');
                      }}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-bold"
                    >
                      Nuevo Plan
                    </button>
                  </div>
                </div>
                
                {/* SECCIÓN ACTUALIZADA CON DESARROLLO DE CLASES */}
                {planGenerado.contenidos && Array.isArray(planGenerado.contenidos) && planGenerado.contenidos.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                      📚 Contenidos del {planGenerado.trimestre || trimestre}
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
                
                {/* DESARROLLO DEL CONTENIDO PARA CLASES */}
                {planGenerado.desarrolloClases && Object.keys(planGenerado.desarrolloClases).length > 0 && (
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
                    <h4 className="text-xl font-bold text-teal-900 mb-4 flex items-center gap-2">
                      🎯 Desarrollo del Contenido para Clases
                    </h4>
                    <div className="space-y-6">
                      {Object.entries(planGenerado.desarrolloClases).map(([contenidoKey, desarrollo]) => (
                        <div key={contenidoKey} className="bg-white rounded-lg p-4 border border-teal-100">
                          <h5 className="font-bold text-lg text-teal-800 mb-3">📝 {contenidoKey}</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="font-semibold text-gray-700">Duración:</span>
                              <span className="ml-2 text-teal-600">{desarrollo.duracion || '3 sesiones de 45 minutos'}</span>
                            </div>
                          </div>

                          {desarrollo.objetivos && desarrollo.objetivos.length > 0 && (
                            <div className="mb-3">
                              <h6 className="font-semibold text-gray-700 mb-2">Objetivos de Aprendizaje:</h6>
                              <ul className="space-y-1">
                                {desarrollo.objetivos.map((objetivo, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-teal-500">•</span>
                                    <span className="text-gray-700">{objetivo}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {desarrollo.materiales && desarrollo.materiales.length > 0 && (
                            <div className="mb-3">
                              <h6 className="font-semibold text-gray-700 mb-2">Materiales necesarios:</h6>
                              <ul className="space-y-1">
                                {desarrollo.materiales.map((material, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-teal-500">•</span>
                                    <span className="text-gray-700">{material}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {desarrollo.fases && desarrollo.fases.length > 0 && (
                            <div>
                              <h6 className="font-semibold text-gray-700 mb-2">Fases de la actividad:</h6>
                              <div className="space-y-3">
                                {desarrollo.fases.map((fase, index) => (
                                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                                    <h7 className="font-semibold text-gray-800 mb-2">
                                      SESIÓN {index + 1} - {fase.titulo || 'Desarrollo'}
                                    </h7>
                                    <div className="space-y-2">
                                      {fase.actividades && fase.actividades.map((actividad, actIdx) => (
                                        <div key={actIdx} className="flex gap-2 text-sm">
                                          <span className="font-medium text-teal-600 whitespace-nowrap">
                                            {actividad.tiempo}:
                                          </span>
                                          <span className="text-gray-700">{actividad.descripcion}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
{/* MODAL SUSCRIPCIÓN */}
<ModalSuscripcion
  mostrar={mostrarSuscripcion}
  onCerrar={() => setMostrarSuscripcion(false)}
  onSuscribirse={async (plan) => {
    const exito = await activarSuscripcion(plan);
    if (exito) {
      trackEvent('suscripcion_activada', { plan });
    }
  }}
  trackEvent={trackEvent}
  usuario={usuario}
/>

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