// src/hooks/usePublicEquipments.ts
// Hook pour gérer l'affichage public des équipements avec filtrage premium

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EquipmentData } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';

interface EquipmentFilters {
  category?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: string;
  search?: string;
}

export const usePublicEquipments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [premiumEquipments, setPremiumEquipments] = useState<EquipmentData[]>([]);
  const [regularEquipments, setRegularEquipments] = useState<EquipmentData[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Récupérer les équipements premium pour la page d'accueil
  const fetchPremiumEquipments = useCallback(async (limit: number = 12) => {
    setIsLoading(true);
    
    try {
      console.log("🔥 Récupération des équipements premium...");
      
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
          created_at,
          updated_at,
          owner_id
        `)
        .eq('status', 'disponible')
        .eq('moderation_status', 'approved')
        .eq('is_premium', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} équipements premium récupérés`);
      setPremiumEquipments(data as EquipmentData[] || []);
      
      return data as EquipmentData[] || [];
      
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des équipements premium:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les équipements premium.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Récupérer tous les équipements disponibles pour la page Explorer
  const fetchAllAvailableEquipments = useCallback(async (
    filters: EquipmentFilters = {},
    page: number = 1,
    limit: number = 20
  ) => {
    setIsLoading(true);
    
    try {
      console.log("📋 Récupération de tous les équipements disponibles...", filters);
      
      let query = supabase
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
          created_at,
          updated_at,
          owner_id
        `, { count: 'exact' })
        .eq('status', 'disponible')
        .eq('moderation_status', 'approved');

      // Appliquer les filtres
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }
      
      if (filters.priceMin !== undefined) {
        query = query.gte('daily_price', filters.priceMin);
      }
      
      if (filters.priceMax !== undefined) {
        query = query.lte('daily_price', filters.priceMax);
      }
      
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Ordre : Premium en premier, puis par date de publication
      query = query
        .order('is_premium', { ascending: false })
        .order('published_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} équipements récupérés (page ${page})`);
      
      setRegularEquipments(data as EquipmentData[] || []);
      setTotalCount(count || 0);
      
      return {
        equipments: data as EquipmentData[] || [],
        totalCount: count || 0,
        hasMore: (count || 0) > page * limit
      };
      
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des équipements:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les équipements.",
        variant: "destructive",
      });
      return {
        equipments: [],
        totalCount: 0,
        hasMore: false
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Récupérer uniquement les équipements non-premium pour Explorer
  const fetchRegularEquipments = useCallback(async (
    filters: EquipmentFilters = {},
    page: number = 1,
    limit: number = 20
  ) => {
    setIsLoading(true);
    
    try {
      console.log("📦 Récupération des équipements non-premium...", filters);
      
      let query = supabase
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
          created_at,
          updated_at,
          owner_id
        `, { count: 'exact' })
        .eq('status', 'disponible')
        .eq('moderation_status', 'approved')
        .eq('is_premium', false); // ✅ Seulement les équipements non-premium

      // Appliquer les filtres
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }
      
      if (filters.priceMin !== undefined) {
        query = query.gte('daily_price', filters.priceMin);
      }
      
      if (filters.priceMax !== undefined) {
        query = query.lte('daily_price', filters.priceMax);
      }
      
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query
        .order('published_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} équipements non-premium récupérés`);
      
      return {
        equipments: data as EquipmentData[] || [],
        totalCount: count || 0,
        hasMore: (count || 0) > page * limit
      };
      
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des équipements non-premium:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les équipements.",
        variant: "destructive",
      });
      return {
        equipments: [],
        totalCount: 0,
        hasMore: false
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Recherche globale avec priorité aux équipements premium
  const searchEquipments = useCallback(async (
    searchTerm: string,
    filters: EquipmentFilters = {},
    limit: number = 20
  ) => {
    setIsLoading(true);
    
    try {
      console.log("🔍 Recherche d'équipements:", searchTerm);
      
      let query = supabase
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
          created_at,
          updated_at,
          owner_id
        `)
        .eq('status', 'disponible')
        .eq('moderation_status', 'approved');

      // Recherche textuelle
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      // Appliquer les autres filtres
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.city) {
        query = query.eq('city', filters.city);
      }

      // Ordre : Premium en premier, puis pertinence
      query = query
        .order('is_premium', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} résultats de recherche trouvés`);
      
      return data as EquipmentData[] || [];
      
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible d'effectuer la recherche.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Obtenir les statistiques des équipements
  const getEquipmentStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('is_premium, status, moderation_status')
        .eq('moderation_status', 'approved');

      if (error) throw error;

      const stats = {
        total: data.length,
        premium: data.filter(e => e.is_premium && e.status === 'disponible').length,
        regular: data.filter(e => !e.is_premium && e.status === 'disponible').length,
        available: data.filter(e => e.status === 'disponible').length,
        rented: data.filter(e => e.status === 'loue').length
      };

      console.log("📊 Statistiques des équipements:", stats);
      return stats;
      
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des statistiques:", error);
      return {
        total: 0,
        premium: 0,
        regular: 0,
        available: 0,
        rented: 0
      };
    }
  }, []);

  return {
    // États
    isLoading,
    premiumEquipments,
    regularEquipments,
    totalCount,
    
    // Fonctions
    fetchPremiumEquipments,
    fetchAllAvailableEquipments,
    fetchRegularEquipments,
    searchEquipments,
    getEquipmentStats
  };
};