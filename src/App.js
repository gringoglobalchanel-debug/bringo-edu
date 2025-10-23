import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, AlertCircle, Users, Home, ChevronDown, ChevronUp, ClipboardList, Calendar, Sparkles, User, LogOut, LogIn } from 'lucide-react';

// Configuración de Firebase y OpenAI (se cargarán desde variables de entorno)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Servicios de Firebase
let auth, db;
try {
  const firebaseApp = window.firebase.app();
  auth = window.firebase.auth();
  db = window.firebase.firestore();
} catch (error) {
  console.log('Firebase no inicializado aún');
}

export default function AsistenteProfesor() {
  // Estados de autenticación
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorAuth, setErrorAuth] = useState('');
  
  // Estados existentes
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
  
  // Estados para planificación
  const [nombreProfesor, setNombreProfesor] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [gradoPlan, setGradoPlan] = useState('');
  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [planGenerado, setPlanGenerado] = useState(null);
  const [generandoPlan, setGenerandoPlan] = useState(false);

  // Efecto para verificar autenticación persistente
  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            const userData = userDoc.data();
            setUsuario({ 
              uid: user.uid, 
              email: user.email, 
              nombre: userData?.nombre || user.email.split('@')[0] 
            });
            cargarClasesDesdeFirebase(user.uid);
          } catch (error) {
            console.error('Error cargando usuario:', error);
          }
        } else {
          setUsuario(null);
          setClases([]);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Función para cargar clases desde Firebase
  const cargarClasesDesdeFirebase = async (userId) => {
    if (!db) return;
    
    try {
      const clasesRef = db.collection('clases').where('userId', '==', userId);
      const snapshot = await clasesRef.get();
      const clasesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClases(clasesData);
    } catch (error) {
      console.error('Error cargando clases:', error);
    }
  };

  // Autenticación con Firebase
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

    setCargando(true);
    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      await user.updateProfile({
        displayName: nombreUsuario
      });
      
      // Crear perfil de usuario en Firestore
      await db.collection('usuarios').doc(user.uid).set({
        nombre: nombreUsuario,
        email: email,
        fechaRegistro: new Date()
      });
      
      setUsuario({ 
        uid: user.uid, 
        email, 
        nombre: nombreUsuario 
      });
      setMostrarRegistro(false);
      limpiarFormulariosAuth();
    } catch (error) {
      console.error('Error en registro:', error);
      setErrorAuth(error.message);
    } finally {
      setCargando(false);
    }
  };

  const iniciarSesion = async () => {
    setErrorAuth('');
    
    if (!email || !password) {
      setErrorAuth('Por favor ingresa email y contraseña');
      return;
    }

    setCargando(true);
    try {
      const { user } = await auth.signInWithEmailAndPassword(email, password);
      
      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await db.collection('usuarios').doc(user.uid).get();
      const userData = userDoc.data();
      
      setUsuario({ 
        uid: user.uid, 
        email: user.email, 
        nombre: userData?.nombre || user.email.split('@')[0] 
      });
      setMostrarLogin(false);
      limpiarFormulariosAuth();
    } catch (error) {
      console.error('Error en login:', error);
      setErrorAuth(error.message);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await auth.signOut();
      setUsuario(null);
      setView('home');
      setClaseSeleccionada(null);
      setClases([]);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const limpiarFormulariosAuth = () => {
    setEmail('');
    setPassword('');
    setNombreUsuario('');
    setConfirmarPassword('');
    setErrorAuth('');
  };

  // Operaciones con Firebase para clases
  const agregarClase = async () => {
    if (!usuario) {
      setErrorAuth('Debes iniciar sesión para crear clases');
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
        fechaCreacion: new Date()
      };
      
      const docRef = await db.collection('clases').add(nuevaClase);
      setClases([...clases, { id: docRef.id, ...nuevaClase }]);
      setNombreClase('');
      setGrado('');
      setSeccion('');
    } catch (error) {
      console.error('Error creando clase:', error);
      alert('Error al crear la clase');
    }
  };

  const eliminarClase = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta clase?')) {
      try {
        await db.collection('clases').doc(id).delete();
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
      setErrorAuth('Debes iniciar sesión para acceder a las clases');
      setMostrarLogin(true);
      return;
    }
    
    setClaseSeleccionada(clase);
    setEstudiantes(clase.estudiantes || []);
    setView('clase');
  };

  // Operaciones con Firebase para estudiantes
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
      
      // Actualizar en Firebase
      await db.collection('clases').doc(claseSeleccionada.id).update({
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
      
      // Actualizar en Firebase
      await db.collection('clases').doc(claseSeleccionada.id).update({
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
      alert('Error al marcar asistencia');
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
      
      await db.collection('clases').doc(claseSeleccionada.id).update({
        estudiantes: nuevosEstudiantes
      });
      
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
      
      await db.collection('clases').doc(claseSeleccionada.id).update({
        estudiantes: nuevosEstudiantes
      });
      
      const clasesActualizadas = clases.map(c => 
        c.id === claseSeleccionada.id 
          ? { ...c, estudiantes: nuevosEstudiantes }
          : c
      );
      setClases(clasesActualizadas);
    } catch (error) {
      console.error('Error actualizando nota:', error);
      alert('Error al actualizar nota');
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
      
      await db.collection('clases').doc(claseSeleccionada.id).update({
        estudiantes: nuevosEstudiantes
      });
      
      const clasesActualizadas = clases.map(c => 
        c.id === claseSeleccionada.id 
          ? { ...c, estudiantes: nuevosEstudiantes }
          : c
      );
      setClases(clasesActualizadas);
    } catch (error) {
      console.error('Error eliminando nota:', error);
      alert('Error al eliminar nota');
    }
  };

  const eliminarEstudiante = async (id) => {
    try {
      const nuevosEstudiantes = estudiantes.filter(e => e.id !== id);
      setEstudiantes(nuevosEstudiantes);
      
      await db.collection('clases').doc(claseSeleccionada.id).update({
        estudiantes: nuevosEstudiantes
      });
      
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

  // Funciones de cálculo
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

  // Función mejorada para generar plan con OpenAI
  const generarPlanEstudio = async () => {
    if (!nombreProfesor.trim() || !institucion.trim() || !gradoPlan.trim() || !materia.trim() || !tema.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setGenerandoPlan(true);

    try {
      // Verificar si OpenAI está disponible
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        throw new Error('OpenAI API key no configurada');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en educación y currículo panameño (MEDUCA). Genera planes de estudio estructurados y prácticos en formato JSON.'
            },
            {
              role: 'user',
              content: `Genera un plan de estudio para ${tema} de ${materia} para ${gradoPlan}. Profesor: ${nombreProfesor}, Institución: ${institucion}. Incluye objetivos, competencias, metodología, actividades, evaluación y recursos. Formato JSON.`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta de OpenAI');
      }

      const data = await response.json();
      let contenidoPlan;
      
      try {
        contenidoPlan = JSON.parse(data.choices[0].message.content);
      } catch {
        // Si no viene en JSON, usar contenido directo
        contenidoPlan = {
          objetivos: [`Comprender ${tema}`, `Aplicar ${tema} en contexto panameño`],
          competencias: ['Pensamiento crítico', 'Trabajo colaborativo'],
          metodologia: {
            inicio: `Introducción a ${tema}`,
            desarrollo: `Actividades prácticas sobre ${tema}`,
            cierre: `Evaluación y reflexión`
          },
          actividades: [
            {
              nombre: `Exploración de ${tema}`,
              duracion: '30 minutos',
              descripcion: `Actividad introductoria sobre ${tema}`,
              recursos: ['Material básico']
            }
          ],
          recursos: ['Material impreso', 'Recursos digitales'],
          evaluacion: {
            diagnostica: 'Preguntas de exploración',
            formativa: 'Observación en clase',
            sumativa: 'Prueba escrita'
          },
          adaptaciones: ['Adecuaciones para NEE'],
          tareas: `Investigación sobre ${tema}`,
          observaciones: `Plan alineado con MEDUCA para ${gradoPlan}`
        };
      }

      const plan = {
        profesor: nombreProfesor,
        institucion: institucion,
        grado: gradoPlan,
        materia: materia,
        tema: tema,
        fecha: new Date().toLocaleDateString('es-PA'),
        contenido: contenidoPlan
      };

      // Guardar plan en Firebase si hay usuario autenticado
      if (usuario && db) {
        await db.collection('planes').add({
          ...plan,
          userId: usuario.uid,
          fechaCreacion: new Date()
        });
      }

      setPlanGenerado(plan);
    } catch (error) {
      console.error('Error generando plan:', error);
      
      // Plan de respuesto
      const planRespaldo = {
        profesor: nombreProfesor,
        institucion: institucion,
        grado: gradoPlan,
        materia: materia,
        tema: tema,
        fecha: new Date().toLocaleDateString('es-PA'),
        contenido: {
          objetivos: [
            `Comprender los conceptos fundamentales de ${tema}`,
            `Aplicar ${tema} en situaciones prácticas`
          ],
          competencias: [
            'Pensamiento crítico',
            'Comunicación efectiva',
            'Trabajo colaborativo'
          ],
          indicadoresLogro: [
            `Identifica conceptos de ${tema}`,
            `Aplica ${tema} en ejercicios`
          ],
          metodologia: {
            inicio: `Activación de conocimientos previos sobre ${tema}`,
            desarrollo: `Explicación y actividades prácticas`,
            cierre: `Socialización y evaluación`
          },
          actividades: [
            {
              nombre: 'Actividad práctica',
              duracion: '30 minutos',
              descripcion: `Desarrollo de ejercicios sobre ${tema}`,
              recursos: ['Material de trabajo']
            }
          ],
          recursos: [
            'Pizarra',
            'Material impreso',
            'Recursos digitales'
          ],
          evaluacion: {
            diagnostica: 'Exploración inicial',
            formativa: 'Observación continua',
            sumativa: 'Prueba final'
          },
          adaptaciones: [
            'Adecuaciones según necesidades'
          ],
          tareas: `Tarea sobre ${tema}`,
          observaciones: `Plan educativo para ${gradoPlan}`
        }
      };
      
      setPlanGenerado(planRespaldo);
    } finally {
      setGenerandoPlan(false);
    }
  };

  const generarReporte = () => {
    let reporte = `REPORTE DE DESEMPEÑO\n`;
    reporte += `Clase: ${claseSeleccionada.nombre}\n`;
    reporte += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
    reporte += `${'='.repeat(50)}\n\n`;
    
    reporte += `ESTADÍSTICAS GENERALES:\n`;
    reporte += `- Promedio General: ${promedioGeneral()}/5\n`;
    reporte += `- Total de Estudiantes: ${estudiantes.length}\n`;
    reporte += `- Estudiantes en Riesgo: ${estudiantesEnRiesgo.length}\n\n`;

    const elemento = document.createElement('a');
    elemento.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reporte));
    elemento.setAttribute('download', `Reporte_${claseSeleccionada.nombre}_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
  };

  const descargarPlan = () => {
    if (!planGenerado) return;

    let contenido = `PLAN DE ESTUDIO - BRINGO EDU\n`;
    contenido += `${'='.repeat(70)}\n\n`;
    contenido += `Profesor: ${planGenerado.profesor}\n`;
    contenido += `Institución: ${planGenerado.institucion}\n`;
    contenido += `Grado: ${planGenerado.grado}\n`;
    contenido += `Materia: ${planGenerado.materia}\n`;
    contenido += `Tema: ${planGenerado.tema}\n`;
    contenido += `Fecha: ${planGenerado.fecha}\n\n`;

    const elemento = document.createElement('a');
    elemento.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contenido));
    elemento.setAttribute('download', `Plan_${planGenerado.materia}_${planGenerado.tema}_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
  };

  // Componentes de Modal
  const ModalLogin = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 text-center">
          <div className="inline-block bg-white rounded-full p-4 mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">¡Bienvenido de nuevo!</h3>
          <p className="text-purple-100 text-sm">Ingresa a tu cuenta de Bringo Edu</p>
        </div>
        
        <div className="p-8">
          {errorAuth && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{errorAuth}</p>
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
              />
            </div>
          </div>
          
          <button
            onClick={iniciarSesion}
            disabled={cargando}
            className={`w-full mt-8 text-white py-4 rounded-xl transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
              cargando 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
            }`}
          >
            {cargando ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Iniciando Sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
          
          <button
            onClick={() => {
              setMostrarLogin(false);
              limpiarFormulariosAuth();
            }}
            disabled={cargando}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-semibold"
          >
            Cancelar
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">¿No tienes cuenta?</p>
            <button
              onClick={() => {
                setMostrarLogin(false);
                setMostrarRegistro(true);
                limpiarFormulariosAuth();
              }}
              className="text-purple-600 hover:text-purple-800 font-bold text-lg hover:underline"
            >
              Regístrate aquí
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ModalRegistro = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-green-900/95 via-teal-900/95 to-blue-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        <div className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 p-8 text-center">
          <div className="inline-block bg-white rounded-full p-4 mb-4 shadow-lg">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">¡Únete a Bringo Edu!</h3>
          <p className="text-green-100 text-sm">Crea tu cuenta y comienza a gestionar tus clases</p>
        </div>
        
        <div className="p-8">
          {errorAuth && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{errorAuth}</p>
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
              />
            </div>
          </div>
          
          <button
            onClick={registrarUsuario}
            disabled={cargando}
            className={`w-full mt-8 text-white py-4 rounded-xl transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
              cargando 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
            }`}
          >
            {cargando ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creando Cuenta...
              </div>
            ) : (
              'Crear Cuenta'
            )}
          </button>
          
          <button
            onClick={() => {
              setMostrarRegistro(false);
              limpiarFormulariosAuth();
            }}
            disabled={cargando}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-semibold"
          >
            Cancelar
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">¿Ya tienes cuenta?</p>
            <button
              onClick={() => {
                setMostrarRegistro(false);
                setMostrarLogin(true);
                limpiarFormulariosAuth();
              }}
              className="text-green-600 hover:text-green-800 font-bold text-lg hover:underline"
            >
              Inicia sesión aquí
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {mostrarLogin && <ModalLogin />}
      {mostrarRegistro && <ModalRegistro />}

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
                <div className="text-right mr-4">
                  <p className="font-semibold text-sm">👋 Hola, {usuario.nombre}</p>
                  <p className="text-xs text-purple-200">{usuario.email}</p>
                </div>
                <button
                  onClick={cerrarSesion}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMostrarLogin(true)}
                  className="flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg transition font-semibold"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setMostrarRegistro(true)}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition font-semibold"
                >
                  <User className="w-4 h-4" />
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            <button
              onClick={() => setView('home')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                view === 'home' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Home className="w-5 h-5" />
              Inicio
            </button>
            
            {usuario && claseSeleccionada && (
              <>
                <button
                  onClick={() => setView('clase')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    view === 'clase' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  Estudiantes
                </button>
                <button
                  onClick={() => setView('asistencia')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    view === 'asistencia' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  Asistencia
                </button>
                <button
                  onClick={() => setView('notas')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    view === 'notas' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ClipboardList className="w-5 h-5" />
                  Notas
                </button>
              </>
            )}
            
            <button
              onClick={() => setView('planificacion')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                view === 'planificacion' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              Plan IA
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {view === 'home' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
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
                      <div className="flex gap-3">
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
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
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Nombre completo del estudiante"
                  value={nombreEstudiante}
                  onChange={(e) => setNombreEstudiante(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={agregarEstudiante}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition font-bold flex items-center gap-2"
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
                  <div className="flex justify-between items-center">
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
                      onClick={() => eliminarEstudiante(estudiante.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
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
              </div>
            </div>
            
            <div className="space-y-4">
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
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'presente')}
                          className={`px-6 py-3 rounded-lg font-semibold transition ${
                            estadoHoy === 'presente'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'tardanza')}
                          className={`px-6 py-3 rounded-lg font-semibold transition ${
                            estadoHoy === 'tardanza'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          Tardanza
                        </button>
                        <button
                          onClick={() => marcarAsistencia(estudiante.id, fechaActual, 'ausente')}
                          className={`px-6 py-3 rounded-lg font-semibold transition ${
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-purple-600" />
                Notas - {claseSeleccionada.nombre}
              </h2>
              <div className="flex gap-4">
                <div className="bg-purple-100 px-6 py-3 rounded-lg">
                  <span className="text-sm text-purple-600 font-semibold">Promedio General:</span>
                  <span className="ml-2 text-2xl font-bold text-purple-800">{promedioGeneral()}/5</span>
                </div>
                <button
                  onClick={generarReporte}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold flex items-center gap-2"
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
            
            <div className="space-y-6">
              {estudiantes.map(estudiante => (
                <div key={estudiante.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => toggleExpansion(estudiante.id)}
                    className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 cursor-pointer hover:from-purple-200 hover:to-blue-200 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                          {estudiante.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">{estudiante.nombre}</h4>
                          <div className="flex gap-4 mt-1 text-sm">
                            <span>Diarias: {calcularTotalSeccion(estudiante.notasDiarias)}</span>
                            <span>Apreciación: {calcularTotalSeccion(estudiante.apreciacion)}</span>
                            <span>Examen: {calcularTotalSeccion(estudiante.examen)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Promedio Final</p>
                          <p className={`text-3xl font-bold ${
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

        {view === 'planificacion' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              Generador de Planes con IA
            </h2>
            
            {!planGenerado ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Información del Plan</h3>
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
                    <input
                      type="text"
                      placeholder="Tema del Plan (ej: Fracciones)"
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      className="md:col-span-2 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  <button
                    onClick={generarPlanEstudio}
                    disabled={generandoPlan}
                    className={`w-full mt-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition ${
                      generandoPlan
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {generandoPlan ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Generando Plan con IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Generar Plan con IA
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{planGenerado.tema}</h3>
                    <p className="text-gray-600 mt-1">
                      {planGenerado.materia} - {planGenerado.grado} | {planGenerado.institucion}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Profesor: {planGenerado.profesor}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={descargarPlan}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Descargar
                    </button>
                    <button
                      onClick={() => setPlanGenerado(null)}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-bold"
                    >
                      Nuevo Plan
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                    🎯 Objetivos de Aprendizaje
                  </h4>
                  <ul className="space-y-2">
                    {planGenerado.contenido.objetivos?.map((obj, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-blue-600 font-bold">{i + 1}.</span>
                        <span className="text-gray-800">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                    💪 Competencias a Desarrollar
                  </h4>
                  <ul className="space-y-2">
                    {planGenerado.contenido.competencias?.map((comp, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-purple-600">•</span>
                        <span className="text-gray-800">{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                    📖 Metodología
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="font-bold text-green-800 mb-2">Inicio:</p>
                      <p className="text-gray-800">{planGenerado.contenido.metodologia?.inicio}</p>
                    </div>
                    <div>
                      <p className="font-bold text-green-800 mb-2">Desarrollo:</p>
                      <p className="text-gray-800">{planGenerado.contenido.metodologia?.desarrollo}</p>
                    </div>
                    <div>
                      <p className="font-bold text-green-800 mb-2">Cierre:</p>
                      <p className="text-gray-800">{planGenerado.contenido.metodologia?.cierre}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                    🎨 Actividades
                  </h4>
                  <div className="space-y-4">
                    {planGenerado.contenido.actividades?.map((act, i) => (
                      <div key={i} className="bg-white rounded-lg p-4">
                        <h5 className="font-bold text-gray-800 mb-2">
                          {i + 1}. {act.nombre} <span className="text-sm text-gray-600">({act.duracion})</span>
                        </h5>
                        <p className="text-gray-700">{act.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                    📊 Evaluación
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-red-800">Diagnóstica:</p>
                      <p className="text-gray-800">{planGenerado.contenido.evaluacion?.diagnostica}</p>
                    </div>
                    <div>
                      <p className="font-bold text-red-800">Formativa:</p>
                      <p className="text-gray-800">{planGenerado.contenido.evaluacion?.formativa}</p>
                    </div>
                    <div>
                      <p className="font-bold text-red-800">Sumativa:</p>
                      <p className="text-gray-800">{planGenerado.contenido.evaluacion?.sumativa}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    🛠️ Recursos Necesarios
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {planGenerado.contenido.recursos?.map((rec, i) => (
                      <li key={i} className="flex gap-2 items-center">
                        <span className="text-indigo-600">•</span>
                        <span className="text-gray-800">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-100 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    📝 Observaciones
                  </h4>
                  <p className="text-gray-800">{planGenerado.contenido.observaciones}</p>
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
            Desarrollado con ❤️ para facilitar la gestión educativa
          </p>
        </div>
      </footer>
    </div>
  );
}