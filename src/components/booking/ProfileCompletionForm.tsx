
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/auth';
import { toast } from '@/components/ui/use-toast';
import { Loader2, User, Phone, MapPin, CreditCard } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone_number: z.string().min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres'),
  address: z.string().min(5, 'L\'adresse doit être complète'),
  city: z.string().min(2, 'La ville est requise'),
  country: z.string().min(2, 'Le pays est requis'),
  id_number: z.string().min(5, 'Le numéro de pièce d\'identité est requis')
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileCompletionFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function ProfileCompletionForm({ onComplete, onCancel }: ProfileCompletionFormProps) {
  const { profile, updateProfile } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone_number: profile?.phone_number || '',
      address: profile?.address || '',
      city: profile?.city || '',
      country: profile?.country || 'Bénin',
      id_number: profile?.id_number || ''
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      const success = await updateProfile(data);
      if (success) {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été sauvegardées avec succès",
        });
        onComplete();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Compléter vos informations
        </CardTitle>
        <p className="text-sm text-gray-600">
          Ces informations sont nécessaires pour établir le contrat de location
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="Votre prénom"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600 mt-1">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="Votre nom"
              />
              {errors.last_name && (
                <p className="text-sm text-red-600 mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="phone_number" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Numéro de téléphone *
            </Label>
            <Input
              id="phone_number"
              {...register('phone_number')}
              placeholder="+229 XX XX XX XX"
            />
            {errors.phone_number && (
              <p className="text-sm text-red-600 mt-1">{errors.phone_number.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse complète *
            </Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Votre adresse complète"
              rows={2}
            />
            {errors.address && (
              <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Votre ville"
              />
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Pays *</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="Votre pays"
              />
              {errors.country && (
                <p className="text-sm text-red-600 mt-1">{errors.country.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="id_number" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Numéro de pièce d'identité *
            </Label>
            <Input
              id="id_number"
              {...register('id_number')}
              placeholder="Numéro de CNI, passeport, etc."
            />
            {errors.id_number && (
              <p className="text-sm text-red-600 mt-1">{errors.id_number.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Continuer la réservation'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
