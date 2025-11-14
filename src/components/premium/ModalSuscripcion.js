import React, { useState } from 'react';
import { Crown, CheckCircle, CreditCard, Star, X } from 'lucide-react';
import StripePago from './StripePago';

const ModalSuscripcion = ({ 
  mostrar, 
  onCerrar, 
  onSuscribirse, 
  trackEvent,
  usuario 
}) => {
  const [planSeleccionado, setPlanSeleccionado] = useState('monthly');

  if (!mostrar) return null;

  const planes = [
    {
      id: 'monthly',
      nombre: 'Mensual',
      precio: 9,
      periodo: 'mes',
      popular: false,
      caracteristicas: [
        'Clases ilimitadas',
        'Tablero de progreso completo',
        'Cuadro de porcentajes',
        'Planificación con IA',
        'Exportaciones avanzadas',
        'Soporte prioritario'
      ]
    },
    {
      id: 'yearly',
      nombre: 'Anual',
      precio: 60,
      periodo: 'año',
      popular: true,
      ahorro: 48,
      caracteristicas: [
        'Todo lo del plan mensual',
        '2 meses gratis',
        'Ahorro del 45%',
        'Soporte prioritario VIP',
        'Actualizaciones gratuitas',
        'Garantía de reembolso'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl relative">
          <button
            onClick={onCerrar}
            className="absolute top-4 right-4 text-white hover:text-purple-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="inline-block bg-white rounded-full p-3 mb-3 shadow-lg">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Bringo Edu Premium</h3>
            <p className="text-purple-100">Desbloquea todas las funciones avanzadas</p>
          </div>
        </div>

        <div className="p-6">
          {/* Comparación de planes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {planes.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all relative ${
                  planSeleccionado === plan.id
                    ? 'border-purple-500 bg-purple-50 transform scale-105'
                    : 'border-gray-200 hover:border-purple-300'
                } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setPlanSeleccionado(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      MÁS POPULAR
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{plan.nombre}</h4>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold text-gray-900">${plan.precio}</span>
                      <span className="text-gray-600">/{plan.periodo}</span>
                    </div>
                    {plan.ahorro && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold mt-2">
                        Ahorras ${plan.ahorro}
                      </div>
                    )}
                  </div>
                  {planSeleccionado === plan.id && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
                
                <ul className="space-y-2">
                  {plan.caracteristicas.map((caracteristica, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {caracteristica}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Pago con Stripe */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pago Seguro con Stripe
            </h4>
            
            <StripePago
              plan={planSeleccionado}
              usuario={usuario}
              onSuccess={async (plan) => {
                trackEvent('pago_exitoso', { plan: plan });
                const exito = true; // En producción, esto vendría de tu backend
                if (exito) {
                  onSuscribirse(plan);
                  onCerrar();
                }
              }}
              onError={(error) => {
                trackEvent('error_pago', { error: error, plan: planSeleccionado });
                alert(`Error en el pago: ${error}`);
              }}
            />
          </div>

          {/* Garantía */}
          <div className="bg-blue-50 rounded-lg p-4 mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold">Garantía de 14 días</span>
            </div>
            <p className="text-sm text-blue-600">
              Si no estás satisfecho, te reembolsamos sin preguntas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSuscripcion;
