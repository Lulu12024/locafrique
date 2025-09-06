
// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Calendar, ArrowLeft } from "lucide-react";

// const MyBookings: React.FC = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex items-center space-x-4 mb-8">
//           <Button
//             onClick={() => navigate(-1)}
//             variant="outline"
//             size="sm"
//             className="flex items-center space-x-2"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             <span>Retour</span>
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
//             <p className="text-gray-600">Suivez l'état de vos réservations</p>
//           </div>
//         </div>

//         {/* Empty State */}
//         <Card className="p-8 text-center">
//           <div className="text-gray-500 mb-6">
//             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Calendar className="h-8 w-8 text-gray-400" />
//             </div>
//             <p className="text-lg font-medium mb-2">Aucune réservation trouvée</p>
//             <p className="text-sm">Vos futures réservations apparaîtront ici</p>
//           </div>
//           <Button 
//             onClick={() => navigate('/')}
//             className="bg-green-600 hover:bg-green-700"
//           >
//             Explorer les équipements
//           </Button>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default MyBookings;


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  MapPin, 
  Clock, 
  Euro, 
  Users, 
  Settings,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Package
} from 'lucide-react';

const MyBookings = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 15)); // 15 janvier 2025
  const [viewMode, setViewMode] = useState('month');
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Données d'exemple pour les réservations
  const bookings = [
    {
      id: 'B001',
      title: 'Pelleteuse CAT 320',
      type: 'rental', // rental = je loue quelque chose
      startDate: new Date(2025, 0, 16),
      endDate: new Date(2025, 0, 18),
      status: 'confirmed',
      amount: 135000,
      client: 'Jean Dupont',
      location: 'Cotonou',
      color: '#10B981' // vert pour les réservations confirmées
    },
    {
      id: 'B002',
      title: 'Grue mobile 50T',
      type: 'rental',
      startDate: new Date(2025, 0, 20),
      endDate: new Date(2025, 0, 22),
      status: 'pending',
      amount: 180000,
      client: 'Marie Kone',
      location: 'Porto-Novo',
      color: '#F59E0B' // orange pour en attente
    },
    {
      id: 'B003',
      title: 'Excavatrice compacte',
      type: 'ownership', // ownership = mon équipement est loué
      startDate: new Date(2025, 0, 25),
      endDate: new Date(2025, 0, 27),
      status: 'confirmed',
      amount: 90000,
      client: 'Paul Sankara',
      location: 'Cotonou',
      color: '#3B82F6' // bleu pour mes équipements loués
    }
  ];

  // Données d'exemple pour la gestion des annonces
  const equipmentAvailability = [
    {
      id: 'E001',
      name: 'Pelleteuse CAT 320',
      basePrice: 45000,
      unavailableDates: [
        new Date(2025, 0, 16),
        new Date(2025, 0, 17),
        new Date(2025, 0, 18)
      ],
      specialPricing: [
        {
          dates: [new Date(2025, 0, 20), new Date(2025, 0, 21)],
          price: 50000,
          reason: 'Weekend premium'
        }
      ]
    }
  ];

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Ajouter les jours du mois précédent pour remplir la première semaine
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Ajouter tous les jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    // Ajouter les jours du mois suivant pour remplir la dernière semaine
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let day = 1; days.length < totalCells; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    return bookings.filter(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return date >= bookingStart && date <= bookingEnd;
    });
  };

  const isDateUnavailable = (date) => {
    if (activeTab === 'equipment') {
      return equipmentAvailability.some(eq => 
        eq.unavailableDates.some(unavailable => 
          unavailable.toDateString() === date.toDateString()
        )
      );
    }
    return false;
  };

  const getSpecialPricing = (date) => {
    if (activeTab === 'equipment') {
      for (const equipment of equipmentAvailability) {
        for (const special of equipment.specialPricing) {
          if (special.dates.some(d => d.toDateString() === date.toDateString())) {
            return special;
          }
        }
      }
    }
    return null;
  };

  const CalendarHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date())}
        >
          Aujourd'hui
        </Button>
        
        {activeTab === 'equipment' && (
          <Button
            onClick={() => setShowPricingModal(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Tarif spécial
          </Button>
        )}
      </div>
    </div>
  );

  const CalendarGrid = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
      <div className="bg-white rounded-lg border">
        {/* En-têtes des jours de la semaine */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grille du calendrier */}
        <div className="grid grid-cols-7">
          {days.map((dayInfo, index) => {
            const events = getEventsForDate(dayInfo.date);
            const isUnavailable = isDateUnavailable(dayInfo.date);
            const specialPricing = getSpecialPricing(dayInfo.date);
            const isToday = dayInfo.date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-24 p-1 border-r border-b ${
                  !dayInfo.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>
                  {dayInfo.date.getDate()}
                </div>
                
                {/* Événements pour les réservations */}
                {activeTab === 'bookings' && events.map(event => (
                  <div
                    key={event.id}
                    className="mt-1 p-1 rounded text-xs text-white truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color }}
                    title={`${event.title} - ${event.client}`}
                  >
                    {event.title}
                  </div>
                ))}
                
                {/* Indicateurs pour la gestion d'équipements */}
                {activeTab === 'equipment' && (
                  <div className="mt-1 space-y-1">
                    {isUnavailable && (
                      <div className="bg-red-500 text-white text-xs p-1 rounded">
                        Indisponible
                      </div>
                    )}
                    {specialPricing && (
                      <div className="bg-orange-500 text-white text-xs p-1 rounded">
                        {specialPricing.price.toLocaleString()} FCFA
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const BookingsTab = () => (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Toutes
              </Button>
              <Button
                variant={filterStatus === 'rental' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('rental')}
              >
                Mes locations
              </Button>
              <Button
                variant={filterStatus === 'ownership' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('ownership')}
              >
                Mes équipements loués
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Mes locations
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                Mes équipements
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier */}
      <Card>
        <CardHeader>
          <CalendarHeader />
        </CardHeader>
        <CardContent>
          <CalendarGrid />
        </CardContent>
      </Card>

      {/* Liste des prochaines réservations */}
      <Card>
        <CardHeader>
          <CardTitle>Prochaines réservations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings
              .filter(b => filterStatus === 'all' || b.type === filterStatus)
              .map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: booking.color }}
                  ></div>
                  <div>
                    <h4 className="font-medium">{booking.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {booking.startDate.toLocaleDateString()} - {booking.endDate.toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {booking.client}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {booking.location}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-semibold">{booking.amount.toLocaleString()} FCFA</p>
                    <Badge 
                      variant="secondary"
                      className={booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                    >
                      {booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
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
      {/* Sélection d'équipement */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium">Pelleteuse CAT 320</h3>
                <p className="text-sm text-gray-600">Prix de base: 45,000 FCFA/jour</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Gérer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier de disponibilité */}
      <Card>
        <CardHeader>
          <CalendarHeader />
        </CardHeader>
        <CardContent>
          <CalendarGrid />
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardHeader>
          <CardTitle>Légende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Indisponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">Tarif spécial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Réservé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tarifs spéciaux configurés */}
      <Card>
        <CardHeader>
          <CardTitle>Tarifs spéciaux configurés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Weekend premium</h4>
                <p className="text-sm text-gray-600">20-21 Janvier 2025</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-semibold">50,000 FCFA/jour</span>
                <Button variant="ghost" size="sm">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PricingModal = () => showPricingModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ajouter un tarif spécial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Dates</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" />
              <Input type="date" />
            </div>
          </div>
          
          <div>
            <Label>Prix spécial (FCFA/jour)</Label>
            <Input type="number" placeholder="50000" />
          </div>
          
          <div>
            <Label>Raison</Label>
            <Input placeholder="Ex: Weekend premium, Période de forte demande..." />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={() => setShowPricingModal(false)} variant="outline" className="flex-1">
              Annuler
            </Button>
            <Button onClick={() => setShowPricingModal(false)} className="flex-1">
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>
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
          Vue globale de vos réservations et gestion de vos équipements
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

      {/* Modal de tarification */}
      <PricingModal />
    </div>
  );
};

export default MyBookings;