// Agrega esto en App.js - solución temporal
const [mostrarSuscripcion, setMostrarSuscripcion] = useState(false);

// Función que SÍ funciona
const abrirModalSuscripcion = () => {
  console.log("🔓 Abriendo modal de suscripción");
  setMostrarSuscripcion(true);
};

// En el NavegacionPremium, cambia onUpgrade por:
onUpgrade={abrirModalSuscripcion}
