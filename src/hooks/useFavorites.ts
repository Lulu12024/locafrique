
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/hooks/use-toast';

export interface FavoriteData {
  id: string;
  user_id: string;
  equipment_id: string;
  created_at: string;
  equipment?: any;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          user_id,
          equipment_id,
          created_at,
          equipment:equipments!equipment_id (
            id,
            title,
            description,
            daily_price,
            city,
            country,
            category,
            images:equipment_images (
              id,
              image_url,
              is_primary
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des favoris:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos favoris",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (equipmentId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter des favoris",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          equipment_id: equipmentId
        });

      if (error) throw error;

      toast({
        title: "Ajouté aux favoris",
        description: "L'équipement a été ajouté à vos favoris",
      });
      
      fetchFavorites();
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Déjà en favoris",
          description: "Cet équipement est déjà dans vos favoris",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter aux favoris",
          variant: "destructive"
        });
      }
      return false;
    }
  };

  const removeFromFavorites = async (equipmentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('equipment_id', equipmentId);

      if (error) throw error;

      toast({
        title: "Retiré des favoris",
        description: "L'équipement a été retiré de vos favoris",
      });
      
      fetchFavorites();
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer des favoris",
        variant: "destructive"
      });
      return false;
    }
  };

  const isFavorite = (equipmentId: string) => {
    return favorites.some(fav => fav.equipment_id === equipmentId);
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refetch: fetchFavorites
  };
};
