// MODIFIER le fichier existant : /src/pages/MyWallet.tsx
// Remplacer TOUT le contenu par ce code

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  ArrowUpCircle, 
  ArrowDownCircle,
  Plus,
  Minus,
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
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Interface pour les transactions
interface WalletTransaction {
  id: string;
  amount: number;
  transaction_type: 'credit' | 'debit' | 'commission' | 'refund';
  description: string;
  reference_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  payment_method?: string;
  booking_id?: string;
  commission_amount?: number;
}

const MyWallet = () => {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, error: walletError, reloadWallet } = useWallet();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Charger les transactions
  useEffect(() => {
    if (wallet?.id && user?.id) {
      loadTransactions();
    }
  }, [wallet?.id, user?.id]);

  const loadTransactions = async () => {
    if (!wallet?.id) return;
    
    setTransactionsLoading(true);
    try {
      console.log('📊 Chargement des transactions pour le portefeuille:', wallet.id);
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erreur lors du chargement des transactions:', error);
        throw error;
      }

      console.log('✅ Transactions chargées:', data?.length || 0);
      setTransactions(data || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des transactions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des transactions.",
        variant: "destructive"
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Traitement des recharges
  const handleAddFunds = async () => {
    if (!addAmount || !wallet?.id) return;
    
    const amount = parseFloat(addAmount);
    if (amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('💰 Ajout de fonds:', amount);
      
      // Appeler la fonction SQL pour créer la transaction
      const { error } = await supabase.rpc('create_wallet_transaction', {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_transaction_type: 'credit',
        p_description: `Recharge portefeuille - ${amount.toLocaleString()} FCFA`
      });

      if (error) {
        console.error('❌ Erreur lors de l\'ajout de fonds:', error);
        throw error;
      }

      toast({
        title: "✅ Recharge effectuée",
        description: `${amount.toLocaleString()} FCFA ont été ajoutés à votre portefeuille.`,
      });

      // Recharger les données
      await Promise.all([reloadWallet(), loadTransactions()]);
      setShowAddFunds(false);
      setAddAmount('');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de fonds:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter des fonds. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // Traitement des retraits
  const handleWithdraw = async () => {
    if (!withdrawAmount || !wallet?.id) return;
    
    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > (wallet.balance || 0)) {
      toast({
        title: "Montant invalide",
        description: "Montant invalide ou solde insuffisant.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('💸 Retrait de fonds:', amount);
      
      // Insérer directement dans wallet_transactions
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          amount: -amount,
          transaction_type: 'debit',
          description: `Retrait portefeuille - ${amount.toLocaleString()} FCFA`
        });

      if (transactionError) {
        console.error('❌ Erreur lors du retrait:', transactionError);
        throw transactionError;
      }

      // Mettre à jour le solde du portefeuille
      const { error: balanceError } = await supabase
        .from('wallets')
        .update({ 
          balance: wallet.balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (balanceError) {
        console.error('❌ Erreur mise à jour solde:', balanceError);
        throw balanceError;
      }

      toast({
        title: "✅ Retrait effectué",
        description: `${amount.toLocaleString()} FCFA ont été retirés de votre portefeuille.`,
      });

      // Recharger les données
      await Promise.all([reloadWallet(), loadTransactions()]);
      setShowWithdraw(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('❌ Erreur lors du retrait:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le retrait. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    const iconMap = {
      credit: <TrendingUp className="h-5 w-5 text-green-600" />,
      debit: <TrendingDown className="h-5 w-5 text-red-600" />,
      commission: <Percent className="h-5 w-5 text-orange-600" />,
      refund: <ArrowUpCircle className="h-5 w-5 text-blue-600" />
    };
    return iconMap[type] || <DollarSign className="h-5 w-5 text-gray-600" />;
  };

  const getTransactionColor = (type: string) => {
    const colorMap = {
      credit: 'text-green-600',
      debit: 'text-red-600',
      commission: 'text-orange-600',
      refund: 'text-blue-600'
    };
    return colorMap[type] || 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>,
      pending: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />En cours</Badge>,
      failed: <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="h-3 w-3 mr-1" />Échoué</Badge>
    };
    return statusMap[status] || <Badge variant="secondary">{status}</Badge>;
  };

  const formatAmount = (amount: number, showPrefix = true) => {
    const prefix = showPrefix ? (amount > 0 ? '+' : '') : '';
    return `${prefix}${Math.abs(amount).toLocaleString()} FCFA`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrer les transactions
  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'credits') return t.amount > 0;
    if (transactionFilter === 'debits') return t.amount < 0;
    if (transactionFilter === 'commissions') return t.transaction_type === 'commission';
    return t.transaction_type === transactionFilter;
  });

  // Calculer les statistiques
  const stats = {
    totalEarnings: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    totalSpent: Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
    totalCommissions: transactions.filter(t => t.transaction_type === 'commission').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    monthlyTransactions: transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
    }).length
  };

  const WalletOverview = () => (
    <div className="space-y-6">
      {/* Solde principal */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Solde disponible</p>
              {walletLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-2xl font-bold">Chargement...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold">{wallet?.balance?.toLocaleString() || '0'} FCFA</p>
              )}
              <p className="text-blue-100 text-sm mt-1">
                Portefeuille ID: {wallet?.id?.substring(0, 8) || 'Non disponible'}...
              </p>
            </div>
            <div className="text-right">
              <Wallet className="h-12 w-12 text-blue-200 mb-2" />
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                Commission fixe 5%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-4">
        <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
          <DialogTrigger asChild>
            <Button className="h-16 flex-col space-y-2 bg-green-600 hover:bg-green-700">
              <ArrowUpCircle className="h-6 w-6" />
              <span className="font-semibold">Recharger</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recharger le portefeuille</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Montant (FCFA)</Label>
                <Input 
                  type="number" 
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="50000" 
                />
              </div>
              <div>
                <Label>Méthode de paiement</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleAddFunds}
                disabled={!addAmount}
              >
                Confirmer le rechargement
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-16 flex-col space-y-2 border-2"
              disabled={!wallet?.balance || wallet.balance <= 0}
            >
              <ArrowDownCircle className="h-6 w-6" />
              <span className="font-semibold">Retirer</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retirer des fonds</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Montant à retirer (FCFA)</Label>
                <Input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="100000" 
                />
                <p className="text-sm text-gray-600 mt-1">
                  Solde disponible: {wallet?.balance?.toLocaleString() || '0'} FCFA
                </p>
              </div>
              <div>
                <Label>Méthode de retrait</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⏱️ Les retraits sont traités sous 24-48h ouvrées
                </p>
              </div>
              <Button 
                className="w-full"
                onClick={handleWithdraw}
                disabled={!withdrawAmount}
              >
                Demander le retrait
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques avec vraies données */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {stats.totalEarnings.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total des revenus</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">
              {stats.totalSpent.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total des dépenses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Percent className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">
              {stats.totalCommissions.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Commissions (5%)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const TransactionHistory = () => (
    <div className="space-y-6">
      {/* Contrôles et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={transactionFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTransactionFilter('all')}
              >
                Toutes ({transactions.length})
              </Button>
              <Button 
                variant={transactionFilter === 'credits' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTransactionFilter('credits')}
              >
                Crédits ({transactions.filter(t => t.amount > 0).length})
              </Button>
              <Button 
                variant={transactionFilter === 'debits' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTransactionFilter('debits')}
              >
                Débits ({transactions.filter(t => t.amount < 0).length})
              </Button>
              <Button 
                variant={transactionFilter === 'commissions' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTransactionFilter('commissions')}
              >
                Commissions ({transactions.filter(t => t.transaction_type === 'commission').length})
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadTransactions}>
                <Filter className="h-4 w-4 mr-2" />
                Actualiser
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
        {transactionsLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement des transactions...</p>
            </CardContent>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune transaction trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {transaction.description}
                        </h4>
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </p>
                        {transaction.reference_id && (
                          <p className="text-xs text-gray-500 font-mono">
                            Réf: {transaction.reference_id.substring(0, 8)}...
                          </p>
                        )}
                      </div>
                      
                      {transaction.commission_amount && (
                        <div className="mt-2 p-2 bg-orange-50 rounded text-xs">
                          <p className="text-orange-600">
                            💰 Commission automatique: {transaction.commission_amount.toLocaleString()} FCFA (5%)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                      {formatAmount(transaction.amount)}
                    </p>
                    
                    {transaction.payment_method && (
                      <div className="flex items-center justify-end text-xs text-gray-500 mt-1">
                        {transaction.payment_method === 'card' && <CreditCard className="h-3 w-3 mr-1" />}
                        {transaction.payment_method === 'mobile_money' && <Smartphone className="h-3 w-3 mr-1" />}
                        {transaction.payment_method === 'automatic' && <Wallet className="h-3 w-3 mr-1" />}
                        {transaction.payment_method}
                      </div>
                    )}
                    
                    {transaction.booking_id && (
                      <Button variant="ghost" size="sm" className="p-1 h-auto mt-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Détails
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  // Affichage des erreurs
  if (walletError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur de portefeuille</h2>
            <p className="text-red-600 mb-4">{walletError}</p>
            <Button onClick={reloadWallet} variant="outline">
              <Loader2 className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Wallet },
    { id: 'transactions', label: 'Historique', icon: History }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portefeuille & Transactions</h1>
          <p className="text-gray-600">Gérez vos finances avec commission automatique de 5%</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Dernière mise à jour</p>
          <p className="text-sm font-medium">
            {wallet?.updated_at ? formatDate(wallet.updated_at) : 'Jamais'}
          </p>
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
      </div>
    </div>
  );
};

export default MyWallet;