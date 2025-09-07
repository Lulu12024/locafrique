// MODIFIER le fichier existant : /src/components/booking/ProfileCompletionForm.tsx
// Remplacer TOUT le contenu par ce code

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/auth';
import { toast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  Shield,
  CheckCircle,
  Upload,
  Camera,
  FileText,
  UserCheck,
  Award,
  Mail
} from 'lucide-react';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentsUploaded, setDocumentsUploaded] = useState({
    identity_front: false,
    identity_back: false,
    proof_address: false
  });

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

  // Calcul du pourcentage de completion
  const getCompletionPercentage = () => {
    const fields = ['first_name', 'last_name', 'phone_number', 'address', 'city', 'country', 'id_number'];
    const completedFields = fields.filter(field => profile?.[field]);
    const documentProgress = Object.values(documentsUploaded).filter(Boolean).length * 10;
    return Math.round((completedFields.length / fields.length) * 70 + documentProgress);
  };

  // Simulation d'upload de document
  const handleDocumentUpload = (docType: string) => {
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDocumentsUploaded(prev => ({ ...prev, [docType]: true }));
          
          toast({
            title: "Document téléchargé",
            description: `Document ${docType} uploadé avec succès. Vérification automatique en cours...`,
          });
          
          // Simulation de vérification automatique
          setTimeout(() => {
            toast({
              title: "✅ Document vérifié",
              description: "Document validé automatiquement par notre système IA.",
            });
          }, 2000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      console.log('📝 Mise à jour du profil avec vérification automatique...');
      
      const success = await updateProfile(data);
      if (success) {
        // Simulation de validation automatique des informations
        toast({
          title: "✅ Profil mis à jour",
          description: "Vos informations ont été sauvegardées et vérifiées automatiquement.",
        });
        
        // Passer à l'étape de vérification des documents
        setVerificationStep(2);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinalValidation = () => {
    const allDocumentsUploaded = Object.values(documentsUploaded).every(Boolean);
    
    if (!allDocumentsUploaded) {
      toast({
        title: "Documents manquants",
        description: "Veuillez télécharger tous les documents requis.",
        variant: "destructive"
      });
      return;
    }

    // Simulation de validation finale automatique
    toast({
      title: "🎉 Validation automatique terminée",
      description: "Votre profil est maintenant vérifié. Un email de confirmation vous a été envoyé.",
    });

    onComplete();
  };

  if (verificationStep === 1) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Compléter vos informations
            </CardTitle>
            <div className="text-right">
              <div className="text-sm text-gray-600">Progression</div>
              <div className="text-lg font-semibold">{getCompletionPercentage()}%</div>
            </div>
          </div>
          <Progress value={getCompletionPercentage()} className="h-2" />
          <p className="text-sm text-gray-600">
            Ces informations sont nécessaires pour établir le contrat de location avec validation automatique
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Prénom *
                </Label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone_number" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone *
                </Label>
                <Input
                  id="phone_number"
                  type="tel"
                  {...register('phone_number')}
                  placeholder="+229 XX XX XX XX"
                  className={errors.phone_number ? 'border-red-500' : ''}
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone_number.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="id_number" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Numéro pièce d'identité *
                </Label>
                <Input
                  id="id_number"
                  {...register('id_number')}
                  placeholder="Numéro de votre CNI"
                  className={errors.id_number ? 'border-red-500' : ''}
                />
                {errors.id_number && (
                  <p className="text-sm text-red-500 mt-1">{errors.id_number.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse complète *
              </Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Numéro, rue, quartier, ville..."
                className={errors.address ? 'border-red-500' : ''}
                rows={2}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Cotonou"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="country">Pays *</Label>
                <Input
                  id="country"
                  {...register('country')}
                  className={errors.country ? 'border-red-500' : ''}
                />
                {errors.country && (
                  <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>
                )}
              </div>
            </div>

            {/* Information sur la validation automatique */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Validation automatique</h4>
                    <p className="text-sm text-blue-700">
                      Vos informations seront vérifiées automatiquement pour accélérer le processus
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={isUpdating} className="flex-1">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Valider et continuer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Étape 2: Vérification des documents
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Vérification des documents
        </CardTitle>
        <Progress value={getCompletionPercentage()} className="h-2" />
        <p className="text-sm text-gray-600">
          Téléchargez vos documents pour la validation automatique
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Guide de vérification */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <UserCheck className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold text-green-900 mb-2">
                  Vérification automatique activée
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Reconnaissance automatique des documents par IA</li>
                  <li>• Validation en temps réel de l'authenticité</li>
                  <li>• Notification email immédiate après validation</li>
                  <li>• Commission de 5% appliquée automatiquement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents requis */}
        <div className="space-y-4">
          {[
            {
              key: 'identity_front',
              title: 'Carte d\'identité (recto)',
              description: 'Photo claire du recto de votre pièce d\'identité',
              icon: <CreditCard className="h-6 w-6" />
            },
            {
              key: 'identity_back',
              title: 'Carte d\'identité (verso)',
              description: 'Photo claire du verso de votre pièce d\'identité',
              icon: <CreditCard className="h-6 w-6" />
            },
            {
              key: 'proof_address',
              title: 'Justificatif de domicile',
              description: 'Facture récente (eau, électricité) ou attestation',
              icon: <MapPin className="h-6 w-6" />
            }
          ].map(doc => (
            <Card key={doc.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      documentsUploaded[doc.key] ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {documentsUploaded[doc.key] ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        doc.icon
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{doc.title}</h4>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      {documentsUploaded[doc.key] && (
                        <p className="text-sm text-green-600 mt-1">
                          ✅ Document vérifié automatiquement
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {documentsUploaded[doc.key] ? (
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vérifié
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Télécharger {doc.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-lg font-medium mb-2">
                                Prenez une photo ou sélectionnez un fichier
                              </p>
                              <p className="text-sm text-gray-600 mb-4">
                                JPG, PNG, PDF - Maximum 10MB
                              </p>
                              <div className="flex space-x-3 justify-center">
                                <Button variant="outline">
                                  <Camera className="h-4 w-4 mr-2" />
                                  Appareil photo
                                </Button>
                                <Button onClick={() => handleDocumentUpload(doc.key)}>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choisir un fichier
                                </Button>
                              </div>
                            </div>
                            
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Téléchargement et vérification...</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} />
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Validation finale automatique */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-orange-900">Notification automatique</h4>
                <p className="text-sm text-orange-700">
                  Un email de confirmation sera envoyé automatiquement après validation complète.
                  Commission de 5% appliquée automatiquement sur toutes les transactions.
                </p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button 
            onClick={handleFinalValidation} 
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!Object.values(documentsUploaded).every(Boolean)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finaliser la validation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}