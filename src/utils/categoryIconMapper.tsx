import React from 'react';
import {
  Smartphone,
  Car,
  Wrench,
  Printer,
  Gamepad2,
  Music,
  Refrigerator,
  Headphones,
  Hammer,
  Truck,
  Settings,
  Zap,
  Calendar,
  Flower,
  Package
} from 'lucide-react';

// Mapping des chaînes d'icônes vers les composants Lucide
export const ICON_MAPPING: { [key: string]: React.ComponentType<any> } = {
  // Icônes principales
  'Smartphone': Smartphone,
  'Car': Car,
  'Wrench': Wrench,
  'Printer': Printer,
  'Gamepad2': Gamepad2,
  'Music': Music,
  'Refrigerator': Refrigerator,
  'Headphones': Headphones,
  'Hammer': Hammer,
  'Truck': Truck,
  'Settings': Settings,
  
  // Icônes qui apparaissent dans l'erreur
  'wrench': Wrench,
  'hammer': Hammer,
  'zap': Zap,
  'calendar': Calendar,
  'flower': Flower,
  'move': Settings,
  
  // Fallback
  'default': Package
};

// Composant pour rendre une icône de manière sécurisée
interface CategoryIconProps {
  iconName: string | null | undefined;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  iconName, 
  className = "h-6 w-6", 
  size = 24 
}) => {
  if (!iconName) {
    const DefaultIcon = ICON_MAPPING['default'];
    return <DefaultIcon className={className} size={size} />;
  }

  // Nettoyer le nom de l'icône (enlever les espaces, mettre en forme correcte)
  const cleanIconName = iconName.trim();
  
  // Chercher l'icône dans le mapping
  const IconComponent = ICON_MAPPING[cleanIconName] || ICON_MAPPING['default'];
  
  return <IconComponent className={className} size={size} />;
};

// Fonction utilitaire pour obtenir le nom correct de l'icône
export const getCorrectIconName = (iconName: string | null | undefined): string => {
  if (!iconName) return 'default';
  
  const cleanName = iconName.trim();
  
  // Mapping des noms problématiques vers les noms corrects
  const nameMapping: { [key: string]: string } = {
    'wrench': 'Wrench',
    'hammer': 'Hammer', 
    'zap': 'Zap',
    'calendar': 'Calendar',
    'flower': 'Flower',
    'move': 'Settings'
  };
  
  return nameMapping[cleanName] || cleanName;
};

// Catégories corrigées avec mapping correct
export const getCorrectedCategories = () => {
  return [
    {
      id: 'construction',
      name: 'Équipements de construction',
      icon: 'Hammer',
      description: 'Outils et équipements de construction'
    },
    {
      id: 'agriculture', 
      name: 'Matériels agricoles',
      icon: 'Truck',
      description: 'Équipements agricoles et forestiers'
    },
    {
      id: 'transport',
      name: 'Véhicules de transport', 
      icon: 'Car',
      description: 'Véhicules et moyens de transport'
    },
    {
      id: 'manutention',
      name: 'Équipements de manutention',
      icon: 'Settings',
      description: 'Équipements de levage et manutention'
    },
    {
      id: 'electrique',
      name: 'Outils électriques',
      icon: 'Zap', 
      description: 'Outils et équipements électriques'
    },
    {
      id: 'sport',
      name: 'Équipements de sport',
      icon: 'Gamepad2',
      description: 'Matériel sportif et de loisirs'
    },
    {
      id: 'evenementiel',
      name: 'Événementiel',
      icon: 'Music',
      description: 'Matériel pour événements'
    },
    {
      id: 'jardinage',
      name: 'Jardinage',
      icon: 'Flower',
      description: 'Outils de jardinage'
    },
    {
      id: 'bricolage',
      name: 'Bricolage',
      icon: 'Wrench',
      description: 'Outils de bricolage'
    }
  ];
};
