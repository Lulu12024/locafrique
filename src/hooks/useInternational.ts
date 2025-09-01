
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from './useGeolocation';

interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  cities: string[];
}

export const useInternational = () => {
  const { i18n } = useTranslation();
  const { location } = useGeolocation();
  const [countries, setCountries] = useState<Country[]>([]);

  const getCountries = (): Country[] => {
    switch (i18n.language) {
      case 'fr':
        return [
          {
            code: 'FR',
            name: 'France',
            flag: '🇫🇷',
            currency: '€',
            cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier']
          },
          {
            code: 'BJ',
            name: 'Bénin',
            flag: '🇧🇯',
            currency: 'FCFA',
            cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou', 'Bohicon']
          },
          {
            code: 'SN',
            name: 'Sénégal',
            flag: '🇸🇳',
            currency: 'FCFA',
            cities: ['Dakar', 'Thiès', 'Kaolack', 'Saint-Louis', 'Ziguinchor', 'Diourbel']
          },
          {
            code: 'CI',
            name: 'Côte d\'Ivoire',
            flag: '🇨🇮',
            currency: 'FCFA',
            cities: ['Abidjan', 'Bouaké', 'Daloa', 'Korhogo', 'San-Pédro', 'Yamoussoukro']
          }
        ];
      case 'en':
        return [
          {
            code: 'US',
            name: 'United States',
            flag: '🇺🇸',
            currency: '$',
            cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego']
          },
          {
            code: 'GB',
            name: 'United Kingdom',
            flag: '🇬🇧',
            currency: '£',
            cities: ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Glasgow']
          },
          {
            code: 'CA',
            name: 'Canada',
            flag: '🇨🇦',
            currency: '$',
            cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City']
          },
          {
            code: 'AU',
            name: 'Australia',
            flag: '🇦🇺',
            currency: '$',
            cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle']
          }
        ];
      case 'es':
        return [
          {
            code: 'ES',
            name: 'España',
            flag: '🇪🇸',
            currency: '€',
            cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma']
          },
          {
            code: 'MX',
            name: 'México',
            flag: '🇲🇽',
            currency: '$',
            cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan']
          },
          {
            code: 'AR',
            name: 'Argentina',
            flag: '🇦🇷',
            currency: '$',
            cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Tucumán', 'Mar del Plata', 'Salta']
          },
          {
            code: 'CO',
            name: 'Colombia',
            flag: '🇨🇴',
            currency: '$',
            cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira']
          }
        ];
      case 'pt':
        return [
          {
            code: 'PT',
            name: 'Portugal',
            flag: '🇵🇹',
            currency: '€',
            cities: ['Lisboa', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Funchal', 'Coimbra', 'Setúbal']
          },
          {
            code: 'BR',
            name: 'Brasil',
            flag: '🇧🇷',
            currency: 'R$',
            cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba']
          },
          {
            code: 'AO',
            name: 'Angola',
            flag: '🇦🇴',
            currency: 'Kz',
            cities: ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe']
          },
          {
            code: 'MZ',
            name: 'Moçambique',
            flag: '🇲🇿',
            currency: 'MT',
            cities: ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala', 'Quelimane', 'Tete']
          }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    setCountries(getCountries());
  }, [i18n.language]);

  const getAllCities = () => {
    return countries.flatMap(country => country.cities);
  };

  const getCurrencySymbol = () => {
    // Utiliser directement la devise détectée par géolocalisation
    if (location?.currency) {
      return location.currency;
    }
    
    // Fallback selon la langue si pas de géolocalisation
    switch (i18n.language) {
      case 'en':
        return '$';
      case 'es':
      case 'fr':
      case 'pt':
        return '€';
      default:
        return '€';
    }
  };

  // Obtenir les villes du pays de l'utilisateur en priorité
  const getLocalCities = () => {
    if (location?.countryCode) {
      const userCountry = countries.find(country => country.code === location.countryCode);
      if (userCountry) {
        return userCountry.cities;
      }
    }
    return getAllCities();
  };

  // Obtenir le pays de l'utilisateur
  const getUserCountry = () => {
    if (location?.countryCode) {
      return countries.find(country => country.code === location.countryCode);
    }
    return countries[0]; // Retourner le premier pays par défaut
  };

  return {
    countries,
    getAllCities,
    getLocalCities,
    getCurrencySymbol,
    getUserCountry,
    userLocation: location
  };
};
