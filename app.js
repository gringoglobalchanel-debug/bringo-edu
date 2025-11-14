
// Importaciones Premium
import { usePremium } from './hooks/usePremium';
import { 
  BannerUpgrade, 
  ModalSuscripcion, 
  NavegacionPremium, 
  AlertaLimiteClases 
} from './components/premium';
  // ESTADOS PREMIUM
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
  {/* NAVEGACIÓN PREMIUM */}
  <NavegacionPremium
    view={view}
    setView={setView}
    tienePremium={tienePremium}
    onUpgrade={() => setMostrarSuscripcion(true)}
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
  const agregarClase = async () => {
    if (!usuario) {
      alert('Debes iniciar sesión para crear clases');
      setMostrarLogin(true);
      return;
    }

    // VERIFICAR LÍMITE DE CLASES
    if (!puedeCrearClase) {
      setMostrarSuscripcion(true);
      return;
    }

    // ... resto del código existente ...
  };
