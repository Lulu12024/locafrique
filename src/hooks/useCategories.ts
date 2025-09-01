
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string | null;
}

export function useCategories() {
  // Function to fetch all categories
  const fetchCategories = async (): Promise<Category[]> => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories.",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    fetchCategories
  };
}
