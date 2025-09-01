
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReviewCommissions, ReviewCommission } from '@/hooks/useReviewCommissions';
import { CommissionAlert } from '@/components/reviews/CommissionAlert';
import { CreditCard, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function CommissionsPanel() {
  const [commissions, setCommissions] = useState<ReviewCommission[]>([]);
  const { fetchOwnerCommissions, markCommissionAsPaid, isLoading } = useReviewCommissions();

  useEffect(() => {
    const loadCommissions = async () => {
      const data = await fetchOwnerCommissions();
      setCommissions(data);
    };
    loadCommissions();
  }, []);

  const handlePayCommission = async (commissionId: string) => {
    const result = await markCommissionAsPaid(commissionId);
    if (result.success) {
      // Recharger les commissions
      const updatedCommissions = await fetchOwnerCommissions();
      setCommissions(updatedCommissions);
    }
  };

  const pendingCommissions = commissions.filter(c => c.status === 'pending');
  const totalPendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Commissions des avis
        </CardTitle>
        <CardDescription>
          Gérez les commissions dues pour vos évaluations positives
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {totalPendingAmount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-800">
                  Total des commissions en attente
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {totalPendingAmount.toLocaleString()} FCFA
                </p>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {pendingCommissions.length} en attente
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {commissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Aucune commission pour le moment</p>
            </div>
          ) : (
            commissions.map((commission) => (
              <Card key={commission.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={commission.status === 'pending' ? 'destructive' : 'secondary'}
                          className={
                            commission.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : commission.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : ''
                          }
                        >
                          {commission.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {commission.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {commission.status === 'pending' ? 'En attente' : 
                           commission.status === 'paid' ? 'Payée' : 'Annulée'}
                        </Badge>
                        <span className="text-lg font-semibold">
                          {commission.amount.toLocaleString()} FCFA
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        Créée le {format(new Date(commission.created_at), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                      
                      {commission.status === 'pending' && (
                        <p className="text-sm text-amber-600">
                          Échéance: {format(new Date(commission.due_date), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                      
                      {commission.paid_at && (
                        <p className="text-sm text-green-600">
                          Payée le {format(new Date(commission.paid_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                    </div>
                    
                    {commission.status === 'pending' && (
                      <Button
                        onClick={() => handlePayCommission(commission.id)}
                        disabled={isLoading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
