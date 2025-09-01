import React from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import bannerImage from '@/assets/mobile-banner-person.jpg';

const MobileBanner = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Seulement visible sur mobile
  if (!isMobile) return null;

  return (
    <div className="bg-primary mx-4 my-6 rounded-2xl overflow-hidden">
      <div className="flex items-center p-6">
        <div className="flex-1 pr-4">
          <h3 className="text-white font-semibold text-lg mb-2">
            {t('banner.title', 'Louez facilement')}
          </h3>
          <p className="text-white/90 text-sm leading-relaxed">
            {t('banner.description', 'Découvrez des milliers d\'outils et équipements près de chez vous. Location simple, rapide et sécurisée.')}
          </p>
        </div>
        
        <div className="flex-shrink-0 w-24 h-24">
          <img
            src={bannerImage}
            alt="Person using rental equipment"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default MobileBanner;