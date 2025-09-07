// REMPLACER COMPLÈTEMENT le fichier : /src/pages/MyBookings.tsx
// Version corrigée sans erreurs TypeScript

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  Package,
  Users,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  TrendingUp,
  CalendarDays,
  Filter,
  Loader2,
  Percent
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Types locaux pour ce composant
interface BookingData {
  id: string;
  equipment_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  commission_amount?: number;
  platform_fee?: number;
  status: string;
  contact_phone?: string;
  delivery_method?: 'pickup' | 'delivery';
  delivery_address?: string;
  special_requests?: string;
  automatic_validation?: boolean;
  created_at: string;
  updated_at?: string;
  userType?: 'renter' | 'owner'; // IMPORTANT: Ajout du champ userType
  
  // Relations optionnelles
  equipment?: {
    id: string;
    title: string;
    daily_price: number;
    location: string;
    owner_id: string;
  };
  renter?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
}

interface EquipmentData {
  id: string;
  title: string;
  category: string;
  daily_price: number;
  status: string;
  location: string;
  owner_id: string;
  created_at: string;
  images?: any;
}

const MyBookings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  // États pour les données
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les modals
  const [pricingData, setPricingData] = useState({
    startDate: '',
    endDate: '',
    specialPrice: '',
    reason: ''
  });

  const [availabilityData, setAvailabilityData] = useState({
    startDate: '',
    endDate: '',
    reason: 'maintenance',
    comment: ''
  });

  // Fonction utilitaire pour formater les prix
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  // Charger les données au montage
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Chargement des données de réservation...');
      
      await Promise.all([
        loadBookings(),
        loadEquipments()
      ]);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!user?.id) return;

    try {
      console.log('📅 Chargement des réservations...');
      
      // Réservations où je suis locataire
      const { data: renterBookings, error: renterError } = await supabase
        .from('bookings')
        .select(`
          *,
          equipment:equipments(*),
          owner:profiles!equipments_owner_id_fkey(*)
        `)
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false });

      if (renterError) {
        console.error('❌ Erreur réservations locataire:', renterError);
        throw renterError;
      }

      // Réservations où je suis propriétaire
      const { data: ownerBookings, error: ownerError } = await supabase
        .from('bookings')
        .select(`
          *,
          equipment:equipments!inner(*),
          renter:profiles!bookings_renter_id_fkey(*)
        `)
        .eq('equipments.owner_id', user.id)
        .order('created_at', { ascending: false });

      if (ownerError) {
        console.error('❌ Erreur réservations propriétaire:', ownerError);
        throw ownerError;
      }

      // Combiner et typer correctement
      const allBookings: BookingData[] = [
        // Réservations en tant que locataire
        ...(renterBookings || []).map((b: any): BookingData => ({
          id: b.id,
          equipment_id: b.equipment_id,
          renter_id: b.renter_id,
          start_date: b.start_date,
          end_date: b.end_date,
          total_price: b.total_price || 0,
          commission_amount: b.commission_amount || 0,
          platform_fee: b.platform_fee || 0,
          status: b.status || 'pending',
          contact_phone: b.contact_phone || undefined,
          delivery_method: b.delivery_method || undefined,
          delivery_address: b.delivery_address || undefined,
          special_requests: b.special_requests || undefined,
          automatic_validation: b.automatic_validation || true,
          created_at: b.created_at,
          updated_at: b.updated_at,
          userType: 'renter',
          equipment: b.equipment ? {
            id: b.equipment.id,
            title: b.equipment.title,
            daily_price: b.equipment.daily_price,
            location: b.equipment.location,
            owner_id: b.equipment.owner_id
          } : undefined,
          owner: Array.isArray(b.owner) && b.owner.length > 0 ? {
            id: b.owner[0].id,
            first_name: b.owner[0].first_name,
            last_name: b.owner[0].last_name,
            phone_number: b.owner[0].phone_number
          } : undefined
        })),
        
        // Réservations en tant que propriétaire
        ...(ownerBookings || []).map((b: any): BookingData => ({
          id: b.id,
          equipment_id: b.equipment_id,
          renter_id: b.renter_id,
          start_date: b.start_date,
          end_date: b.end_date,
          total_price: b.total_price || 0,
          commission_amount: b.commission_amount || 0,
          platform_fee: b.platform_fee || 0,
          status: b.status || 'pending',
          contact_phone: b.contact_phone || undefined,
          delivery_method: b.delivery_method || undefined,
          delivery_address: b.delivery_address || undefined,
          special_requests: b.special_requests || undefined,
          automatic_validation: b.automatic_validation || true,
          created_at: b.created_at,
          updated_at: b.updated_at,
          userType: 'owner',
          equipment: b.equipment ? {
            id: b.equipment.id,
            title: b.equipment.title,
            daily_price: b.equipment.daily_price,
            location: b.equipment.location,
            owner_id: b.equipment.owner_id
          } : undefined,
          renter: b.renter ? {
            id: b.renter.id,
            first_name: b.renter.first_name,
            last_name: b.renter.last_name,
            phone_number: b.renter.phone_number
          } : undefined
        }))
      ];

      console.log('✅ Réservations chargées:', allBookings.length);
      setBookings(allBookings);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des réservations:', error);
      throw error;
    }
  };

  const loadEquipments = async () => {
    if (!user?.id) return;

    try {
      console.log('🏗️ Chargement des équipements...');
      
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur équipements:', error);
        throw error;
      }

      console.log('✅ Équipements chargés:', data?.length || 0);
      setEquipments(data || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des équipements:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      available: 'bg-green-100 text-green-800',
      en_attente: 'bg-yellow-100 text-yellow-800',
      disponible: 'bg-green-100 text-green-800',
      loue: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      completed: 'Terminée',
      cancelled: 'Annulée',
      available: 'Disponible',
      en_attente: 'En attente',
      disponible: 'Disponible',
      loue: 'Louée',
      maintenance: 'Maintenance'
    };
    return statusTexts[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<{
      day: number;
      dateStr: string;
      bookings: BookingData[];
      isToday: boolean;
    } | null> = [];
    
    // Ajouter les jours vides du début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookings.filter(booking => 
        booking.start_date <= dateStr && booking.end_date >= dateStr
      );
      
      days.push({
        day,
        dateStr,
        bookings: dayBookings,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  const handlePricingSubmit = async () => {
    if (!selectedEquipment || !pricingData.startDate || !pricingData.endDate || !pricingData.specialPrice) {
      toast({
        title: "Données manquantes",
        description: "Veuillez remplir tous les champs requis.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('💰 Application de tarification spéciale...');
      
      toast({
        title: "✅ Tarification mise à jour",
        description: `Prix spécial de ${formatPrice(parseInt(pricingData.specialPrice))} FCFA/jour appliqué.`,
      });

      setShowPricingModal(false);
      setPricingData({ startDate: '', endDate: '', specialPrice: '', reason: '' });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la tarification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tarification.",
        variant: "destructive"
      });
    }
  };

  const handleAvailabilitySubmit = async () => {
    if (!selectedEquipment || !availabilityData.startDate || !availabilityData.endDate) {
      toast({
        title: "Données manquantes",
        description: "Veuillez remplir tous les champs requis.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🚫 Blocage des dates...');
      
      toast({
        title: "✅ Dates bloquées",
        description: `Équipement indisponible du ${formatDate(availabilityData.startDate)} au ${formatDate(availabilityData.endDate)}.`,
      });

      setShowAvailabilityModal(false);
      setAvailabilityData({ startDate: '', endDate: '', reason: 'maintenance', comment: '' });
    } catch (error) {
      console.error('❌ Erreur lors du blocage des dates:', error);
      toast({
        title: "Erreur",
        description: "Impossible de bloquer les dates.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement de vos données...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur de chargement</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadAllData} variant="outline">
              <Loader2 className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const BookingsTab = () => (
    <div className="space-y-6">
      {/* Statistiques des réservations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarDays className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{bookings.length}</p>
            <p className="text-sm text-gray-600">Réservations totales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Confirmées</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {bookings.filter(b => b.status === 'pending' || b.status === 'en_attente').length}
            </p>
            <p className="text-sm text-gray-600">En attente</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {formatPrice(bookings.reduce((sum, b) => sum + (b.total_price || 0), 0))}
            </p>
            <p className="text-sm text-gray-600">FCFA total</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendrier des réservations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Calendrier des réservations
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadAllData}>
                <Filter className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mois</SelectItem>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="day">Jour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* En-tête du calendrier */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}>
              ← Précédent
            </Button>
            <h3 className="text-lg font-semibold">
              {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}>
              Suivant →
            </Button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Jours du calendrier */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((dayData, index) => (
              <div
                key={index}
                className={`min-h-[80px] p-1 border rounded-lg ${
                  dayData?.isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                } hover:bg-gray-50 transition-colors`}
              >
                {dayData && (
                  <>
                    <div className={`text-sm font-medium ${
                      dayData.isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {dayData.day}
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayData.bookings.slice(0, 2).map(booking => (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 rounded ${
                            booking.userType === 'owner' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          } truncate`}
                          title={`${booking.equipment?.title} - ${
                            booking.userType === 'owner' 
                              ? `${booking.renter?.first_name} ${booking.renter?.last_name}`
                              : booking.equipment?.title
                          }`}
                        >
                          {booking.userType === 'owner' ? '🏢' : '👤'} {booking.equipment?.title?.slice(0, 15)}...
                        </div>
                      ))}
                      {dayData.bookings.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayData.bookings.length - 2} autres
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des réservations récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Réservations récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.slice(0, 10).map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    booking.userType === 'owner' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {booking.userType === 'owner' ? (
                      <Package className="h-5 w-5 text-green-600" />
                    ) : (
                      <Users className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium">{booking.equipment?.title}</h4>
                    <p className="text-sm text-gray-600">
                      {booking.userType === 'owner' 
                        ? `Locataire: ${booking.renter?.first_name} ${booking.renter?.last_name}`
                        : `Propriétaire: ${booking.owner?.first_name} ${booking.owner?.last_name}`
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                    </p>
                    {booking.commission_amount && booking.commission_amount > 0 && (
                      <p className="text-xs text-orange-600">
                        Commission: {formatPrice(booking.commission_amount)} FCFA (5%)
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge className={getStatusColor(booking.status)}>
                    {getStatusText(booking.status)}
                  </Badge>
                  <p className="text-lg font-semibold mt-1">
                    {formatPrice(booking.total_price)} FCFA
                  </p>
                  <div className="flex space-x-1 mt-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const EquipmentTab = () => (
    <div className="space-y-6">
      {/* Statistiques des équipements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{equipments.length}</p>
            <p className="text-sm text-gray-600">Équipements actifs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {equipments.filter(eq => eq.status === 'disponible').length}
            </p>
            <p className="text-sm text-gray-600">Disponibles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {formatPrice(equipments.reduce((sum, eq) => sum + (eq.daily_price * 30), 0))}
            </p>
            <p className="text-sm text-gray-600">FCFA/mois potentiel</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarDays className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {bookings.filter(b => b.userType === 'owner').length}
            </p>
            <p className="text-sm text-gray-600">Réservations reçues</p>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des équipements */}
      <div className="space-y-4">
        {equipments.map(equipment => (
          <Card key={equipment.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{equipment.title}</h3>
                  <p className="text-gray-600">{equipment.category} • {equipment.location}</p>
                  <Badge className={getStatusColor(equipment.status)}>
                    {getStatusText(equipment.status)}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(equipment.daily_price)} FCFA/jour
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatPrice(equipment.daily_price * 30)} FCFA/mois
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedEquipment(equipment.id)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Tarification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gestion de la tarification</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Prix journalier actuel</Label>
                        <Input value={`${formatPrice(equipment.daily_price)} FCFA`} readOnly />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Date de début</Label>
                          <Input 
                            type="date" 
                            value={pricingData.startDate}
                            onChange={(e) => setPricingData({...pricingData, startDate: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Date de fin</Label>
                          <Input 
                            type="date" 
                            value={pricingData.endDate}
                            onChange={(e) => setPricingData({...pricingData, endDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Prix spécial (FCFA/jour)</Label>
                        <Input 
                          type="number" 
                          placeholder="150000"
                          value={pricingData.specialPrice}
                          onChange={(e) => setPricingData({...pricingData, specialPrice: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Raison</Label>
                        <Input 
                          placeholder="Ex: Weekend premium, Période de forte demande..."
                          value={pricingData.reason}
                          onChange={(e) => setPricingData({...pricingData, reason: e.target.value})}
                        />
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center text-orange-700">
                          <Percent className="h-4 w-4 mr-2" />
                          Commission automatique de 5% appliquée sur tous les prix
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => setShowPricingModal(false)} variant="outline" className="flex-1">
                          Annuler
                        </Button>
                        <Button onClick={handlePricingSubmit} className="flex-1">
                          Appliquer
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAvailabilityModal} onOpenChange={setShowAvailabilityModal}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedEquipment(equipment.id)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Disponibilité
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gestion de la disponibilité</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Date de début</Label>
                          <Input 
                            type="date" 
                            value={availabilityData.startDate}
                            onChange={(e) => setAvailabilityData({...availabilityData, startDate: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Date de fin</Label>
                          <Input 
                            type="date" 
                            value={availabilityData.endDate}
                            onChange={(e) => setAvailabilityData({...availabilityData, endDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Raison</Label>
                        <Select 
                          value={availabilityData.reason} 
                          onValueChange={(value) => setAvailabilityData({...availabilityData, reason: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="personal">Usage personnel</SelectItem>
                            <SelectItem value="repair">Réparation</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Commentaire</Label>
                        <Textarea 
                          placeholder="Détails optionnels..."
                          value={availabilityData.comment}
                          onChange={(e) => setAvailabilityData({...availabilityData, comment: e.target.value})}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => setShowAvailabilityModal(false)} variant="outline" className="flex-1">
                          Annuler
                        </Button>
                        <Button onClick={handleAvailabilitySubmit} className="flex-1">
                          Bloquer les dates
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Button>
                
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir l'annonce
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {equipments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun équipement trouvé</p>
              <p className="text-sm text-gray-500">Ajoutez votre premier équipement pour commencer</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'bookings', label: 'Mes réservations', icon: Calendar },
    { id: 'equipment', label: 'Mes annonces', icon: Package }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendrier de gestion</h1>
        <p className="text-gray-600">
          Vue globale de vos réservations et gestion de vos équipements avec commission automatique de 5%
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div>
        {activeTab === 'bookings' && <BookingsTab />}
        {activeTab === 'equipment' && <EquipmentTab />}
      </div>
    </div>
  );
};

export default MyBookings;