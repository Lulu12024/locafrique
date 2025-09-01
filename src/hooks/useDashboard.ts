import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth';
import { useWallet } from './useWallet';

interface DashboardStats {
  bookingCount: number;
  equipmentCount: number;
  unreadNotifications: number;
  revenue?: number;
  expenses?: number;
  pendingBookings?: number;
  approvedBookings?: number;
  totalRevenue?: number;
  // Additional properties for StatsCards
  totalEquipments?: number;
  totalBookings?: number;
  activeClients?: number;
  myRentals?: number;
  totalSpent?: number;
  favoriteEquipments?: number;
  myReviews?: number;
}

export function useDashboard() {
  const { user, profile } = useAuth();
  const { wallet } = useWallet();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async (): Promise<DashboardStats> => {
    if (!user) {
      console.log("Aucun utilisateur connecté pour récupérer les statistiques");
      return { 
        bookingCount: 0, 
        equipmentCount: 0, 
        unreadNotifications: 0,
      };
    }
    
    try {
      console.log("Récupération des statistiques pour l'utilisateur:", user.id);
      
      // Statistiques pour les propriétaires
      if (profile?.user_type === 'proprietaire') {
        // Nombre d'équipements
        const { count: equipmentCount, error: equipmentError } = await supabase
          .from('equipments')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);
        
        if (equipmentError) throw equipmentError;

        // Réservations reçues sur mes équipements
        const { data: ownerBookings, error: ownerBookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            equipment:equipment_id(owner_id)
          `)
          .eq('equipment.owner_id', user.id);
        
        if (ownerBookingsError) throw ownerBookingsError;

        const bookingCount = ownerBookings?.length || 0;
        const pendingBookings = ownerBookings?.filter(b => b.status === 'pending').length || 0;
        const approvedBookings = ownerBookings?.filter(b => b.status === 'approved').length || 0;

        // Calcul des revenus
        let revenue = 0;
        let totalRevenue = 0;
        if (wallet?.id) {
          const { data: revenueData, error: revenueError } = await supabase
            .from('wallet_transactions')
            .select('amount, created_at')
            .eq('wallet_id', wallet.id)
            .eq('transaction_type', 'revenu');
            
          if (!revenueError && revenueData) {
            totalRevenue = revenueData.reduce((sum, transaction) => sum + transaction.amount, 0);
            
            // Revenus du mois en cours
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            
            revenue = revenueData
              .filter(t => new Date(t.created_at) >= currentMonth)
              .reduce((sum, transaction) => sum + transaction.amount, 0);
          }
        }

        return {
          bookingCount,
          equipmentCount: equipmentCount || 0,
          unreadNotifications: 0,
          revenue,
          totalRevenue,
          pendingBookings,
          approvedBookings
        };
      } 
      // Statistiques pour les locataires
      else {
        // Mes réservations
        const { count: bookingCount, error: bookingError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('renter_id', user.id);
        
        if (bookingError) throw bookingError;

        // Calcul des dépenses
        let expenses = 0;
        if (wallet?.id) {
          const { data: expensesData, error: expensesError } = await supabase
            .from('wallet_transactions')
            .select('amount, created_at')
            .eq('wallet_id', wallet.id)
            .eq('transaction_type', 'dépense');
            
          if (!expensesError && expensesData) {
            // Dépenses du mois en cours
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            
            expenses = expensesData
              .filter(t => new Date(t.created_at) >= currentMonth)
              .reduce((sum, transaction) => sum + transaction.amount, 0);
          }
        }

        return {
          bookingCount: bookingCount || 0,
          equipmentCount: 0,
          unreadNotifications: 0,
          expenses
        };
      }
      
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      setError("Impossible de charger les statistiques du tableau de bord");
      return { 
        bookingCount: 0, 
        equipmentCount: 0, 
        unreadNotifications: 0
      };
    }
  };
  
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Chargement des statistiques du tableau de bord...");
        const dashboardStats = await fetchDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
        setError("Impossible de charger les statistiques");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && profile) {
      console.log("Utilisateur connecté, chargement des statistiques");
      loadStats();
    } else {
      console.log("Aucun utilisateur connecté, statistiques non chargées");
      setIsLoading(false);
    }
  }, [user, profile, wallet]);

  return {
    stats,
    isLoading,
    error,
    fetchDashboardStats
  };
}
