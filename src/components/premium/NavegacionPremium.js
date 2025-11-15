import React from 'react';
import { 
  Home, Users, Calendar, ClipboardList, Activity, 
  PieChart, TrendingUp, Sparkles, Crown 
} from 'lucide-react';

const NavegacionPremium = ({ 
  view, 
  setView, 
  tienePremium, 
  onUpgrade, 
  trackEvent 
}) => {    
  console.log("🔍 NavegacionPremium - props:", { tienePremium, onUpgrade: typeof onUpgrade });
  
  const vistas = [
    { id: 'home', icon: Home, label: 'Inicio', siempreDisponible: true },
    { id: 'clase', icon: Users, label: 'Estudiantes', siempreDisponible: true },
    { id: 'asistencia', icon: Calendar, label: 'Asistencia', siempreDisponible: true },
    { id: 'calificaciones', icon: ClipboardList, label: 'Calificaciones', siempreDisponible: true },
    { id: 'habitos', icon: Activity, label: 'Hábitos', siempreDisponible: true },
    { id: 'porcentajes', icon: PieChart, label: 'Cuadro de %', premium: true },
    { id: 'progreso', icon: TrendingUp, label: 'Progreso', premium: true },
    { id: 'planificacion', icon: Sparkles, label: 'Plan IA', premium: true },
  ];

  const manejarClickVista = (vista) => {
    if (vista.premium && !tienePremium) {
      trackEvent('intento_acceso_premium', { vista: vista.id });
      onUpgrade();       
      console.log("🎯 onUpgrade EJECUTADO - debería abrir modal");
      return;
    }
    setView(vista.id);
    trackEvent('navegacion_' + vista.id);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto py-2">
          {vistas.map((vista) => {
            const estaActiva = view === vista.id;
            const esPremiumBloqueada = vista.premium && !tienePremium;

            return (
              <button
                key={vista.id}
                onClick={() => manejarClickVista(vista)}
                className={`
                  flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-semibold 
                  transition whitespace-nowrap relative
                  ${estaActiva 
                    ? 'bg-purple-600 text-white' 
                    : esPremiumBloqueada
                      ? 'bg-gray-100 text-gray-400 cursor-pointer hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                title={esPremiumBloqueada ? "Actualiza a Premium para desbloquear" : vista.label}
              >
                <vista.icon className="w-5 h-5" />
                <span className="text-sm md:text-base">{vista.label}</span>
                
                {vista.premium && tienePremium && (
                  <Crown className="w-3 h-3 text-yellow-500" />
                )}
                
                {esPremiumBloqueada && (
                  <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavegacionPremium;