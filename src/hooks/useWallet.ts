
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WalletData, TransactionData } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';
import { toast } from "@/components/ui/use-toast";

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Ajout d'un délai pour éviter les courses de condition
      const timer = setTimeout(() => {
        loadWallet(user.id);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setWallet(null);
      setError(null);
    }
  }, [user]);

  const loadWallet = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Chargement du portefeuille pour l'utilisateur ${userId}...`);
      
      // Vérifier si un portefeuille existe déjà
      const { data: existingWallet, error: checkError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);
      
      if (checkError) {
        throw checkError;
      }
      
      // Si aucun portefeuille n'existe, en créer un
      if (!existingWallet || existingWallet.length === 0) {
        console.log("Aucun portefeuille trouvé, création d'un nouveau portefeuille...");
        
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert([
            { user_id: userId, balance: 0 }
          ])
          .select();
        
        if (createError) {
          throw createError;
        }
        
        if (newWallet && newWallet.length > 0) {
          console.log("Nouveau portefeuille créé avec succès:", newWallet[0]);
          setWallet(newWallet[0] as WalletData);
        } else {
          throw new Error("Échec de création du portefeuille: aucune donnée retournée");
        }
      } else {
        // Utiliser le portefeuille existant
        console.log("Portefeuille existant récupéré:", existingWallet[0]);
        setWallet(existingWallet[0] as WalletData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du portefeuille:", error);
      setError("Impossible de charger ou créer le portefeuille");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger votre portefeuille. Veuillez réessayer plus tard."
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour recharger manuellement le portefeuille (utile en cas d'erreur)
  const reloadWallet = async () => {
    if (user) {
      return loadWallet(user.id);
    }
  };
  
  return {
    wallet,
    loading,
    error,
    reloadWallet
  };
}
