
// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Wallet, Plus, ArrowLeft, Euro } from "lucide-react";
// import { useWallet } from "@/hooks/useWallet";
// import { Skeleton } from "@/components/ui/skeleton";

// const MyWallet: React.FC = () => {
//   const navigate = useNavigate();
//   const { wallet, loading, error } = useWallet();

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
//             <h1 className="text-2xl font-bold text-gray-900">Mon portefeuille</h1>
//             <p className="text-gray-600">Gérez vos paiements et revenus</p>
//           </div>
//         </div>

//         {/* Balance Card */}
//         <Card className="mb-8">
//           <CardHeader>
//             <CardTitle className="flex items-center space-x-2">
//               <Wallet className="h-5 w-5 text-green-600" />
//               <span>Solde disponible</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <Skeleton className="h-10 w-32 mb-4" />
//             ) : (
//               <div className="text-3xl font-bold text-green-600 mb-4">
//                 {wallet ? `${wallet.balance.toFixed(2)} €` : '0,00 €'}
//               </div>
//             )}
//             <div className="flex space-x-4">
//               <Button 
//                 className="bg-green-600 hover:bg-green-700"
//                 disabled={loading}
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Recharger
//               </Button>
//               <Button 
//                 variant="outline"
//                 disabled={loading || !wallet || wallet.balance <= 0}
//               >
//                 <Euro className="h-4 w-4 mr-2" />
//                 Retirer
//               </Button>
//             </div>
//             {error && (
//               <p className="text-red-600 text-sm mt-2">{error}</p>
//             )}
//             {wallet && (
//               <p className="text-gray-500 text-sm mt-2">
//                 ID Portefeuille: {wallet.id.slice(0, 8)}...
//               </p>
//             )}
//           </CardContent>
//         </Card>

//         {/* Transaction History */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Historique des transactions</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-center py-8 text-gray-500">
//               <p className="text-lg font-medium mb-2">Aucune transaction</p>
//               <p className="text-sm">Vos transactions apparaîtront ici</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default MyWallet;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  Smartphone, 
  TrendingUp, 
  TrendingDown,
  History,
  Filter,
  Download,
  Eye,
  Plus,
  Minus,
  DollarSign
} from 'lucide-react';

const MyWallet = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [transactionFilter, setTransactionFilter] = useState('all');

  // Données d'exemple
  const walletData = {
    balance: 450000,
    currency: 'FCFA',
    totalEarnings: 1250000,
    totalSpent: 800000,
    pendingAmount: 25000,
    lastUpdate: '2025-01-15T10:30:00Z'
  };

  const transactions = [
    {
      id: '1',
      type: 'credit',
      amount: 142500,
      description: 'Revenus location - Pelleteuse #EQ123',
      date: '2025-01-15T09:15:00Z',
      status: 'completed',
      commission: 7500,
      reference: 'LOC-2025-001',
      paymentMethod: 'automatic'
    },
    {
      id: '2',
      type: 'debit',
      amount: -189000,
      description: 'Paiement location - Grue mobile #EQ456',
      date: '2025-01-14T14:22:00Z',
      status: 'completed',
      commission: 9450,
      reference: 'PAY-2025-002',
      paymentMethod: 'card'
    },
    {
      id: '3',
      type: 'commission',
      amount: -7500,
      description: 'Commission plateforme (5%)',
      date: '2025-01-15T09:15:00Z',
      status: 'completed',
      reference: 'COM-2025-001',
      paymentMethod: 'automatic'
    },
    {
      id: '4',
      type: 'refund',
      amount: 75000,
      description: 'Remboursement caution - Excavatrice #EQ789',
      date: '2025-01-13T11:45:00Z',
      status: 'completed',
      reference: 'REF-2025-001',
      paymentMethod: 'automatic'
    },
    {
      id: '5',
      type: 'credit',
      amount: 50000,
      description: 'Recharge portefeuille',
      date: '2025-01-12T16:30:00Z',
      status: 'completed',
      paymentMethod: 'mobile_money'
    }
  ];

  const getTransactionIcon = (type) => {
    const icons = {
      credit: <ArrowUpCircle className="h-5 w-5 text-green-600" />,
      debit: <ArrowDownCircle className="h-5 w-5 text-red-600" />,
      commission: <Minus className="h-5 w-5 text-orange-600" />,
      refund: <Plus className="h-5 w-5 text-blue-600" />
    };
    return icons[type] || <DollarSign className="h-5 w-5 text-gray-600" />;
  };

  const getTransactionColor = (type) => {
    const colors = {
      credit: 'text-green-600',
      debit: 'text-red-600',
      commission: 'text-orange-600',
      refund: 'text-blue-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const WalletOverview = () => (
    <div className="space-y-6">
      {/* Carte principale du portefeuille */}
      <div className="relative">
        <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <CardContent className="relative p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-blue-100 text-sm font-medium">Solde disponible</p>
                <h2 className="text-4xl font-bold mt-1">
                  {walletData.balance.toLocaleString()} {walletData.currency}
                </h2>
              </div>
              <Wallet className="h-12 w-12 text-blue-200" />
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-blue-100 text-xs">Total gagné</p>
                <p className="text-xl font-semibold">
                  {walletData.totalEarnings.toLocaleString()} FCFA
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-xs">Total dépensé</p>
                <p className="text-xl font-semibold">
                  {walletData.totalSpent.toLocaleString()} FCFA
                </p>
              </div>
            </div>
            
            {walletData.pendingAmount > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
                <p className="text-yellow-100 text-sm">
                  <strong>{walletData.pendingAmount.toLocaleString()} FCFA</strong> en attente de validation
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-4">
        <Button className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700">
          <ArrowUpCircle className="h-8 w-8" />
          <span className="font-semibold">Recharger</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col space-y-2 border-2">
          <ArrowDownCircle className="h-8 w-8" />
          <span className="font-semibold">Retirer</span>
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">+15%</p>
            <p className="text-sm text-gray-600">Revenus ce mois</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-gray-600">Transactions ce mois</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">95%</p>
            <p className="text-sm text-gray-600">Après commission</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const TransactionHistory = () => (
    <div className="space-y-6">
      {/* Filtres et contrôles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={transactionFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTransactionFilter('all')}
              >
                Toutes
              </Button>
              <Button 
                variant={transactionFilter === 'credit' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTransactionFilter('credit')}
              >
                Crédits
              </Button>
              <Button 
                variant={transactionFilter === 'debit' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTransactionFilter('debit')}
              >
                Débits
              </Button>
              <Button 
                variant={transactionFilter === 'commission' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTransactionFilter('commission')}
              >
                Commissions
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <div className="space-y-3">
        {transactions
          .filter(t => transactionFilter === 'all' || t.type === transactionFilter)
          .map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {transaction.description}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-gray-600">
                        {formatDate(transaction.date)}
                      </p>
                      {transaction.reference && (
                        <p className="text-xs text-gray-500 font-mono">
                          Réf: {transaction.reference}
                        </p>
                      )}
                      {transaction.paymentMethod && (
                        <div className="flex items-center text-xs text-gray-500">
                          {transaction.paymentMethod === 'card' && <CreditCard className="h-3 w-3 mr-1" />}
                          {transaction.paymentMethod === 'mobile_money' && <Smartphone className="h-3 w-3 mr-1" />}
                          {transaction.paymentMethod === 'automatic' && <Wallet className="h-3 w-3 mr-1" />}
                          {transaction.paymentMethod === 'card' ? 'Carte' : 
                           transaction.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Automatique'}
                        </div>
                      )}
                    </div>
                    
                    {transaction.commission && transaction.type === 'credit' && (
                      <p className="text-xs text-orange-600 mt-1">
                        Commission déduite: {transaction.commission.toLocaleString()} FCFA (5%)
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount > 0 ? '+' : ''}
                    {Math.abs(transaction.amount).toLocaleString()} FCFA
                  </p>
                  <Button variant="ghost" size="sm" className="mt-1 h-6 px-2">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>Précédent</Button>
          <Button variant="default" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Suivant</Button>
        </div>
      </div>
    </div>
  );

  const Analytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Analytiques financières</h3>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Revenus par période
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span>Cette semaine</span>
                <span className="font-semibold text-green-600">
                  +{(142500).toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Semaine dernière</span>
                <span className="font-semibold">
                  +{(89000).toLocaleString()} FCFA
                </span>
              </div>
              <div className="text-center text-sm text-green-600 font-medium">
                📈 +60% par rapport à la semaine dernière
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
              Commissions payées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {(17500).toLocaleString()} FCFA
                </p>
                <p className="text-sm text-gray-600">Total commissions ce mois</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-700">
                  Commission fixe de <strong>5%</strong> sur toutes les transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'analytics', label: 'Analytiques', icon: TrendingUp }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Portefeuille</h1>
          <p className="text-gray-600">Gérez vos finances et transactions</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Dernière mise à jour</p>
          <p className="text-sm font-medium">{formatDate(walletData.lastUpdate)}</p>
        </div>
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
        {activeTab === 'overview' && <WalletOverview />}
        {activeTab === 'transactions' && <TransactionHistory />}
        {activeTab === 'analytics' && <Analytics />}
      </div>
    </div>
  );
};

export default MyWallet;
