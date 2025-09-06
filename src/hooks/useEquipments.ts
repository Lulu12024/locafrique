// src/hooks/useEquipments.ts - Version corrigée compatible
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { EquipmentData } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';
import { EQUIPMENT_CATEGORIES, validateCategory } from '@/data/categories';

interface AddEquipmentData {
  title: string;
  description: string;
  daily_price: number;
  deposit_amount?: number;
  category: string;
  subcategory?: string;
  condition?: string;
  brand?: string;
  year?: number;
  location?: string;
  city?: string;
  country?: string;
}

export function useEquipments() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Fonction de validation des données d'entrée
  const validateEquipmentData = (data: AddEquipmentData): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validation des champs obligatoires
    if (!data.title?.trim()) {
      errors.push("Le titre est obligatoire");
    } else if (data.title.trim().length < 3) {
      errors.push("Le titre doit contenir au moins 3 caractères");
    } else if (data.title.trim().length > 100) {
      errors.push("Le titre ne peut pas dépasser 100 caractères");
    }

    if (!data.description?.trim()) {
      errors.push("La description est obligatoire");
    } else if (data.description.trim().length < 10) {
      errors.push("La description doit contenir au moins 10 caractères");
    } else if (data.description.trim().length > 1000) {
      errors.push("La description ne peut pas dépasser 1000 caractères");
    }

    if (!data.daily_price || data.daily_price <= 0) {
      errors.push("Le prix journalier doit être supérieur à 0");
    } else if (data.daily_price > 1000000) {
      errors.push("Le prix journalier ne peut pas dépasser 1 000 000 FCFA");
    }

    if (data.deposit_amount !== undefined && data.deposit_amount < 0) {
      errors.push("Le montant de la caution ne peut pas être négatif");
    }

    if (!data.category) {
      errors.push("La catégorie est obligatoire");
    } else if (!validateCategory(data.category)) {
      errors.push("La catégorie sélectionnée n'est pas valide");
    }

    if (data.year !== undefined && (data.year < 1900 || data.year > new Date().getFullYear() + 1)) {
      errors.push("L'année doit être comprise entre 1900 et l'année prochaine");
    }

    return { valid: errors.length === 0, errors };
  };

  // Fonction pour normaliser les données avant insertion
  const normalizeEquipmentData = (data: AddEquipmentData, userId: string) => {
    return {
      title: data.title.trim(),
      description: data.description.trim(),
      daily_price: Number(data.daily_price),
      deposit_amount: data.deposit_amount ? Number(data.deposit_amount) : 0,
      category: data.category,
      subcategory: data.subcategory?.trim() || null,
      condition: data.condition || 'bon',
      brand: data.brand?.trim() || null,
      year: data.year ? Number(data.year) : null,
      location: data.location?.trim() || '',
      city: data.city?.trim() || 'Cotonou',
      country: data.country?.trim() || 'Bénin',
      status: 'disponible',
      owner_id: userId
    };
  };

  // Fonction d'analyse des erreurs d'insertion
  const analyzeInsertError = (error: any): { message: string; solution: string } => {
    switch (error.code) {
      case '23505':
        return {
          message: "Un équipement avec ce nom existe déjà dans votre liste.",
          solution: "Modifiez le titre de votre équipement pour le rendre unique."
        };
      
      case '23502':
        return {
          message: "Certaines informations obligatoires sont manquantes.",
          solution: "Vérifiez que tous les champs requis sont remplis."
        };
      
      case '42501':
        return {
          message: "Permissions insuffisantes pour créer cet équipement.",
          solution: "Reconnectez-vous et vérifiez vos droits d'accès."
        };
      
      case '23503':
        return {
          message: "Référence invalide dans les données fournies.",
          solution: "Vérifiez que la catégorie sélectionnée est valide."
        };
      
      case 'PGRST301':
        return {
          message: "Politique de sécurité: création non autorisée.",
          solution: "Contactez l'administrateur pour vérifier vos permissions."
        };
      
      default:
        return {
          message: error.message || "Erreur inconnue lors de la création.",
          solution: "Réessayez dans quelques instants ou contactez le support."
        };
    }
  };

  // Fonction principale d'ajout d'équipment - COMPATIBLE avec AddEquipmentForm
  const addEquipment = useCallback(async (equipmentData: AddEquipmentData): Promise<EquipmentData> => {
    // Vérification préliminaire de l'utilisateur
    if (!user?.id) {
      console.error("❌ Utilisateur non connecté");
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour ajouter un équipement.",
        variant: "destructive",
      });
      throw new Error("Utilisateur non connecté");
    }

    setIsLoading(true);

    try {
      console.log("📝 Début de l'ajout d'équipement:", equipmentData);

      // Étape 1: Validation des données
      const validation = validateEquipmentData(equipmentData);
      if (!validation.valid) {
        const errorMessage = validation.errors.join(", ");
        console.error("❌ Validation échouée:", validation.errors);
        
        toast({
          title: "Données invalides",
          description: errorMessage,
          variant: "destructive",
        });
        
        throw new Error(errorMessage);
      }

      // Étape 2: Vérification de la session utilisateur
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !sessionData.user) {
        console.error("❌ Session invalide:", sessionError);
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour continuer.",
          variant: "destructive",
        });
        throw new Error("Session invalide");
      }

      // Étape 3: Normalisation des données
      const insertData = normalizeEquipmentData(equipmentData, user.id);
      console.log("📦 Données normalisées pour insertion:", insertData);

      // Étape 4: Vérification des contraintes métier
      // Vérifier si l'utilisateur a un profil complet
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, city')
        .eq('user_id', user.id)
        .single();

      if (profileError || !userProfile?.first_name || !userProfile?.last_name) {
        console.warn("⚠️ Profil utilisateur incomplet:", profileError);
        toast({
          title: "Profil incomplet",
          description: "Veuillez compléter votre profil avant d'ajouter un équipement.",
          variant: "destructive",
        });
        throw new Error("Profil incomplet");
      }

      // Étape 5: Insertion dans la base de données
      const { data: insertedData, error: insertError } = await supabase
        .from('equipments')
        .insert(insertData)
        .select(`
          *,
          owner:profiles!equipments_owner_id_fkey(*)
        `)
        .single();

      if (insertError) {
        console.error("❌ Erreur lors de l'insertion:", insertError);
        
        // Analyse détaillée de l'erreur
        const { message } = analyzeInsertError(insertError);
        
        toast({
          title: "Erreur lors de l'ajout",
          description: message,
          variant: "destructive",
        });
        
        throw new Error(message);
      }

      if (!insertedData) {
        console.error("❌ Aucune donnée retournée après insertion");
        toast({
          title: "Erreur inattendue",
          description: "L'équipement n'a pas pu être créé correctement.",
          variant: "destructive",
        });
        throw new Error("Aucune donnée retournée");
      }

      console.log("✅ Équipement créé avec succès:", insertedData);

      // Toast de succès avec détails
      toast({
        title: "🎉 Équipement ajouté avec succès !",
        description: (
          <div>
            <p className="font-medium">"{insertedData.title}"</p>
            <p className="text-sm text-gray-600">
              Catégorie: {EQUIPMENT_CATEGORIES[insertedData.category]?.name || insertedData.category}
            </p>
            <p className="text-sm text-gray-600">
              Prix: {insertedData.daily_price.toLocaleString()} FCFA/jour
            </p>
          </div>
        ),
        duration: 5000,
      });

      // Retourner directement les données comme attendu par AddEquipmentForm
      return insertedData as EquipmentData;

    } catch (error) {
      console.error("❌ Erreur complète lors de l'ajout:", error);
      
      let errorMessage = "Une erreur inattendue s'est produite.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('network')) {
          errorMessage = "Problème de connexion réseau. Vérifiez votre connexion internet.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "La requête a pris trop de temps. Réessayez dans quelques instants.";
        }
      }

      // Ne pas afficher de toast d'erreur ici car les erreurs spécifiques 
      // ont déjà été traitées dans les blocs précédents
      if (!error || !(error instanceof Error) || !error.message.includes('Validation') && !error.message.includes('Session') && !error.message.includes('Profil')) {
        toast({
          title: "Erreur critique",
          description: `Impossible d'ajouter l'équipement: ${errorMessage}`,
          variant: "destructive",
        });
      }

      // Relancer l'erreur pour que AddEquipmentForm puisse la gérer
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fonction pour récupérer les équipements de l'utilisateur
  const fetchUserEquipments = useCallback(async (): Promise<EquipmentData[]> => {
    if (!user?.id) {
      console.log("❌ Aucun utilisateur connecté pour récupérer les équipements");
      return [];
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔍 Récupération des équipements pour l'utilisateur:", user.id);
      
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          images:equipment_images(*),
          owner:profiles!equipments_owner_id_fkey(*)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("❌ Erreur lors de la récupération des équipements:", error);
        throw error;
      }
      
      console.log("✅ Équipements récupérés:", data?.length || 0);
      
      const equipments = data as EquipmentData[];
      
      // Enrichir avec le nombre de réservations
      if (equipments && equipments.length > 0) {
        for (const equipment of equipments) {
          try {
            const { count, error: countError } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('equipment_id', equipment.id);
              
            if (!countError) {
              equipment.booking_count = count || 0;
            }
          } catch (countError) {
            console.warn("⚠️ Erreur lors du comptage des réservations:", countError);
            equipment.booking_count = 0;
          }
        }
      }
      
      return equipments || [];
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des matériels:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger vos équipements. Réessayez dans quelques instants.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fonction pour mettre à jour un équipement
  const updateEquipment = useCallback(async (
    id: string, 
    equipmentData: Partial<AddEquipmentData>
  ): Promise<{ success: boolean; error?: any }> => {
    if (!user?.id) {
      return { success: false, error: "Utilisateur non connecté" };
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('equipments')
        .update(equipmentData)
        .eq('id', id)
        .eq('owner_id', user.id); // Sécurité: seulement ses propres équipements
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Équipement mis à jour",
        description: "Les informations de votre équipement ont été mises à jour avec succès.",
      });
      
      return { success: true };
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour l'équipement: " + (error as Error).message,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fonction pour supprimer un équipement
  const deleteEquipment = useCallback(async (id: string): Promise<{ success: boolean; error?: any }> => {
    if (!user?.id) {
      return { success: false, error: "Utilisateur non connecté" };
    }
    
    setIsLoading(true);
    
    try {
      // Vérifier les réservations actives avant suppression
      const { data: activeBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('equipment_id', id)
        .in('status', ['pending', 'confirmed', 'ongoing']);
      
      if (bookingError) {
        throw bookingError;
      }
      
      if (activeBookings && activeBookings.length > 0) {
        toast({
          title: "Suppression impossible",
          description: "Cet équipement a des réservations actives. Annulez-les d'abord.",
          variant: "destructive",
        });
        return { success: false, error: "Réservations actives" };
      }
      
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id); // Sécurité: seulement ses propres équipements
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Équipment supprimé",
        description: "Votre équipement a été supprimé avec succès.",
      });
      
      return { success: true };
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer l'équipement: " + (error as Error).message,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    addEquipment,
    fetchUserEquipments,
    updateEquipment,
    deleteEquipment,
    isLoading
  };
}