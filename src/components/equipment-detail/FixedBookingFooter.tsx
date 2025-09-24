// src/components/equipment-detail/FixedBookingFooter.tsx - Version style Airbnb
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EquipmentData } from '@/types/supabase';
import { cn } from '@/lib/utils';

interface FixedBookingFooterProps {
  equipment: EquipmentData;
  onReservationClick: () => void;
  className?: string;
  selectedStartDate?: Date;
  selectedEndDate?: Date;
  totalDays?: number;
}

export function FixedBookingFooter({ 
  equipment, 
  onReservationClick,
  className,
  selectedStartDate,
  selectedEndDate,
  totalDays = 1
}: FixedBookingFooterProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Gérer la visibilité selon le scroll - STYLE AIRBNB
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Vérifier immédiatement

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculer le prix total
  const dailyPrice = equipment.daily_price || 0;
  const totalPrice = dailyPrice * totalDays;

  // Formater les dates - Style français
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Version mobile - STYLE AIRBNB AMÉLIORÉ */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 block lg:hidden transition-all duration-300 ease-out",
        className
      )}>
        {/* Barre principale style Airbnb */}
        <div className="bg-white border-t border-gray-200 shadow-2xl">
          {/* Indicateur de swipe subtil */}
          <div className="flex justify-center py-1">
            <div className="w-8 h-1 bg-gray-300 rounded-full opacity-40" />
          </div>
          
          <div className="px-4 pb-4 pt-2 safe-area-inset-bottom">
            <div className="flex items-center justify-between">
              {/* Section prix et informations - Style Airbnb */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-xl font-bold text-gray-900 tracking-tight">
                    {dailyPrice.toLocaleString()} FCFA
                  </span>
                  <span className="text-gray-600 text-sm font-medium">par jour</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  {selectedStartDate && selectedEndDate ? (
                    <>
                      <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{formatDate(selectedStartDate)}–{formatDate(selectedEndDate)}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="flex-shrink-0">{totalDays} jour{totalDays > 1 ? 's' : ''}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>Disponible immédiatement</span>
                    </>
                  )}
                </div>
                
                {/* Total si plusieurs jours - Style highlight */}
                {totalDays > 1 && (
                  <div className="text-sm font-semibold text-gray-900 mt-1 flex items-center">
                    <span>Total: {totalPrice.toLocaleString()} FCFA</span>
                    <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                      -5% séjour long
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Bouton réserver - STYLE AIRBNB */}
              <Button 
                onClick={onReservationClick}
                className={cn(
                  "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ml-4 rounded-lg",
                  "px-8 py-3 text-base min-w-[120px]",
                  "disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                )}
                disabled={equipment.status !== 'disponible'}
                size="lg"
              >
                Réserver
              </Button>
            </div>
            
            {/* Informations supplémentaires - Style Airbnb compact */}
            <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-black" />
                  <span className="font-medium">4.89</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>127 avis</span>
                </div>
                <span className="text-gray-400">•</span>
                <Badge variant="outline" className="text-xs py-0 px-2 border-green-200 text-green-700">
                  Hôte vérifié
                </Badge>
              </div>
            </div>

            {/* Message de confiance - Style Airbnb */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                Vous ne serez pas débité pour le moment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Version desktop - STYLE AIRBNB DESKTOP */}
      <div className={cn(
        "hidden lg:block fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "translate-y-0 opacity-100" : "translate-y-0 opacity-100"
      )}>
        <div className="bg-white border-t border-gray-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Informations sur l'équipement - Desktop */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                    {equipment.images?.[0] && (
                      <img 
                        src={typeof equipment.images[0] === 'string' ? equipment.images[0] : equipment.images[0].image_url}
                        alt={equipment.title} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate max-w-xs">
                      {equipment.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="h-3 w-3 fill-current text-black" />
                      <span>4.89</span>
                      <span className="text-gray-400">•</span>
                      <span>127 avis</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section prix et bouton - Desktop */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {dailyPrice.toLocaleString()} FCFA
                    </span>
                    <span className="text-gray-600">par jour</span>
                  </div>
                  {selectedStartDate && selectedEndDate && (
                    <div className="text-sm text-gray-600 mt-1">
                      {formatDate(selectedStartDate)} - {formatDate(selectedEndDate)} • {totalDays} jour{totalDays > 1 ? 's' : ''}
                    </div>
                  )}
                  {totalDays > 1 && (
                    <div className="text-lg font-semibold text-gray-900 mt-1">
                      Total: {totalPrice.toLocaleString()} FCFA
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={onReservationClick}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-12 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={equipment.status !== 'disponible'}
                  size="lg"
                >
                  Réserverss maintenant
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}