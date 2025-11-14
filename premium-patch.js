// Buscar: 
// {/* NAVEGACIÓN MEJORADA CON NUEVA PESTAÑA */}
// <nav className="bg-white shadow-md sticky top-0 z-40">...todo el nav...</nav>

// REEMPLAZAR con:
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
