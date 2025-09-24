// src/pages/ProfileSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle,
  Camera,
  Loader2,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    city: '',
    country: '',
    id_number: ''
  });

  const [verificationStatus, setVerificationStatus] = useState({
    identity: false,
    email: true,
    phone: false,
    address: false
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'Bénin',
        id_number: profile.id_number || ''
      });

      // Calculer le statut de vérification
      setVerificationStatus({
        identity: !!(profile.id_document_url && profile.is_verified),
        email: !!user?.email,
        phone: !!profile.phone_number,
        address: !!(profile.address && profile.city)
      });
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number || null,
        avatar_url: null
      });

      if (result.success) {
        // Mise à jour des informations supplémentaires
        const { error } = await supabase
          .from('profiles')
          .update({
            address: formData.address || null,
            city: formData.city || null,
            country: formData.country || null,
            id_number: formData.id_number || null
          })
          .eq('id', user?.id);

        if (error) throw error;

        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été mises à jour avec succès.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour votre profil.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    if (!user?.id) return;

    setUploadingDocument(true);
    try {
      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-identity-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Sauvegarder dans la base de données
      const { error: dbError } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: user.id,
          document_type: 'identity',
          document_url: urlData.publicUrl,
          verification_status: 'pending'
        });

      if (dbError) throw dbError;

      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ id_document_url: urlData.publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Document envoyé",
        description: "Votre document d'identité a été envoyé pour vérification.",
      });

      setVerificationStatus(prev => ({ ...prev, identity: true }));
    } catch (error: any) {
      toast({
        title: "Erreur d'upload",
        description: error.message || "Impossible d'envoyer le document.",
        variant: "destructive"
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const getCompletionPercentage = () => {
    const fields = [
      formData.first_name,
      formData.last_name,
      formData.phone_number,
      formData.address,
      formData.city,
      formData.id_number
    ];
    const completedFields = fields.filter(field => field && field.trim()).length;
    const verifiedCount = Object.values(verificationStatus).filter(Boolean).length;
    return Math.round(((completedFields + verifiedCount) / (fields.length + 4)) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Veuillez vous connecter pour accéder aux paramètres.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        // VERSION MOBILE
        <div className="pb-6">
          {/* Header mobile */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Profil</h1>
                <p className="text-sm text-gray-600">Gérez vos informations personnelles</p>
              </div>
            </div>
          </div>

          {/* Completion status */}
          <div className="px-4 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-green-100 text-green-700 text-lg">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Profil complété</span>
                  <span className="text-sm text-gray-600">{getCompletionPercentage()}%</span>
                </div>
                <Progress value={getCompletionPercentage()} className="h-2" />
              </div>
            </div>
          </div>

          {/* Form mobile */}
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ''}
                    className="bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                </div>

                <div>
                  <Label htmlFor="phone_number">Téléphone</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+229 XX XX XX XX"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Adresse */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Adresse complète</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Votre adresse complète"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Votre ville"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vérification d'identité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Vérification d'identité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="id_number">Numéro de pièce d'identité</Label>
                  <Input
                    id="id_number"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleInputChange}
                    placeholder="Numéro CNI, passeport..."
                  />
                </div>

                <div>
                  <Label>Document d'identité</Label>
                  <div className="mt-2">
                    {profile?.id_document_url ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-800">Document envoyé</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {profile.is_verified ? 'Vérifié' : 'En attente'}
                        </Badge>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id="document-upload"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(file);
                          }}
                        />
                        <label htmlFor="document-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Cliquer pour télécharger votre pièce d'identité
                          </p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status des vérifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Statut des vérifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: 'email', label: 'Adresse email', icon: Mail },
                    { key: 'phone', label: 'Numéro de téléphone', icon: Phone },
                    { key: 'address', label: 'Adresse', icon: MapPin },
                    { key: 'identity', label: 'Pièce d\'identité', icon: FileText }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {verificationStatus[item.key as keyof typeof verificationStatus] ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Button save */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSaving || uploadingDocument}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder les modifications'
              )}
            </Button>
          </form>
        </div>
      ) : (
        // VERSION DESKTOP
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header desktop */}
          <div className="flex items-center gap-6 mb-8">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paramètres du profil</h1>
              <p className="text-gray-600">Gérez vos informations personnelles et vérifications</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar gauche */}
            <div className="col-span-4">
              {/* Profile summary */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-green-100 text-green-700 text-2xl">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold">{profile?.first_name} {profile?.last_name}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Profil complété</span>
                        <span className="font-medium">{getCompletionPercentage()}%</span>
                      </div>
                      <Progress value={getCompletionPercentage()} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Vérifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Adresse email', icon: Mail },
                      { key: 'phone', label: 'Téléphone', icon: Phone },
                      { key: 'address', label: 'Adresse', icon: MapPin },
                      { key: 'identity', label: 'Identité', icon: FileText }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        {verificationStatus[item.key as keyof typeof verificationStatus] ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Vérifié
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Non vérifié
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="col-span-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations personnelles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informations personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="first_name">Prénom</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Nom</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Adresse email</Label>
                        <Input
                          id="email"
                          value={user.email || ''}
                          className="bg-gray-50"
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                      </div>
                      <div>
                        <Label htmlFor="phone_number">Numéro de téléphone</Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                          placeholder="+229 XX XX XX XX"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Adresse */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Informations d'adresse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address">Adresse complète</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Votre adresse complète"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Votre ville"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Pays</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vérification d'identité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Vérification d'identité
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="id_number">Numéro de pièce d'identité</Label>
                      <Input
                        id="id_number"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleInputChange}
                        placeholder="Numéro CNI, passeport..."
                      />
                    </div>

                    <div>
                      <Label>Document d'identité</Label>
                      <div className="mt-2">
                        {profile?.id_document_url ? (
                          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">Document envoyé</p>
                                <p className="text-sm text-green-600">
                                  {profile.is_verified ? 'Vérifié par notre équipe' : 'En cours de vérification'}
                                </p>
                              </div>
                            </div>
                            <Badge className={profile.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                              {profile.is_verified ? 'Vérifié' : 'En attente'}
                            </Badge>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <input
                              type="file"
                              id="document-upload-desktop"
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentUpload(file);
                              }}
                              disabled={uploadingDocument}
                            />
                            <label htmlFor="document-upload-desktop" className="cursor-pointer">
                              {uploadingDocument ? (
                                <Loader2 className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-spin" />
                              ) : (
                                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                              )}
                              <p className="text-lg font-medium mb-2">
                                {uploadingDocument ? 'Upload en cours...' : 'Télécharger votre pièce d\'identité'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Formats acceptés : JPG, PNG, PDF (max 5MB)
                              </p>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSaving || uploadingDocument}
                    className="min-w-32"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      'Sauvegarder'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsPage;