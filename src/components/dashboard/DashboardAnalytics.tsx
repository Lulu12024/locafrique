import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/hooks/useDashboard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Package } from 'lucide-react';

// Données de démonstration pour les graphiques
const revenueData = [
  { month: 'Jan', revenue: 45000, bookings: 12 },
  { month: 'Fév', revenue: 52000, bookings: 15 },
  { month: 'Mar', revenue: 48000, bookings: 13 },
  { month: 'Avr', revenue: 58000, bookings: 18 },
  { month: 'Mai', revenue: 65000, bookings: 22 },
  { month: 'Juin', revenue: 72000, bookings: 25 },
];

const bookingTrendsData = [
  { day: 'Lun', bookings: 8, cancellations: 1 },
  { day: 'Mar', bookings: 12, cancellations: 2 },
  { day: 'Mer', bookings: 15, cancellations: 1 },
  { day: 'Jeu', bookings: 10, cancellations: 3 },
  { day: 'Ven', bookings: 18, cancellations: 2 },
  { day: 'Sam', bookings: 22, cancellations: 1 },
  { day: 'Dim', bookings: 14, cancellations: 0 },
];

const categoryData = [
  { name: 'Outils de construction', value: 35, color: '#10B981' },
  { name: 'Électroménager', value: 25, color: '#3B82F6' },
  { name: 'Jardinage', value: 20, color: '#F59E0B' },
  { name: 'Électronique', value: 15, color: '#EF4444' },
  { name: 'Autres', value: 5, color: '#6B7280' },
];

const performanceData = [
  { metric: 'Taux d\'occupation', value: 85, trend: 'up' },
  { metric: 'Revenus moyens/jour', value: 2400, trend: 'up' },
  { metric: 'Durée moyenne location', value: 3.2, trend: 'down' },
  { metric: 'Taux de satisfaction', value: 4.7, trend: 'up' },
];

export default function DashboardAnalytics() {
  const { stats, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceData.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.metric}</p>
                  <p className="text-2xl font-bold">
                    {typeof metric.value === 'number' && metric.value > 100 
                      ? metric.value.toLocaleString() 
                      : metric.value
                    }
                    {metric.metric.includes('Taux') ? '%' : ''}
                    {metric.metric.includes('Revenus') ? ' FCFA' : ''}
                    {metric.metric.includes('Durée') ? ' jours' : ''}
                    {metric.metric.includes('satisfaction') ? '/5' : ''}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${
                  metric.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Évolution des revenus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Évolution des revenus</span>
          </CardTitle>
          <CardDescription>
            Revenus et nombre de réservations par mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `${value.toLocaleString()} FCFA` : value,
                  name === 'revenue' ? 'Revenus' : 'Réservations'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
              <Bar dataKey="bookings" fill="#3B82F6" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendances des réservations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Tendances hebdomadaires</span>
            </CardTitle>
            <CardDescription>
              Réservations et annulations par jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bookingTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  name="Réservations"
                />
                <Line 
                  type="monotone" 
                  dataKey="cancellations" 
                  stroke="#EF4444" 
                  strokeWidth={2} 
                  name="Annulations"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par catégories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Répartition par catégories</span>
            </CardTitle>
            <CardDescription>
              Pourcentage des réservations par type d'équipement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Statistiques détaillées</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats?.bookingCount || 0}</p>
              <p className="text-sm text-muted-foreground">Réservations totales</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats?.equipmentCount || 0}</p>
              <p className="text-sm text-muted-foreground">Équipements actifs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {stats?.revenue ? `${stats.revenue.toLocaleString()} FCFA` : '0 FCFA'}
              </p>
              <p className="text-sm text-muted-foreground">Revenus du mois</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}