// src/hooks/useEquipments.ts - VERSION CORRIGÉE - Erreurs TypeScript résolues
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
  price_type?: string;
  has_technical_support?: boolean;
  has_training?: boolean;
  has_insurance?: boolean;
  has_delivery?: boolean;
  has_recent_maintenance?: boolean;
}

export function useEquipments() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const validateEquipmentData = (data: AddEquipmentData): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

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
      errors.push("Le prix doit être supérieur à 0");
    } else if (data.daily_price > 10000000) {
      errors.push("Le prix ne peut pas dépasser 10 000 000 FCFA");
    }

    if (data.deposit_amount !== undefined && data.deposit_amount < 0) {
      errors.push("Le montant de la caution ne peut pas être négatif");
    }
    
    if (!data.category) {
      errors.push("La catégorie est obligatoire");
    } else if (typeof data.category !== 'string' || data.category.length === 0) {
      errors.push("La catégorie sélectionnée n'est pas valide");
    }

    if (data.year !== undefined && (data.year < 1900 || data.year > new Date().getFullYear() + 1)) {
      errors.push("L'année doit être comprise entre 1900 et l'année prochaine");
    }

    if (data.price_type && !['daily', 'monthly'].includes(data.price_type)) {
      errors.push("Le type de prix doit être 'daily' ou 'monthly'");
    }

    return { valid: errors.length === 0, errors };
  };

  const formatEquipmentData = (data: AddEquipmentData, userId: string) => {
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
      status: 'en_attente',
      moderation_status: 'pending',
      owner_id: userId,
      is_premium: false,
      published_at: null,
      approved_at: null,
      rejected_at: null,
      rejection_reason: null,
      price_type: data.price_type || 'daily',
      has_technical_support: data.has_technical_support || false,
      has_training: data.has_training || false,
      has_insurance: data.has_insurance || false,
      has_delivery: data.has_delivery || false,
      has_recent_maintenance: data.has_recent_maintenance || false,
    };
  };

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

  const addEquipment = useCallback(async (equipmentData: AddEquipmentData): Promise<EquipmentData> => {
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

      const formattedData = formatEquipmentData(equipmentData, sessionData.user.id);
      console.log("📋 Données formatées:", formattedData);

      const { data, error } = await supabase
        .from('equipments')
        .insert(formattedData)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur d'insertion:", error);
        const { message, solution } = analyzeInsertError(error);
        
        toast({
          title: "Erreur lors de l'ajout",
          description: message,
          variant: "destructive",
        });
        
        throw new Error(message);
      }

      console.log("✅ Équipement créé avec succès:", data);
      
      // ✅ FIX: Typer explicitement comme 'any' pour éviter les erreurs TypeScript
      const insertedData = data as any;

      if (!insertedData) {
        console.error("❌ Aucune donnée retournée après insertion");
        toast({
          title: "Erreur inattendue",
          description: "L'équipement n'a pas pu être créé correctement.",
          variant: "destructive",
        });
        throw new Error("Aucune donnée retournée");
      }

      // Toast de succès
      const categoryName = EQUIPMENT_CATEGORIES[insertedData.category]?.name || insertedData.category;
      const priceFormatted = insertedData.daily_price.toLocaleString();
      const priceLabel = insertedData.price_type === 'monthly' ? 'mois' : 'jour';
      
      toast({
        title: "🎉 Équipement ajouté avec succès !",
        description: `"${insertedData.title}" - Catégorie: ${categoryName} - Prix: ${priceFormatted} FCFA/${priceLabel}. Vous recevrez une notification dès que votre équipement sera approuvé.`,
        duration: 5000,
      });
      
      // ✅ FIX: Utiliser l'opérateur de coalescence pour les nouveaux champs
      const finalEquipment: EquipmentData = {
        id: insertedData.id,
        title: insertedData.title,
        description: insertedData.description,
        daily_price: insertedData.daily_price,
        deposit_amount: insertedData.deposit_amount || 0,
        location: insertedData.location || '',
        city: insertedData.city || 'Cotonou',
        country: insertedData.country || 'Bénin',
        category: insertedData.category,
        subcategory: insertedData.subcategory || undefined,
        status: insertedData.status || 'disponible',
        owner_id: insertedData.owner_id,
        created_at: insertedData.created_at || new Date().toISOString(),
        updated_at: insertedData.updated_at || new Date().toISOString(),
        condition: insertedData.condition || 'bon',
        brand: insertedData.brand || undefined,
        year: insertedData.year || undefined,
        images: [],
        booking_count: 0,
        moderation_status: insertedData.moderation_status || null,
        rejected_at: insertedData.rejected_at || null,
        rejection_reason: insertedData.rejection_reason || null,
        approved_at: insertedData.approved_at || null,
        is_premium: insertedData.is_premium || false,
        published_at: insertedData.published_at || null,
        // ✅ FIX: Accès sécurisé aux nouveaux champs
        price_type: insertedData.price_type || 'daily',
        has_technical_support: insertedData.has_technical_support ?? false,
        has_training: insertedData.has_training ?? false,
        has_insurance: insertedData.has_insurance ?? false,
        has_delivery: insertedData.has_delivery ?? false,
        has_recent_maintenance: insertedData.has_recent_maintenance ?? false,
      };

      await notifyAdminNewEquipment(insertedData.id, equipmentData.title, user.id);

      return finalEquipment;

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

      if (!error || !(error instanceof Error) || 
          (!error.message.includes('Validation') && 
           !error.message.includes('Session') && 
           !error.message.includes('Profil') &&
           !error.message.includes('Erreur lors de l\'ajout'))) {
        toast({
          title: "Erreur critique",
          description: `Impossible d'ajouter l'équipement: ${errorMessage}`,
          variant: "destructive",
        });
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);


  const notifyAdminNewEquipment = async (equipmentId: string, title: string, userId: string) => {
    try {
      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'new_equipment_pending',
          title: 'Nouvel équipement à valider',
          message: `Un nouvel équipement "${title}" a été soumis et attend votre validation.`,
          equipment_id: equipmentId,
          user_id: userId,
          status: 'unread',
          priority: 'normal'
        });

      if (notificationError) {
        console.warn("⚠️ Erreur lors de la notification admin:", notificationError);
      } else {
        console.log("✅ Notification admin créée avec succès");
      }

    } catch (error) {
      console.warn("⚠️ Erreur lors de la notification admin:", error);
    }
  };

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
          id,
          title,
          description,
          category,
          subcategory,
          daily_price,
          deposit_amount,
          condition,
          brand,
          year,
          location,
          city,
          country,
          status,
          moderation_status,
          is_premium,
          published_at,
          approved_at,
          rejected_at,
          rejection_reason,
          created_at,
          updated_at,
          owner_id,
          price_type,
          has_technical_support,
          has_training,
          has_insurance,
          has_delivery,
          has_recent_maintenance
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      console.log("✅ Équipements récupérés:", data?.length || 0);
      
      const equipments: EquipmentData[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        daily_price: item.daily_price,
        deposit_amount: item.deposit_amount || 0,
        location: item.location || '',
        city: item.city || 'Cotonou',
        country: item.country || 'Bénin',
        category: item.category,
        subcategory: item.subcategory || undefined,
        status: item.status || 'disponible',
        owner_id: item.owner_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        condition: item.condition || 'bon',
        brand: item.brand || undefined,
        year: item.year || undefined,
        images: [],
        booking_count: 0,
        moderation_status: item.moderation_status || null,
        rejected_at: item.rejected_at || null,
        rejection_reason: item.rejection_reason || null,
        approved_at: item.approved_at || null,
        is_premium: item.is_premium || false,
        published_at: item.published_at || null,
        // ✅ FIX: Utiliser ?? au lieu de ||
        price_type: item.price_type || 'daily',
        has_technical_support: item.has_technical_support ?? false,
        has_training: item.has_training ?? false,
        has_insurance: item.has_insurance ?? false,
        has_delivery: item.has_delivery ?? false,
        has_recent_maintenance: item.has_recent_maintenance ?? false,
      }));
      
      return equipments;
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

  const updateEquipment = useCallback(async (
    id: string, 
    equipmentData: Partial<AddEquipmentData>
  ): Promise<{ success: boolean; error?: any }> => {
    if (!user?.id) {
      return { success: false, error: "Utilisateur non connecté" };
    }
    
    setIsLoading(true);
    
    try {
      const updateData = {
        ...equipmentData,
        moderation_status: 'pending',
        status: 'en_attente',
        approved_at: null,
        published_at: null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('equipments')
        .update(updateData)
        .eq('id', id)
        .eq('owner_id', user.id);
      
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

  const deleteEquipment = useCallback(async (id: string): Promise<{ success: boolean; error?: any }> => {
    if (!user?.id) {
      return { success: false, error: "Utilisateur non connecté" };
    }
    
    setIsLoading(true);
    
    try {
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
        .eq('owner_id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Équipement supprimé",
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