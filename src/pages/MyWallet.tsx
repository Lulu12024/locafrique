// REMPLACER COMPLÈTEMENT le fichier : src/pages/MyWallet.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WalletRechargeModal } from '@/components/wallet/WalletRechargeModal';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  ArrowUpCircle, 
  ArrowDownCircle,
  Plus,
  DollarSign,
  CreditCard,
  Smartphone,
  History,
  Download,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Percent,
  Loader2,
  RefreshCw,
  Calendar,
  Euro,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEnhancedWallet } from '@/hooks/useEnhancedWallet';

export default function MyWallet() {
  const {
    wallet,
    transactions,
    isLoading,
    isRecharging,
    stats,
    loadWalletData,
    rechargeWallet,
    hasSufficientBalance
  } = useEnhancedWallet();

  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('all');

  // Filtrer les transactions par type
  const filteredTransactions = transactions.filter(transaction => {
    if (selectedTransactionType === 'all') return true;
    return transaction.transaction_type === selectedTransactionType;
  });

  // Obtenir l'icône et la couleur pour chaque type de transaction
  const getTransactionDisplay = (transaction: any) => {
    switch (transaction.transaction_type) {
      case 'credit':
        return {
          icon: ArrowUpCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Crédit',
          sign: '+'
        };
      case 'debit':
        return {
          icon: ArrowDownCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Débit',
          sign: '-'
        };
      case 'refund':
        return {
          icon: TrendingUp,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Remboursement',
          sign: '+'
        };
      case 'commission':
        return {
          icon: Percent,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          label: 'Commission',
          sign: '-'
        };
      default:
        return {
          icon: DollarSign,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Transaction',
          sign: ''
        };
    }
  };

  // Obtenir le statut avec style
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', label: 'Complété' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', label: 'En attente' };
      case 'failed':
        return { icon: AlertCircle, color: 'text-red-600', label: 'Échoué' };
      default:
        return { icon: Clock, color: 'text-gray-600', label: 'Inconnu' };
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Chargement de votre portefeuille...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Wallet className="mr-3 h-8 w-8 text-blue-600" />
          Mon Portefeuille
        </h1>
        <Button
          onClick={loadWalletData}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Solde actuel */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">
              Solde actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.currentBalance.toLocaleString()} FCFA
            </div>
            <p className="text-blue-100 text-sm">
              Disponible pour vos réservations
            </p>
          </CardContent>
        </Card>

        {/* Total crédités */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
              Total crédité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-1">
              +{stats.totalCredits.toLocaleString()} FCFA
            </div>
            <p className="text-gray-500 text-sm">
              Recharges et remboursements
            </p>
          </CardContent>
        </Card>

        {/* Total débité */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
              Total débité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 mb-1">
              -{stats.totalDebits.toLocaleString()} FCFA
            </div>
            <p className="text-gray-500 text-sm">
              Réservations et frais
            </p>
          </CardContent>
        </Card>

        {/* Nombre de transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <History className="mr-1 h-4 w-4 text-purple-600" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.transactionCount}
            </div>
            <p className="text-gray-500 text-sm">
              {stats.lastTransactionDate 
                ? `Dernière: ${format(new Date(stats.lastTransactionDate), 'dd/MM', { locale: fr })}`
                : 'Aucune transaction'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setShowRechargeModal(true)}
              className="h-16 bg-emerald-600 hover:bg-emerald-700"
              disabled={isRecharging}
            >
              {isRecharging ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Recharger mon portefeuille
                </>
              )}
            </Button>
            
            <Button variant="outline" className="h-16">
              <Download className="mr-2 h-5 w-5" />
              Télécharger l'historique
            </Button>
            
            <Button variant="outline" className="h-16">
              <Eye className="mr-2 h-5 w-5" />
              Voir les statistiques
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section des transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              Historique des transactions
            </CardTitle>
            
            {/* Filtres */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedTransactionType}
                onChange={(e) => setSelectedTransactionType(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">Toutes</option>
                <option value="credit">Crédits</option>
                <option value="debit">Débits</option>
                <option value="refund">Remboursements</option>
                <option value="commission">Commissions</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune transaction
              </h3>
              <p className="text-gray-500 mb-6">
                Vous n'avez pas encore de transactions dans votre portefeuille.
              </p>
              <Button onClick={() => setShowRechargeModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Effectuer votre première recharge
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => {
                const display = getTransactionDisplay(transaction);
                const status = getStatusDisplay(transaction.status);
                const Icon = display.icon;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Icône de transaction */}
                      <div className={`p-2 rounded-full ${display.bgColor}`}>
                        <Icon className={`h-5 w-5 ${display.color}`} />
                      </div>
                      
                      {/* Détails */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {transaction.description || display.label}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {display.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-500">
                            {format(new Date(transaction.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                          
                          {transaction.booking_id && (
                            <Badge variant="outline" className="text-xs">
                              Réservation
                            </Badge>
                          )}
                          
                          {transaction.payment_method && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.payment_method}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Montant et statut */}
                    <div className="text-right">
                      <div className={`text-lg font-bold ${display.color}`}>
                        {display.sign}{Math.abs(transaction.amount).toLocaleString()} FCFA
                      </div>
                      
                      <div className="flex items-center justify-end mt-1">
                        <StatusIcon className={`h-4 w-4 mr-1 ${status.color}`} />
                        <span className={`text-sm ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations importantes */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 Bon à savoir :</strong> Votre portefeuille vous permet de payer vos réservations instantanément. 
          En cas de refus d'une réservation par le propriétaire, le montant est automatiquement remboursé. 
          Les recharges sont sécurisées via Stripe et KakiaPay.
        </AlertDescription>
      </Alert>

      {/* Modal de recharge */}
      <WalletRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onSuccess={() => {
          setShowRechargeModal(false);
          loadWalletData();
        }}
        currentBalance={stats.currentBalance}
      />
    </div>
  );
}

// =========================================================================
