
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageData } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';
import { toast } from "@/components/ui/use-toast";

export function useMessages() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);

  // Fonction pour récupérer les messages de l'utilisateur
  const fetchUserMessages = async (): Promise<MessageData[]> => {
    if (!user) return [];
    
    setLoading(true);
    try {
      console.log("Tentative de récupération des messages pour l'utilisateur:", user.id);
      
      // Utiliser une expression SQL pour la condition OR
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erreur lors de la récupération des messages:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos messages.",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log(`${data?.length || 0} messages récupérés`);
      return data as MessageData[] || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos messages.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour marquer un message comme lu
  const markMessageAsRead = async (id: string): Promise<{success: boolean; error?: any}> => {
    if (!user) return { success: false, error: "Utilisateur non connecté" };
    
    try {
      console.log(`Tentative de marquer le message ${id} comme lu`);
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', id)
        .eq('receiver_id', user.id); // S'assurer que l'utilisateur est bien le destinataire
      
      if (error) {
        console.error("Erreur lors de la mise à jour du message:", error);
        toast({
          title: "Erreur",
          description: "Impossible de marquer le message comme lu.",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log(`Message ${id} marqué comme lu avec succès`);
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du message:", error);
      return { success: false, error };
    }
  };
  
  return {
    fetchUserMessages,
    markMessageAsRead,
    loading
  };
}
