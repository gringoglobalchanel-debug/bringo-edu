import React, { useState, useEffect } from 'react';
import { 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { StripeService } from '../../services/stripe-service';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';

const StripePago = ({ plan, usuario, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [message, setMessage] = useState('');
  const [pagoExitoso, setPagoExitoso] = useState(false);

  useEffect(() => {
    if (usuario && plan) {
      StripeService.createPaymentIntent(plan, usuario)
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          onError(error.message);
        });
    }
  }, [plan, usuario, onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: usuario.nombre,
            email: usuario.email,
          },
        }
      });

      if (error) {
        setMessage(error.message);
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        setPagoExitoso(true);
        setMessage('¡Pago exitoso! Activando tu cuenta...');
        
        // Esperar un momento para mostrar el éxito
        setTimeout(() => {
          onSuccess(plan);
        }, 2000);
      }
    } catch (error) {
      setMessage(error.message);
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const monto = plan === 'monthly' ? 9 : 60;

  if (pagoExitoso) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">¡Pago Exitoso!</h3>
        <p className="text-green-600">Activando tu cuenta Bringo Edu Premium...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del plan */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-blue-800 font-semibold">Plan {plan === 'monthly' ? 'Mensual' : 'Anual'}</span>
            <p className="text-sm text-blue-600">
              {plan === 'monthly' ? 'Renovación mensual' : 'Renovación anual'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-900">${monto}</span>
            <span className="text-blue-700"> USD</span>
          </div>
        </div>
      </div>

      {/* Formulario de tarjeta */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="w-4 h-4" />
          <span>Información de la tarjeta</span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  padding: '10px 12px',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Mensajes de error/éxito */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('éxito') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Botón de pago */}
      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Procesando pago...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Pagar ${monto} USD
          </>
        )}
      </button>

      {/* Información de seguridad */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Pago seguro</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            <span>SSL Encriptado</span>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          Aceptamos Visa, Mastercard, American Express
        </p>
      </div>

      {/* Información de facturación */}
      <div className="text-xs text-gray-500 text-center">
        <p>Serás redirigido a la pasarela de pago segura de Stripe</p>
        <p className="mt-1">
          Al continuar, aceptas los{' '}
          <a href="#" className="text-purple-600 hover:underline">Términos de Servicio</a>
          {' '}y la{' '}
          <a href="#" className="text-purple-600 hover:underline">Política de Privacidad</a>
        </p>
      </div>
    </form>
  );
};

export default StripePago;
