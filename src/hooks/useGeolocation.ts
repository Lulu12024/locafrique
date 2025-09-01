
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LocationData {
  country: string;
  countryCode: string;
  city: string;
  language: string;
  currency: string;
  latitude?: number;
  longitude?: number;
}

export const useGeolocation = () => {
  const { i18n } = useTranslation();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mapping des codes pays vers les langues et devises
  const getLanguageAndCurrency = (countryCode: string): { language: string; currency: string } => {
    const mapping: { [key: string]: { language: string; currency: string } } = {
      'FR': { language: 'fr', currency: '€' },
      'BE': { language: 'fr', currency: '€' },
      'CH': { language: 'fr', currency: 'CHF' },
      'CA': { language: 'fr', currency: '$' }, // Canada français
      'BJ': { language: 'fr', currency: 'FCFA' }, // Bénin
      'SN': { language: 'fr', currency: 'FCFA' }, // Sénégal
      'CI': { language: 'fr', currency: 'FCFA' }, // Côte d'Ivoire
      'ML': { language: 'fr', currency: 'FCFA' }, // Mali
      'BF': { language: 'fr', currency: 'FCFA' }, // Burkina Faso
      'NE': { language: 'fr', currency: 'FCFA' }, // Niger
      'TG': { language: 'fr', currency: 'FCFA' }, // Togo
      'GA': { language: 'fr', currency: 'FCFA' }, // Gabon
      'CM': { language: 'fr', currency: 'FCFA' }, // Cameroun
      'TD': { language: 'fr', currency: 'FCFA' }, // Tchad
      'CF': { language: 'fr', currency: 'FCFA' }, // Centrafrique
      'CG': { language: 'fr', currency: 'FCFA' }, // Congo
      'US': { language: 'en', currency: '$' },
      'GB': { language: 'en', currency: '£' },
      'AU': { language: 'en', currency: '$' },
      'NZ': { language: 'en', currency: '$' },
      'IE': { language: 'en', currency: '€' },
      'ZA': { language: 'en', currency: 'R' },
      'ES': { language: 'es', currency: '€' },
      'MX': { language: 'es', currency: '$' },
      'AR': { language: 'es', currency: '$' },
      'CO': { language: 'es', currency: '$' },
      'PE': { language: 'es', currency: 'S/' },
      'CL': { language: 'es', currency: '$' },
      'VE': { language: 'es', currency: '$' },
      'EC': { language: 'es', currency: '$' },
      'GT': { language: 'es', currency: 'Q' },
      'HN': { language: 'es', currency: 'L' },
      'SV': { language: 'es', currency: '$' },
      'NI': { language: 'es', currency: 'C$' },
      'CR': { language: 'es', currency: '₡' },
      'PA': { language: 'es', currency: '$' },
      'DO': { language: 'es', currency: '$' },
      'CU': { language: 'es', currency: '$' },
      'UY': { language: 'es', currency: '$' },
      'PY': { language: 'es', currency: '₲' },
      'BO': { language: 'es', currency: 'Bs' },
      'PT': { language: 'pt', currency: '€' },
      'BR': { language: 'pt', currency: 'R$' },
      'AO': { language: 'pt', currency: 'Kz' },
      'MZ': { language: 'pt', currency: 'MT' },
      'CV': { language: 'pt', currency: '$' },
      'GW': { language: 'pt', currency: 'FCFA' },
      'ST': { language: 'pt', currency: 'Db' },
      'TL': { language: 'pt', currency: '$' },
      'MO': { language: 'pt', currency: 'P' },
    };

    return mapping[countryCode] || { language: 'en', currency: '$' };
  };

  // Fonction pour obtenir la géolocalisation via l'API du navigateur
  const getBrowserLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Erreur géolocalisation navigateur:', error.message);
          reject(error);
        },
        {
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
          enableHighAccuracy: false
        }
      );
    });
  };

  // Fonction pour obtenir les informations de localisation via l'IP
  const getLocationFromIP = async (): Promise<LocationData> => {
    try {
      // Essayer d'abord avec ipapi.co (gratuit et fiable)
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Échec ipapi.co');
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.reason || 'Erreur API');
      }

      const { language, currency } = getLanguageAndCurrency(data.country_code);

      return {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'US',
        city: data.city || 'Unknown',
        language,
        currency,
        latitude: data.latitude,
        longitude: data.longitude
      };
    } catch (error) {
      console.error('Erreur avec ipapi.co:', error);
      
      // Fallback vers une autre API gratuite
      try {
        const response2 = await fetch('https://api.country.is/');
        if (!response2.ok) throw new Error('Échec country.is');
        
        const data2 = await response2.json();
        const { language, currency } = getLanguageAndCurrency(data2.country);

        return {
          country: data2.country || 'US',
          countryCode: data2.country || 'US',
          city: 'Unknown',
          language,
          currency
        };
      } catch (error2) {
        console.error('Erreur avec country.is:', error2);
        
        // Dernière tentative avec une méthode simple
        const { language, currency } = getLanguageAndCurrency('US');
        return {
          country: 'United States',
          countryCode: 'US',
          city: 'Unknown',
          language,
          currency
        };
      }
    }
  };

  // Fonction pour obtenir les informations de localisation via les coordonnées
  const getLocationFromCoords = async (lat: number, lng: number): Promise<LocationData> => {
    try {
      // Utiliser une API de géocodage inverse gratuite
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (!response.ok) throw new Error('Échec geocoding');
      
      const data = await response.json();
      const { language, currency } = getLanguageAndCurrency(data.countryCode);

      return {
        country: data.countryName || 'Unknown',
        countryCode: data.countryCode || 'US',
        city: data.locality || data.city || 'Unknown',
        language,
        currency,
        latitude: lat,
        longitude: lng
      };
    } catch (error) {
      console.error('Erreur geocoding:', error);
      // Fallback vers la méthode IP
      return getLocationFromIP();
    }
  };

  // Effet principal pour détecter la localisation
  useEffect(() => {
    const detectLocation = async () => {
      // Vérifier si l'utilisateur a déjà défini ses préférences
      const savedLanguage = localStorage.getItem('language');
      const savedLocation = localStorage.getItem('userLocation');
      
      if (savedLanguage && savedLocation) {
        try {
          const parsedLocation = JSON.parse(savedLocation);
          setLocation(parsedLocation);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Erreur parsing location sauvegardée:', e);
        }
      }

      try {
        setIsLoading(true);
        
        // Essayer d'abord la géolocalisation précise du navigateur
        try {
          const coords = await getBrowserLocation();
          const locationData = await getLocationFromCoords(coords.latitude, coords.longitude);
          
          // Sauvegarder les données
          localStorage.setItem('userLocation', JSON.stringify(locationData));
          
          // Changer automatiquement la langue si ce n'est pas déjà fait
          if (!savedLanguage && locationData.language !== i18n.language) {
            await i18n.changeLanguage(locationData.language);
            localStorage.setItem('language', locationData.language);
          }
          
          setLocation(locationData);
        } catch (browserError) {
          // Fallback vers la détection par IP
          console.log('Géolocalisation navigateur échouée, utilisation de l\'IP');
          const locationData = await getLocationFromIP();
          
          // Sauvegarder les données
          localStorage.setItem('userLocation', JSON.stringify(locationData));
          
          // Changer automatiquement la langue si ce n'est pas déjà fait
          if (!savedLanguage && locationData.language !== i18n.language) {
            await i18n.changeLanguage(locationData.language);
            localStorage.setItem('language', locationData.language);
          }
          
          setLocation(locationData);
        }
      } catch (error: any) {
        console.error('Erreur détection localisation:', error);
        setError(error.message);
        
        // Valeurs par défaut
        const defaultLocation: LocationData = {
          country: 'France',
          countryCode: 'FR',
          city: 'Paris',
          language: 'fr',
          currency: '€'
        };
        
        setLocation(defaultLocation);
        localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, [i18n]);

  // Fonction pour forcer une nouvelle détection
  const refreshLocation = () => {
    localStorage.removeItem('userLocation');
    setLocation(null);
    setError(null);
    setIsLoading(true);
  };

  return {
    location,
    isLoading,
    error,
    refreshLocation
  };
};
