
export const EQUIPMENT_CATEGORIES = {
  "construction": { 
    name: "Équipements de construction", 
    icon: "🏗️",
    subcategories: ["outillage", "materiel_lourd", "echafaudage", "betonniere"]
  },
  "agriculture": { 
    name: "Matériels agricoles", 
    icon: "🚜",
    subcategories: ["tracteur", "moissonneuse", "pulverisateur", "semoir"]
  },
  "transport": { 
    name: "Véhicules de transport", 
    icon: "🚚",
    subcategories: ["camion", "remorque", "utilitaire", "transport_personnes"]
  },
  "manutention": { 
    name: "Équipements de manutention", 
    icon: "🏋️",
    subcategories: ["chariot_elevateur", "grue", "palan", "transpalette"]
  },
  "electrique": { 
    name: "Outils électriques", 
    icon: "⚡",
    subcategories: ["perceuse", "scie", "meuleuse", "groupe_electrogene"]
  },
  "sport": { 
    name: "Équipements de sport", 
    icon: "⚽",
    subcategories: ["fitness", "nautique", "montagne", "terrain"]
  }
} as const;

export type CategoryKey = keyof typeof EQUIPMENT_CATEGORIES;
export type CategoryData = typeof EQUIPMENT_CATEGORIES[CategoryKey];
