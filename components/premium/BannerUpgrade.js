import React from 'react';
import { Zap, Crown } from 'lucide-react';

const BannerUpgrade = ({ diasRestantes, onUpgrade, trackEvent }) => {
  if (diasRestantes <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6" />
          <div>
            <h4 className="font-bold">¡Prueba Premium gratis!</h4>
            <p className="text-sm opacity-90">
              {diasRestantes} días restantes en tu prueba gratuita
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            trackEvent('upgrade_click_banner');
            onUpgrade();
          }}
          className="bg-white text-orange-600 px-6 py-2 rounded-lg hover:bg-orange-50 transition font-semibold flex items-center gap-2"
        >
          <Crown className="w-4 h-4" />
          Actualizar ahora
        </button>
      </div>
    </div>
  );
};

export default BannerUpgrade;
