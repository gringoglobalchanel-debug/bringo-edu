import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, AlertCircle, Users, Home, ChevronDown, ChevronUp, ClipboardList, Calendar, Sparkles, User, LogOut, LogIn, TrendingUp, BarChart3, Target, Award, AlertTriangle, Search, Share, Eye, EyeOff } from 'lucide-react';
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

// Componente para Fila de Notas Rápidas - CORREGIDO
const FilaNotasRapidas = ({ estudiante, onAgregarNota, calcularPromedioFinal, claseSeleccionada, usuario, actualizarNota }) => {
  const [notaDiaria, setNotaDiaria] = useState('');
  const [notaApreciacion, setNotaApreciacion] = useState('');
  const [notaExamen, setNotaExamen] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const handleAgregarNota = async (tipo, valor) => {
    if (valor && parseFloat(valor) >= 0 && parseFloat(valor) <= 5) {
      try {
        await onAgregarNota(estudiante.id, tipo, parseFloat(valor), fecha);
        
        // Limpiar el campo
        if (tipo === 'notasDiarias') setNotaDiaria('');
        if (tipo === 'apreciacion') setNotaApreciacion('');
        if (tipo === 'examen') setNotaExamen('');

      } catch (error) {
        console.error('Error agregando nota:', error);
        alert('Error al agregar la nota');
      }
    } else {
      alert('Por favor ingresa una nota válida entre 0 y 5');
    }
  };

  const compartirPorWhatsApp = () => {
    const formatoNotas = (notas) => {
      return notas
        .filter(n => n.valor && parseFloat(n.valor) > 0)
        .map(n => `📅 ${n.fecha}: ${n.valor}/5.0`)
        .join('\n') || '📭 Sin notas registradas';
    };

    const mensaje = `📊 *REPORTE DE NOTAS - ${claseSeleccionada?.nombre}*

*Estudiante:* ${estudiante.nombre}
*Profesor:* ${usuario?.nombre}
*Institución:* ${claseSeleccionada?.institucion || 'Bringo Edu'}
*Fecha de reporte:* ${new Date().toLocaleDateString('es-PA')}

*📝 NOTAS DIARIAS:*
${formatoNotas(estudiante.notasDiarias)}

*⭐ APRECIACIÓN:*
${formatoNotas(estudiante.apreciacion)}

*📋 EXAMEN:*
${formatoNotas(estudiante.examen)}

*🏆 PROMEDIO FINAL:* ${calcularPromedioFinal(estudiante)}/5.0

---
Generado con Bringo Edu 📚 | Transparente y Confiable`;

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
            value={notaDiaria}
            onChange={(e) => setNotaDiaria(e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center"
          />
          <button
            onClick={() => handleAgregarNota('notasDiarias', notaDiaria)}
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
            value={notaApreciacion}
            onChange={(e) => setNotaApreciacion(e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-center"
          />
          <button
            onClick={() => handleAgregarNota('apreciacion', notaApreciacion)}
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
            value={notaExamen}
            onChange={(e) => setNotaExamen(e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center"
          />
          <button
            onClick={() => handleAgregarNota('examen', notaExamen)}
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

// Componente de Modal Login MEJORADO con toggle de contraseña
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
  const [mostrarPassword, setMostrarPassword] = useState(false);

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

// Componente de Modal Registro MEJORADO con toggle de contraseña
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
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

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

// Componente de Barra de Búsqueda de ESTUDIANTES para Home
const BarraBusquedaEstudiantes = ({ estudiantes, onBuscarEstudiante, busquedaEstudiante, setBusquedaEstudiante }) => {
  const buscarYRedirigirEstudiante = (nombre) => {
    if (!nombre.trim()) return;
    
    const estudianteEncontrado = estudiantes.find(e => 
      e.nombre.toLowerCase().includes(nombre.toLowerCase())
    );
    
    if (estudianteEncontrado) {
      onBuscarEstudiante(estudianteEncontrado);
      setBusquedaEstudiante('');
    } else {
      alert('Estudiante no encontrado');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            🔍 Buscar Estudiante
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe el nombre del estudiante..."
              value={busquedaEstudiante}
              onChange={(e) => setBusquedaEstudiante(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && buscarYRedirigirEstudiante(busquedaEstudiante)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm md:text-base"
            />
            <button
              onClick={() => buscarYRedirigirEstudiante(busquedaEstudiante)}
              className="bg-purple-600 text-white px-4 md:px-6 py-3 rounded-lg hover:bg-purple-700 transition font-bold flex items-center gap-2 text-sm md:text-base"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Encuentra rápidamente estudiantes por nombre
          </p>
        </div>
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

  // Estado para búsqueda de estudiantes - MANTENIDO
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');

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

  // FUNCIÓN MEJORADA: Generar plan trimestral con NUEVO campo
  const generarPlanConOpenAI = async () => {
    if (!nombreProfesor.trim() || !institucion.trim() || !gradoPlan.trim() || !materia.trim() || !trimestre.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setGenerandoPlan(true);

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

    } catch (error) {
      console.error('❌ Error al generar plan:', error);
      alert(`Error al generar el plan: ${error.message}`);
    } finally {
      setGenerandoPlan(false);
    }
  };

  // FUNCIÓN MEJORADA: Descargar plan trimestral con NUEVO campo
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

    // NUEVO: Sección de Desarrollo del Contenido para Clases
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

  // FUNCIÓN MEJORADA: Agregar clase
  const agregarClase = async () => {
    if (!usuario) {
      alert('Debes iniciar sesión para crear clases');
      setMostrarLogin(true);
      return;
    }

    if (!nombreClase.trim() || !grado.trim() || !seccion.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      const nuevaClase = {
        nombre: `${nombreClase} ${grado}${seccion}`,
        grado,
        seccion,
        materia: nombreClase,
        estudiantes: [],
        userId: usuario.uid,
        fechaCreacion: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'clases'), nuevaClase);
      setClases([...clases, { id: docRef.id, ...nuevaClase }]);
      setNombreClase('');
      setGrado('');
      setSeccion('');
      
    } catch (error) {
      console.error('❌ Error agregando clase:', error);
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

  // FUNCIÓN CORREGIDA: Agregar nota - AHORA FUNCIONA CORRECTAMENTE
  const agregarNota = async (estudianteId, seccion, valor = '', fecha = new Date().toISOString().split('T')[0]) => {
    try {
      const nuevosEstudiantes = estudiantes.map(e => {
        if (e.id === estudianteId) {
          const nuevaNota = {
            valor: valor ? parseFloat(valor) : '',
            fecha: fecha
          };
          return {
            ...e,
            [seccion]: [...e[seccion], nuevaNota]
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
      alert('Error al agregar nota');
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

  // FUNCIÓN CORREGIDA: Buscar y redirigir estudiante - AHORA EN HOME
  const buscarYRedirigirEstudiante = (estudiante) => {
    // Si estamos en home, vamos a notas
    if (view === 'home') {
      setView('notas');
    }
    
    // Expandir la sección del estudiante
    setExpandido(prev => ({
      ...prev,
      [estudiante.id]: true
    }));
    
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
              
              {/* ✅ BARRA DE BÚSQUEDA DE ESTUDIANTES EN HOME - CORREGIDO */}
              {usuario && claseSeleccionada && estudiantes.length > 0 && (
                <BarraBusquedaEstudiantes
                  estudiantes={estudiantes}
                  onBuscarEstudiante={buscarYRedirigirEstudiante}
                  busquedaEstudiante={busquedaEstudiante}
                  setBusquedaEstudiante={setBusquedaEstudiante}
                />
              )}
              
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
                  onClick={() => window.print()}
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
                  onClick={() => window.print()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold flex items-center gap-2 text-sm md:text-base"
                >
                  <Download className="w-5 h-5" />
                  Descargar
                </button>
              </div>
            </div>
            
            {/* ❌ NO HAY BARRA DE BÚSQUEDA EN NOTAS - SOLO EN HOME */}
            
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
            
            {/* CUADRÍCULA DE NOTAS RÁPIDAS - CORREGIDA */}
            {estudiantes.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📊 Registro Rápido de Notas - {new Date().toLocaleDateString('es-PA')}
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead className="bg-purple-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Estudiante</th>
                        <th className="px-4 py-3 text-center font-semibold">Notas Diarias</th>
                        <th className="px-4 py-3 text-center font-semibold">Apreciación</th>
                        <th className="px-4 py-3 text-center font-semibold">Examen</th>
                        <th className="px-4 py-3 text-center font-semibold">Promedio</th>
                        <th className="px-4 py-3 text-center font-semibold">Compartir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map((estudiante) => (
                        <FilaNotasRapidas
                          key={estudiante.id}
                          estudiante={estudiante}
                          onAgregarNota={agregarNota}
                          calcularPromedioFinal={calcularPromedioFinal}
                          claseSeleccionada={claseSeleccionada}
                          usuario={usuario}
                          actualizarNota={actualizarNota}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  💡 Ingresa las notas (0-5) y presiona "+" para agregar. Las notas se guardan automáticamente.
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

        {/* VISTA DE PROGRESO */}
        {view === 'progreso' && claseSeleccionada && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                Dashboard de Progreso - {claseSeleccionada.nombre}
              </h2>
              <button
                onClick={() => window.print()}
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
                
                {/* SECCIÓN ACTUALIZADA CON NUEVO CAMPO */}
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
                
                {/* NUEVA SECCIÓN: DESARROLLO DEL CONTENIDO PARA CLASES */}
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