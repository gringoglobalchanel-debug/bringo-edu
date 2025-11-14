import React from 'react';
import { Crown, AlertCircle } from 'lucide-react';

const AlertaLimiteClases = ({ onUpgrade, trackEvent }) => {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-red-900 mb-2">¡Límite de clases alcanzado!</h3>
          <p className="text-red-800 mb-4">
            La versión gratuita permite solo 1 clase. Actualiza a Premium para crear clases ilimitadas 
            y acceder a todas las funciones avanzadas.
          </p>
          <button
            onClick={() => {
              trackEvent('upgrade_click_limite_clases');
              onUpgrade();
            }}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Desbloquear Clases Ilimitadas
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertaLimiteClases;
