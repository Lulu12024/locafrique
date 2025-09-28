// src/pages/ProfileSettingsPage.tsx - VERSION CORRIGÉE
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
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, fetchUserProfile } = useAuth(); // ✅ Ajout de fetchUserProfile
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [verificationStatusDetailed, setVerificationStatusDetailed] = useState<{
    status: 'none' | 'pending' | 'approved' | 'rejected';
    reason?: string;
  }>({ status: 'none' });


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
        identity: verificationStatusDetailed.status === 'approved', // Seulement vert si approuvé
        email: !!user?.email,
        phone: !!profile.phone_number,
        address: !!(profile.address && profile.city)
      });
    }
  }, [profile, user, verificationStatusDetailed]);


  useEffect(() => {
    // Forcer le chargement du profil si pas encore chargé
    if (user && !profile && fetchUserProfile) {
      console.log("🔄 Forçage du chargement du profil pour:", user.email);
      fetchUserProfile(user);
    }
  }, [user, profile, fetchUserProfile]);

  // Debug : voir ce qui se passe
  useEffect(() => {
      console.log("📊 État actuel:");
      console.log("- user:", user?.email);
      console.log("- profile:", profile);
      console.log("- formData:", formData);
    }, [user, profile, formData]);

    useEffect(() => {
    loadVerificationStatus();
  }, [user]);

  const loadVerificationStatus = async () => {
    if (!user?.id) return;
    
    try {
      // Charger le statut de vérification depuis la DB
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('verification_status, rejection_reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erreur chargement vérification:', error);
        return;
      }
      
      if (data) {
        setVerificationStatusDetailed({
          status: data.verification_status as 'pending' | 'approved' | 'rejected',
          reason: data.rejection_reason || undefined
        });
        setVerificationSubmitted(true);
      } else {
        setVerificationStatusDetailed({ status: 'none' });
        setVerificationSubmitted(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: "Le fichier ne doit pas dépasser 5MB.",
        variant: "destructive"
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Formats acceptés : JPG, PNG, PDF",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Créer une preview pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🚀 SOLUTION : Sauvegarde unifiée en une seule transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // ✅ UNE SEULE REQUÊTE pour tout sauvegarder
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone_number: formData.phone_number.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          country: formData.country.trim() || null,
          id_number: formData.id_number.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        throw error;
      }

      // ✅ Recharger le profil pour s'assurer que les données sont à jour
      if (fetchUserProfile) {
        await fetchUserProfile(user);
      }

      toast({
        title: "✅ Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });

    } catch (error: any) {
      console.error('❌ Erreur:', error);
      toast({
        title: "❌ Erreur de sauvegarde",
        description: error.message || "Impossible de sauvegarder vos informations.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 AMÉLIORATION : Upload de document avec validation renforcée
  const handleDocumentUpload = async (file: File) => {
    if (!user?.id) return;

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: "Le fichier ne doit pas dépasser 5MB.",
        variant: "destructive"
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format non supporté", 
        description: "Formats acceptés : JPG, PNG, PDF",
        variant: "destructive"
      });
      return;
    }

    setUploadingDocument(true);

    try {
      // 1. Upload vers Supabase Storage avec chemin organisé
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/identity-${Date.now()}.${fileExt}`;
      
      console.log("📤 Upload du fichier:", fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("❌ Erreur upload:", uploadError);
        throw uploadError;
      }

      console.log("✅ Fichier uploadé:", uploadData);

      // 2. Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      console.log("🔗 URL générée:", urlData.publicUrl);

      // 3. Créer l'entrée de vérification
      const { data: verificationData, error: dbError } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: user.id,
          document_type: 'identity_card',
          document_url: urlData.publicUrl,
          verification_status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error("❌ Erreur DB:", dbError);
        throw dbError;
      }

      console.log("📋 Vérification créée:", verificationData);

      // 4. Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          id_document_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error("❌ Erreur profil:", profileError);
        throw profileError;
      }

      // 5. Recharger le profil
      if (fetchUserProfile) {
        await fetchUserProfile(user);
      }

      toast({
        title: "📄 Document envoyé",
        description: "Votre document d'identité a été envoyé pour vérification. Vous recevrez une notification une fois vérifié.",
      });

      setVerificationStatus(prev => ({ ...prev, identity: true }));

    } catch (error: any) {
      console.error("❌ Erreur complète:", error);
      toast({
        title: "❌ Erreur d'upload",
        description: error.message || "Impossible d'envoyer le document. Vérifiez que le bucket 'documents' existe.",
        variant: "destructive"
      });
    } finally {
      setUploadingDocument(false);
    }
  };


  const handleSubmitVerification = async () => {
    if (!user?.id || !selectedFile) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un fichier et saisir le numéro de pièce d'identité.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.id_number.trim()) {
      toast({
        title: "Numéro requis",
        description: "Veuillez saisir le numéro de votre pièce d'identité.",
        variant: "destructive"
      });
      return;
    }

    setUploadingDocument(true);

    try {
      // 1. Upload du fichier
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/identity-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // 3. Créer l'entrée de vérification
      const { error: dbError } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: user.id,
          document_type: 'identity_card',
          document_url: urlData.publicUrl,
          document_number: formData.id_number.trim(),
          verification_status: 'pending',
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      // 4. Mettre à jour le profil avec l'URL du document
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          id_document_url: urlData.publicUrl,
          id_number: formData.id_number.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 5. Mettre à jour l'état local
      setVerificationStatusDetailed({ status: 'pending' });
      setVerificationSubmitted(true);
      setSelectedFile(null);
      setPreviewUrl(null);

      toast({
        title: "Document soumis",
        description: "Votre document a été envoyé pour vérification. Vous recevrez une notification une fois traité.",
      });

      // Recharger le profil
      if (fetchUserProfile) {
        await fetchUserProfile(user);
      }

    } catch (error: any) {
      console.error("Erreur soumission:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le document.",
        variant: "destructive"
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleResetVerification = () => {
    setVerificationStatusDetailed({ status: 'none' });
    setVerificationSubmitted(false);
    setSelectedFile(null);
    setPreviewUrl(null);
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
                    disabled={verificationSubmitted && verificationStatusDetailed.status !== 'rejected'}
                  />
                </div>

                <div>
                  <Label>Document d'identité</Label>
                  <div className="mt-2">
                    {verificationSubmitted ? (
                      // ÉTAT APRÈS SOUMISSION
                      <div>
                        {verificationStatusDetailed.status === 'pending' && (
                          <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Clock className="h-6 w-6 text-orange-600" />
                              <div>
                                <p className="font-medium text-orange-800">Document en cours de vérification</p>
                                <p className="text-sm text-orange-600">
                                  Notre équipe examine votre document. Cela peut prendre 24-48h.
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700">
                              En attente
                            </Badge>
                          </div>
                        )}

                        {verificationStatusDetailed.status === 'approved' && (
                          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">Document vérifié</p>
                                <p className="text-sm text-green-600">
                                  Votre identité a été confirmée par notre équipe.
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700">
                              Vérifié
                            </Badge>
                          </div>
                        )}

                        {verificationStatusDetailed.status === 'rejected' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <XCircle className="h-6 w-6 text-red-600" />
                                <div>
                                  <p className="font-medium text-red-800">Document rejeté</p>
                                  <p className="text-sm text-red-600">
                                    {verificationStatusDetailed.reason || "Votre document n'a pas pu être vérifié."}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-red-100 text-red-700">
                                Rejeté
                              </Badge>
                            </div>
                            
                            <Button 
                              onClick={handleResetVerification}
                              variant="outline"
                              className="w-full"
                            >
                              Soumettre un nouveau document
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // ÉTAT AVANT SOUMISSION
                      <div className="space-y-4">
                        {/* Sélection de fichier */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            id="document-upload"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={handleFileSelect}
                          />
                          <label htmlFor="document-upload" className="cursor-pointer">
                            {selectedFile ? (
                              <div className="space-y-2">
                                <FileText className="h-8 w-8 mx-auto text-green-500" />
                                <p className="text-sm font-medium text-green-700">
                                  Fichier sélectionné: {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Cliquez pour changer de fichier
                                </p>
                              </div>
                            ) : (
                              <div>
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                  Cliquer pour sélectionner votre pièce d'identité
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  JPG, PNG, PDF (max 5MB)
                                </p>
                              </div>
                            )}
                          </label>
                        </div>

                        {/* Preview si image */}
                        {previewUrl && (
                          <div className="mt-4">
                            <img 
                              src={previewUrl} 
                              alt="Aperçu du document" 
                              className="max-h-40 mx-auto rounded border"
                            />
                          </div>
                        )}

                        {/* Bouton de soumission */}
                        <Button 
                          onClick={handleSubmitVerification}
                          disabled={!selectedFile || !formData.id_number.trim() || uploadingDocument}
                          className="w-full"
                        >
                          {uploadingDocument ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Soumettre pour vérification
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-gray-500 text-center">
                          Une fois soumis, votre document sera examiné par notre équipe sous 24-48h
                        </p>
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
        // VERSION DESKTOP - même structure mais avec les corrections
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
                        disabled={verificationSubmitted && verificationStatusDetailed.status !== 'rejected'}
                      />
                    </div>

                    <div>
                      <Label>Document d'identité</Label>
                      <div className="mt-2">
                        {verificationSubmitted ? (
                          // ÉTAT APRÈS SOUMISSION
                          <div>
                            {verificationStatusDetailed.status === 'pending' && (
                              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Clock className="h-6 w-6 text-orange-600" />
                                  <div>
                                    <p className="font-medium text-orange-800">Document en cours de vérification</p>
                                    <p className="text-sm text-orange-600">
                                      Notre équipe examine votre document. Cela peut prendre 24-48h.
                                    </p>
                                  </div>
                                </div>
                                <Badge className="bg-orange-100 text-orange-700">
                                  En attente
                                </Badge>
                              </div>
                            )}

                            {verificationStatusDetailed.status === 'approved' && (
                              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                  <div>
                                    <p className="font-medium text-green-800">Document vérifié</p>
                                    <p className="text-sm text-green-600">
                                      Votre identité a été confirmée par notre équipe.
                                    </p>
                                  </div>
                                </div>
                                <Badge className="bg-green-100 text-green-700">
                                  Vérifié
                                </Badge>
                              </div>
                            )}

                            {verificationStatusDetailed.status === 'rejected' && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                    <div>
                                      <p className="font-medium text-red-800">Document rejeté</p>
                                      <p className="text-sm text-red-600">
                                        {verificationStatusDetailed.reason || "Votre document n'a pas pu être vérifié."}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-red-100 text-red-700">
                                    Rejeté
                                  </Badge>
                                </div>
                                
                                <Button 
                                  onClick={handleResetVerification}
                                  variant="outline"
                                  className="w-full"
                                >
                                  Soumettre un nouveau document
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          // ÉTAT AVANT SOUMISSION
                          <div className="space-y-4">
                            {/* Sélection de fichier */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <input
                                type="file"
                                id="document-upload"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={handleFileSelect}
                              />
                              <label htmlFor="document-upload" className="cursor-pointer">
                                {selectedFile ? (
                                  <div className="space-y-2">
                                    <FileText className="h-8 w-8 mx-auto text-green-500" />
                                    <p className="text-sm font-medium text-green-700">
                                      Fichier sélectionné: {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Cliquez pour changer de fichier
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">
                                      Cliquer pour sélectionner votre pièce d'identité
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      JPG, PNG, PDF (max 5MB)
                                    </p>
                                  </div>
                                )}
                              </label>
                            </div>

                            {/* Preview si image */}
                            {previewUrl && (
                              <div className="mt-4">
                                <img 
                                  src={previewUrl} 
                                  alt="Aperçu du document" 
                                  className="max-h-40 mx-auto rounded border"
                                />
                              </div>
                            )}

                            {/* Bouton de soumission */}
                            <Button 
                              onClick={handleSubmitVerification}
                              disabled={!selectedFile || !formData.id_number.trim() || uploadingDocument}
                              className="w-full"
                            >
                              {uploadingDocument ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Envoi en cours...
                                </>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Soumettre pour vérification
                                </>
                              )}
                            </Button>

                            <p className="text-xs text-gray-500 text-center">
                              Une fois soumis, votre document sera examiné par notre équipe sous 24-48h
                            </p>
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