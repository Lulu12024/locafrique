// src/components/wallet/WalletRechargeModal.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  CreditCard, 
  Smartphone, 
  Plus,
  Zap,
  Shield,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface WalletRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
}

export function WalletRechargeModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentBalance 
}: WalletRechargeModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'kakiapay'>('stripe');
  const [isLoading, setIsLoading] = useState(false);

  // Montants prédéfinis
  const presetAmounts = [5000, 10000, 25000, 50000, 100000];

  // Validation du montant
  const isValidAmount = () => {
    const numAmount = parseFloat(amount);
    return numAmount >= 1000 && numAmount <= 500000; // Min 1000 FCFA, Max 500000 FCFA
  };

  // Recharge via Stripe
  const handleStripeRecharge = async (amountValue: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-wallet-recharge', {
        body: {
          amount: amountValue,
          payment_method: 'stripe',
          currency: 'xof' // Franc CFA
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Ouvrir Stripe Checkout dans un nouvel onglet
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirection vers Stripe",
          description: "Vous allez être redirigé vers la page de paiement sécurisée",
        });
      }
    } catch (error: any) {
      console.error('Erreur Stripe:', error);
      toast({
        title: "Erreur Stripe",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive"
      });
    }
  };

  // Recharge via KakiaPay
  const handleKakiaPayRecharge = async (amountValue: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-kakiapay-recharge', {
        body: {
          amount: amountValue,
          payment_method: 'kakiapay',
          currency: 'xof'
        }
      });

      if (error) throw error;

      if (data?.checkout_url) {
        // Ouvrir KakiaPay dans un nouvel onglet
        window.open(data.checkout_url, '_blank');
        
        toast({
          title: "Redirection vers KakiaPay",
          description: "Vous allez être redirigé vers KakiaPay pour le paiement",
        });
      }
    } catch (error: any) {
      console.error('Erreur KakiaPay:', error);
      toast({
        title: "Erreur KakiaPay", 
        description: error.message || "Une erreur s'est produite",
        variant: "destructive"
      });
    }
  };

  // Soumission du formulaire
  const handleRecharge = async () => {
    if (!user || !isValidAmount()) return;

    setIsLoading(true);
    const amountValue = parseFloat(amount);

    try {
      if (paymentMethod === 'stripe') {
        await handleStripeRecharge(amountValue);
      } else {
        await handleKakiaPayRecharge(amountValue);
      }
      
      // Fermer le modal après redirection
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Erreur recharge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Recharger mon portefeuille
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Solde actuel */}
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Solde actuel</span>
                <span className="text-xl font-bold text-emerald-600">
                  {currentBalance.toLocaleString()} FCFA
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Montant à recharger */}
          <div className="space-y-3">
            <Label htmlFor="amount">Montant à recharger (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Saisir le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              max="500000"
            />
            
            {/* Montants prédéfinis */}
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className="text-xs"
                >
                  {preset.toLocaleString()}
                </Button>
              ))}
            </div>
            
            {amount && !isValidAmount() && (
              <p className="text-red-500 text-sm">
                Montant invalide (min: 1 000 FCFA, max: 500 000 FCFA)
              </p>
            )}
          </div>

          <Separator />

          {/* Méthodes de paiement */}
          <div className="space-y-3">
            <Label>Méthode de paiement</Label>
            
            {/* Stripe */}
            <Card 
              className={`cursor-pointer transition-all ${
                paymentMethod === 'stripe' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('stripe')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Stripe</p>
                      <p className="text-sm text-gray-500">Carte bancaire • Sécurisé</p>
                    </div>
                  </div>
                  {paymentMethod === 'stripe' && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KakiaPay */}
            <Card 
              className={`cursor-pointer transition-all ${
                paymentMethod === 'kakiapay' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('kakiapay')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-medium">KakiaPay</p>
                      <p className="text-sm text-gray-500">Mobile Money • MTN, Moov</p>
                    </div>
                  </div>
                  {paymentMethod === 'kakiapay' && (
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nouveau solde prévisionnel */}
          {amount && isValidAmount() && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nouveau solde</span>
                  <span className="text-lg font-bold text-green-600">
                    {(currentBalance + parseFloat(amount)).toLocaleString()} FCFA
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations de sécurité */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Paiement 100% sécurisé</p>
                <p>Vos données bancaires ne sont jamais stockées sur nos serveurs.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRecharge}
              disabled={!isValidAmount() || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Recharger
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}