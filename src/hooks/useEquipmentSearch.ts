
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { EquipmentData } from '@/types/supabase';

export interface FilterParams {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
}

export function useEquipmentSearch() {
  const [isLoading, setIsLoading] = useState(false);

  // Function to search equipments with filters - updated for homepage
  const searchEquipments = useCallback(async (filters: FilterParams = {}): Promise<EquipmentData[]> => {
    try {
      setIsLoading(true);
      console.log('🔍 Recherche avec filtres:', filters);

      let query = supabase
        .from('equipments')
        .select(`
          *,
          images:equipment_images (*)
        `)
        .eq('status', 'disponible');
      
      // Apply filters if provided
      if (filters.category && filters.category.trim()) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.city && filters.city.trim()) {
        query = query.eq('city', filters.city);
      }
      
      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        query = query.gte('daily_price', filters.minPrice);
      }
      
      if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
        query = query.lte('daily_price', filters.maxPrice);
      }
      
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const searchTerm = filters.searchQuery.trim();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50); // Limite pour éviter de surcharger
      
      if (error) {
        console.error('❌ Erreur de recherche:', error);
        throw new Error(`Erreur de recherche: ${error.message}`);
      }
      
      console.log('✅ Résultats de recherche:', data?.length || 0, 'équipements');
      return data as EquipmentData[] || [];
    } catch (error: any) {
      console.error("Erreur lors de la recherche:", error);
      toast({
        title: "Erreur de recherche",
        description: error.message || "Impossible de rechercher les équipements.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to fetch cities for filter
  const fetchCities = useCallback(async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('city')
        .eq('status', 'disponible')
        .not('city', 'is', null)
        .order('city', { ascending: true });
      
      if (error) {
        console.error('Erreur lors de la récupération des villes:', error);
        return [];
      }
      
      // Extract unique cities and filter out empty values
      const cities = [...new Set(
        data
          .map(item => item.city)
          .filter(city => city && city.trim())
      )];
      
      console.log('🏙️ Villes récupérées:', cities.length);
      return cities;
    } catch (error) {
      console.error("Erreur lors de la récupération des villes:", error);
      return [];
    }
  }, []);

  // Function to fetch price range (min and max)
  const fetchPriceRange = useCallback(async (): Promise<{min: number, max: number}> => {
    try {
      // Get aggregated price data in one query
      const { data, error } = await supabase
        .from('equipments')
        .select('daily_price')
        .eq('status', 'disponible')
        .not('daily_price', 'is', null)
        .order('daily_price', { ascending: true });
      
      if (error) {
        console.error('Erreur lors de la récupération des prix:', error);
        return { min: 0, max: 100000 };
      }
      
      if (!data || data.length === 0) {
        return { min: 0, max: 100000 };
      }
      
      const prices = data.map(item => item.daily_price).filter(price => price > 0);
      const min = Math.min(...prices) || 0;
      const max = Math.max(...prices) || 100000;
      
      console.log('💰 Gamme de prix:', { min, max });
      return { min, max };
    } catch (error) {
      console.error("Erreur lors de la récupération des prix:", error);
      return { min: 0, max: 100000 }; // Default values
    }
  }, []);

  return {
    searchEquipments,
    fetchCities,
    fetchPriceRange,
    isLoading
  };
}
