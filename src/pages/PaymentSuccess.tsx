import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, loading } = usePayment();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [bookingId, setBookingId] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const bookingIdFromUrl = searchParams.get('booking_id');

  useEffect(() => {
    const handleVerification = async () => {
      if (!sessionId) {
        setVerificationStatus('error');
        return;
      }

      try {
        const result = await verifyPayment(sessionId);
        if (result.success) {
          setVerificationStatus('success');
          setBookingId(result.bookingId || bookingIdFromUrl);
        } else {
          setVerificationStatus('error');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('error');
      }
    };

    handleVerification();
  }, [sessionId, bookingIdFromUrl, verifyPayment]);

  if (verificationStatus === 'verifying' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vérification du paiement</h2>
            <p className="text-gray-600 text-center">
              Nous vérifions votre paiement, veuillez patienter...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-600">Erreur de paiement</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Une erreur s'est produite lors de la vérification de votre paiement.
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/my-bookings')} className="w-full">
                Voir mes réservations
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-green-600">Paiement confirmé !</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Votre paiement a été traité avec succès. Votre réservation est maintenant confirmée.
          </p>
          {bookingId && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">
                Numéro de réservation: <strong>{bookingId.slice(0, 8)}</strong>
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/my-bookings')} 
              className="w-full"
            >
              Voir mes réservations
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}