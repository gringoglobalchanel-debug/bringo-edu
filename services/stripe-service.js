import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51Q...'); // Tu clave pública de Stripe

export class StripeService {
  static async createPaymentIntent(plan, usuario) {
    try {
      const amount = plan === 'monthly' ? 900 : 6000; // en centavos
      
      const response = await fetch('https://tu-backend.com/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          plan: plan,
          userId: usuario.uid,
          email: usuario.email,
          metadata: {
            product: 'bringo_edu_premium',
            plan_type: plan
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Error creando intent de pago');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en createPaymentIntent:', error);
      throw error;
    }
  }

  static async confirmPayment(stripe, elements, clientSecret) {
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/pago-exitoso`,
        },
        redirect: 'if_required'
      });

      if (error) {
        throw error;
      }

      return paymentIntent;
    } catch (error) {
      console.error('Error confirmando pago:', error);
      throw error;
    }
  }
}
