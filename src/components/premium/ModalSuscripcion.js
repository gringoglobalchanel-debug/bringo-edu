import React, { useState } from 'react';
import { Crown, CheckCircle, X, Zap, Star } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePago from './StripePago';

// ✅ IMPORTANTE: Reemplaza con tu clave pública de Stripe
const stripePromise = loadStripe('pk_test_TU_CLAVE_PUBLICA_AQUI');

const ModalSuscripcion = ({ 
  mostrar, 
  onCerrar, 
  onSuscribirse, 
  trackEvent,
  usuario 
}) => {
  const [planSeleccionado, setPlanSeleccionado] = useState('monthly');
  const [mostrarPago, setMostrarPago] = useState(false);

  if (!mostrar) {
    console.log("🚫 Modal no mostrar");
    return null;
  }

  console.log("✅ Modal SÍ mostrar - renderizando");

  const handleSuccess = (plan) => {
    console.log("✅ Pago exitoso:", plan);
    trackEvent('suscripcion_exitosa', { plan });
    onSuscribirse(plan);
    onCerrar();
  };

  const handleError = (error) => {
    console.error("❌ Error en pago:", error);
    trackEvent('error_pago', { error });
  };

  const planes = {
    monthly: {
      precio: 9,
      periodo: 'mes',
      ahorro: null,
      caracteristicas: [
        'Clases ilimitadas',
        'Reportes avanzados',
        'Progreso con IA',
        'Soporte prioritario'
      ]
    },
    yearly: {
      precio: 60,
      periodo: 'año',
      ahorro: '44% OFF',
      caracteristicas: [
        'Todo lo de mensual',
        '2 meses GRATIS',
        'Acceso anticipado',
        'Soporte VIP 24/7'
      ]
    }
  };

  const planActual = planes[planSeleccionado];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-purple-500">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <button
            onClick={onCerrar}
            className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-yellow-300" />
            <h2 className="text-3xl font-bold">Bringo Edu Premium</h2>
          </div>
          <p className="text-purple-100">Desbloquea todas las funcionalidades</p>
        </div>

        <div className="p-6">
          {!mostrarPago ? (
            <>
              {/* Selector de planes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  Elige tu plan
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Plan Mensual */}
                  <button
                    onClick={() => setPlanSeleccionado('monthly')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      planSeleccionado === 'monthly'
                        ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Mensual</p>
                      <p className="text-4xl font-bold text-gray-900 mb-1">
                        $9
                      </p>
                      <p className="text-sm text-gray-500">por mes</p>
                    </div>
                  </button>

                  {/* Plan Anual */}
                  <button
                    onClick={() => setPlanSeleccionado('yearly')}
                    className={`p-6 rounded-xl border-2 transition-all relative ${
                      planSeleccionado === 'yearly'
                        ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        AHORRA 44%
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Anual</p>
                      <p className="text-4xl font-bold text-gray-900 mb-1">
                        $60
                      </p>
                      <p className="text-sm text-gray-500">por año</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        ($5/mes)
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Características del plan */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  Incluye:
                </h4>
                <ul className="space-y-3">
                  {planActual.caracteristicas.map((caracteristica, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{caracteristica}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón continuar */}
              <button
                onClick={() => {
                  trackEvent('continuar_pago_click', { plan: planSeleccionado });
                  setMostrarPago(true);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-bold text-lg shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-6 h-6" />
                Continuar con ${planActual.precio} USD
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                Cancela cuando quieras • Sin cargos ocultos
              </p>
            </>
          ) : (
            <>
              {/* Formulario de pago Stripe */}
              <button
                onClick={() => setMostrarPago(false)}
                className="mb-4 text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
              >
                ← Volver a planes
              </button>

              <Elements stripe={stripePromise}>
                <StripePago
                  plan={planSeleccionado}
                  usuario={usuario}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </Elements>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalSuscripcion;
