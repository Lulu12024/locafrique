
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/auth';

export interface EquipmentReview {
  id: string;
  equipment_id: string;
  booking_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  status: string; // Changé de union type strict à string
  commission_due: number;
  commission_paid: boolean;
  commission_paid_at?: string;
  created_at: string;
  updated_at: string;
  reviewer?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface OwnerStats {
  totalReviews: number;
  averageRating: number;
}

export function useEquipmentReviews() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer les avis d'un équipement (seulement les avis publiés pour le public)
  const fetchEquipmentReviews = async (equipmentId: string): Promise<EquipmentReview[]> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('equipment_reviews')
        .select(`
          *,
          profiles!reviewer_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('equipment_id', equipmentId)
        .eq('status', 'published') // Seulement les avis publiés
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const reviews: EquipmentReview[] = (data || []).map(review => {
        const profileData = review.profiles;
        let reviewer: EquipmentReview['reviewer'] = undefined;
        
        if (profileData && typeof profileData === 'object' && !Array.isArray(profileData)) {
          const profile = profileData as any;
          if (profile.first_name && profile.last_name) {
            reviewer = {
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url || undefined
            };
          }
        }
        
        return {
          id: review.id,
          equipment_id: review.equipment_id,
          booking_id: review.booking_id,
          reviewer_id: review.reviewer_id,
          rating: review.rating,
          comment: review.comment || undefined,
          status: review.status || 'published',
          commission_due: review.commission_due || 0,
          commission_paid: review.commission_paid || false,
          commission_paid_at: review.commission_paid_at || undefined,
          created_at: review.created_at,
          updated_at: review.updated_at,
          reviewer
        };
      });
      
      return reviews;
    } catch (error) {
      console.error('Erreur lors de la récupération des avis:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer tous les avis d'un propriétaire (incluant ceux en attente)
  const fetchOwnerReviews = async (ownerId: string): Promise<EquipmentReview[]> => {
    if (!user || user.id !== ownerId) return [];

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('equipment_reviews')
        .select(`
          *,
          profiles!reviewer_id (
            first_name,
            last_name,
            avatar_url
          ),
          equipments!equipment_id (
            title
          )
        `)
        .eq('equipments.owner_id', ownerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const reviews: EquipmentReview[] = (data || []).map(review => {
        const profileData = review.profiles;
        let reviewer: EquipmentReview['reviewer'] = undefined;
        
        if (profileData && typeof profileData === 'object' && !Array.isArray(profileData)) {
          const profile = profileData as any;
          if (profile.first_name && profile.last_name) {
            reviewer = {
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url || undefined
            };
          }
        }
        
        return {
          id: review.id,
          equipment_id: review.equipment_id,
          booking_id: review.booking_id,
          reviewer_id: review.reviewer_id,
          rating: review.rating,
          comment: review.comment || undefined,
          status: review.status || 'published',
          commission_due: review.commission_due || 0,
          commission_paid: review.commission_paid || false,
          commission_paid_at: review.commission_paid_at || undefined,
          created_at: review.created_at,
          updated_at: review.updated_at,
          reviewer
        };
      });
      
      return reviews;
    } catch (error) {
      console.error('Erreur lors de la récupération des avis du propriétaire:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques d'un propriétaire (seulement avec les avis publiés)
  const fetchOwnerStats = async (ownerId: string): Promise<OwnerStats> => {
    try {
      const { data, error } = await supabase
        .from('equipment_reviews')
        .select(`
          rating,
          equipments!inner (
            owner_id
          )
        `)
        .eq('equipments.owner_id', ownerId)
        .eq('status', 'published'); // Seulement les avis publiés
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { totalReviews: 0, averageRating: 0 };
      }
      
      const totalReviews = data.length;
      const averageRating = data.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques du propriétaire:', error);
      return { totalReviews: 0, averageRating: 0 };
    }
  };

  const createReview = async (
    equipmentId: string,
    bookingId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; error?: any }> => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour laisser un avis.",
        variant: "destructive",
      });
      return { success: false, error: "Utilisateur non connecté" };
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('equipment_reviews')
        .insert({
          equipment_id: equipmentId,
          booking_id: bookingId,
          reviewer_id: user.id,
          rating,
          comment: comment || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (rating >= 4) {
        toast({
          title: "Avis créé",
          description: "Votre évaluation a été créée. Une commission est requise pour la publier.",
        });
      } else {
        toast({
          title: "Avis publié",
          description: "Votre évaluation a été publiée avec succès.",
        });
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'avis:', error);
      
      let errorMessage = "Impossible d'ajouter votre avis.";
      if (error.code === '23505') {
        errorMessage = "Vous avez déjà évalué cette réservation.";
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const updateReview = async (
    reviewId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; error?: any }> => {
    if (!user) return { success: false, error: "Utilisateur non connecté" };

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('equipment_reviews')
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .eq('reviewer_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Avis mis à jour",
        description: "Votre évaluation a été mise à jour avec succès.",
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'avis:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre avis.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchEquipmentReviews,
    fetchOwnerReviews,
    fetchOwnerStats,
    createReview,
    updateReview,
    isLoading
  };
}
