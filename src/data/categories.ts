// src/data/categories.ts
// Catégories conformes au cahier des charges 3W-LOC

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
  description: string;
  icon?: string;
  color?: string;
}

export const EQUIPMENT_CATEGORIES: Record<string, Category> = {
  'electronique': {
    id: 'electronique',
    name: 'Électronique',
    description: 'Appareils photo, smartphones, tablettes, ordinateurs portables',
    subcategories: [
      'Appareils photo',
      'Caméras',
      'Smartphones',
      'Tablettes',
      'Ordinateurs portables',
      'Consoles de jeux'
    ],
    icon: 'Smartphone',
    color: '#3B82F6'
  },
  
  'vehicules': {
    id: 'vehicules',
    name: 'Véhicules',
    description: 'Voitures, motos, vélos, trottinettes et véhicules utilitaires',
    subcategories: [
      'Voitures',
      'Motos',
      'Vélos',
      'Trottinettes électriques',
      'Camions',
      'Caravans'
    ],
    icon: 'Car',
    color: '#EF4444'
  },
  
  'outils-equipements': {
    id: 'outils-equipements',
    name: 'Outils et Équipements',
    description: 'Outils professionnels pour jardinage, bricolage et construction',
    subcategories: [
      'Outils de jardinage',
      'Outils de bricolage',
      'Équipements de construction',
      'Outils de mécanique'
    ],
    icon: 'Wrench',
    color: '#10B981'
  },
  
  'materiel-bureau': {
    id: 'materiel-bureau',
    name: 'Matériel de Bureau',
    description: 'Équipements informatiques et mobilier de bureau',
    subcategories: [
      'Imprimantes',
      'Projecteurs',
      'Écrans',
      'Meubles de bureau'
    ],
    icon: 'Printer',
    color: '#6366F1'
  },
  
  'equipements-loisirs': {
    id: 'equipements-loisirs',
    name: 'Équipements de Loisirs',
    description: 'Matériel de sport, instruments de musique, jeux et camping',
    subcategories: [
      'Jeux de société',
      'Équipements de sport',
      'Instruments de musique',
      'Matériel de camping'
    ],
    icon: 'Gamepad2',
    color: '#EC4899'
  },
  
  'evenements': {
    id: 'evenements',
    name: 'Événements',
    description: 'Matériel pour événements, fêtes et manifestations',
    subcategories: [
      'Équipements de sonorisation',
      'Éclairage',
      'Tables et chaises',
      'Tentes',
      'Décorations'
    ],
    icon: 'Music',
    color: '#F59E0B'
  },
  
  'electromenager': {
    id: 'electromenager',
    name: 'Électroménager',
    description: 'Appareils électroménagers pour la maison',
    subcategories: [
      'Réfrigérateurs',
      'Machines à laver',
      'Micro-ondes',
      'Aspirateurs'
    ],
    icon: 'Refrigerator',
    color: '#06B6D4'
  },
  
  'materiel-audiovisuel': {
    id: 'materiel-audiovisuel',
    name: 'Matériel Audiovisuel',
    description: 'Équipements audio et vidéo professionnels',
    subcategories: [
      'Enceintes',
      'Micros',
      'Équipements DJ',
      'Caméras professionnelles'
    ],
    icon: 'Headphones',
    color: '#8B5CF6'
  },
  
  'bricolage-jardinage': {
    id: 'bricolage-jardinage',
    name: 'Bricolage et Jardinage',
    description: 'Outils et équipements pour l\'entretien extérieur',
    subcategories: [
      'Tondeuses',
      'Tronçonneuses',
      'Taille-haies',
      'Outillage divers'
    ],
    icon: 'Hammer',
    color: '#16A34A'
  },
  
  'equipements-transport': {
    id: 'equipements-transport',
    name: 'Équipements de Transport',
    description: 'Véhicules et équipements de transport lourd',
    subcategories: [
      'Remorques',
      'Pelles mécaniques',
      'Chariots élévateurs'
    ],
    icon: 'Truck',
    color: '#475569'
  }
};

// Type pour les clés de catégories
export type CategoryKey = keyof typeof EQUIPMENT_CATEGORIES;

// Liste ordonnée des catégories pour l'affichage
export const CATEGORY_ORDER: CategoryKey[] = [
  'electronique',
  'vehicules', 
  'outils-equipements',
  'materiel-bureau',
  'equipements-loisirs',
  'evenements',
  'electromenager',
  'materiel-audiovisuel',
  'bricolage-jardinage',
  'equipements-transport'
];

// Fonction utilitaire pour obtenir une catégorie
export const getCategory = (categoryId: string): Category | undefined => {
  return EQUIPMENT_CATEGORIES[categoryId];
};

// Fonction utilitaire pour obtenir toutes les catégories
export const getAllCategories = (): Category[] => {
  return CATEGORY_ORDER.map(key => EQUIPMENT_CATEGORIES[key]);
};

// Fonction utilitaire pour obtenir les sous-catégories d'une catégorie
export const getSubcategories = (categoryId: string): string[] => {
  const category = getCategory(categoryId);
  return category ? category.subcategories : [];
};

// Fonction utilitaire pour rechercher une catégorie par nom
export const findCategoryByName = (name: string): Category | undefined => {
  return Object.values(EQUIPMENT_CATEGORIES).find(
    category => category.name.toLowerCase().includes(name.toLowerCase())
  );
};

// Fonction utilitaire pour rechercher des catégories par sous-catégorie
export const findCategoriesBySubcategory = (subcategory: string): Category[] => {
  return Object.values(EQUIPMENT_CATEGORIES).filter(
    category => category.subcategories.some(
      sub => sub.toLowerCase().includes(subcategory.toLowerCase())
    )
  );
};

// Validation des catégories pour les formulaires
export const validateCategory = (categoryId: string): boolean => {
  return categoryId in EQUIPMENT_CATEGORIES;
};

export const validateSubcategory = (categoryId: string, subcategory: string): boolean => {
  const category = getCategory(categoryId);
  return category ? category.subcategories.includes(subcategory) : false;
};

// Options pour les selects de formulaires
export const getCategoryOptions = () => {
  return CATEGORY_ORDER.map(key => ({
    value: key,
    label: EQUIPMENT_CATEGORIES[key].name,
    description: EQUIPMENT_CATEGORIES[key].description
  }));
};

export const getSubcategoryOptions = (categoryId: string) => {
  const category = getCategory(categoryId);
  if (!category) return [];
  
  return category.subcategories.map(sub => ({
    value: sub,
    label: sub
  }));
};

// Statistiques des catégories (à adapter selon vos données réelles)
export const CATEGORY_STATS = {
  'electronique': { count: 342, trending: true },
  'vehicules': { count: 158, trending: false },
  'outils-equipements': { count: 567, trending: true },
  'materiel-bureau': { count: 89, trending: false },
  'equipements-loisirs': { count: 234, trending: true },
  'evenements': { count: 127, trending: false },
  'electromenager': { count: 76, trending: false },
  'materiel-audiovisuel': { count: 145, trending: true },
  'bricolage-jardinage': { count: 198, trending: false },
  'equipements-transport': { count: 67, trending: false }
};

// Fonction pour obtenir les statistiques d'une catégorie
export const getCategoryStats = (categoryId: string) => {
  return CATEGORY_STATS[categoryId as CategoryKey] || { count: 0, trending: false };
};

// Catégories populaires (les plus utilisées)
export const getPopularCategories = (limit: number = 5): Category[] => {
  return CATEGORY_ORDER
    .map(key => EQUIPMENT_CATEGORIES[key])
    .sort((a, b) => {
      const statsA = getCategoryStats(a.id);
      const statsB = getCategoryStats(b.id);
      return statsB.count - statsA.count;
    })
    .slice(0, limit);
};

// Catégories en tendance
export const getTrendingCategories = (): Category[] => {
  return CATEGORY_ORDER
    .map(key => EQUIPMENT_CATEGORIES[key])
    .filter(category => getCategoryStats(category.id).trending);
};

// Export par défaut
export default EQUIPMENT_CATEGORIES;