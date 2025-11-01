// src/pages/EditEquipment.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Upload, X, Image as ImageIcon, CheckCircle, Info } from 'lucide-react';
import { useEquipments } from '@/hooks/useEquipments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { EQUIPMENT_CATEGORIES } from '@/data/categories';
import { useAuth } from '@/hooks/auth';

const BENIN_CITIES = [
  "Cotonou", 
  "Porto-Novo",
  "Parakou",
  "Abomey-Calavi",
  "Ouidah",
  "Natitingou",
  "Bohicon",
  "Kandi",
  "Lokossa",
  "Savalou"
];

const CONDITIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "excellent", label: "Excellent état" },
  { value: "bon", label: "Bon état" },
  { value: "correct", label: "État correct" },
  { value: "usage", label: "Signes d'usage" }
];

interface EquipmentImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

// 🔧 PATCH TEMPORAIRE - Type étendu pour inclure les nouveaux champs
// À retirer après avoir régénéré les types Supabase
interface ExtendedEquipment {
  brand: string | null;
  category: string;
  city: string;
  condition: string | null;
  country: string;
  created_at: string | null;
  daily_price: number;
  deposit_amount: number;
  description: string;
  id: string;
  location: string;
  moderated_at: string | null;
  moderated_by: string | null;
  moderation_feedback: any | null;
  moderation_status: string | null;
  owner_id: string;
  status: string | null;
  subcategory: string | null;
  title: string;
  updated_at: string | null;
  year: number | null;
  // ✅ NOUVEAUX CHAMPS
  has_technical_support?: boolean | null;
  has_training?: boolean | null;
  has_insurance?: boolean | null;
  has_delivery?: boolean | null;
  has_recent_maintenance?: boolean | null;
}

export default function EditEquipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateEquipment } = useEquipments();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  // Images existantes
  const [existingImages, setExistingImages] = useState<EquipmentImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // Nouvelles images à uploader
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // ✅ MODIFICATION: Ajout des champs booléens pour les fonctionnalités
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    daily_price: '',
    deposit_amount: '',
    condition: 'bon',
    brand: '',
    year: '',
    location: '',
    city: 'Cotonou',
    country: 'Bénin',
    // ✅ NOUVEAUX CHAMPS
    has_technical_support: false,
    has_training: false,
    has_insurance: false,
    has_delivery: false,
    has_recent_maintenance: false,
  });

  // Charger l'équipement et ses images
  useEffect(() => {
    const loadEquipment = async () => {
      if (!id || !user?.id) return;

      try {
        setIsLoading(true);
        
        // Charger l'équipement
        const { data: equipment, error: equipmentError } = await supabase
          .from('equipments')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user.id)
          .single() as { data: ExtendedEquipment | null, error: any };

        if (equipmentError) throw equipmentError;

        if (!equipment) {
          toast({
            title: 'Erreur',
            description: 'Équipement non trouvé',
            variant: 'destructive',
          });
          navigate('/my-equipments');
          return;
        }

        // ✅ MODIFICATION: Remplir le formulaire avec les nouveaux champs
        setFormData({
          title: equipment.title || '',
          description: equipment.description || '',
          category: equipment.category || '',
          subcategory: equipment.subcategory || '',
          daily_price: equipment.daily_price?.toString() || '',
          deposit_amount: equipment.deposit_amount?.toString() || '',
          condition: equipment.condition || 'bon',
          brand: equipment.brand || '',
          year: equipment.year?.toString() || '',
          location: equipment.location || '',
          city: equipment.city || 'Cotonou',
          country: equipment.country || 'Bénin',
          // ✅ NOUVEAUX CHAMPS
          has_technical_support: equipment.has_technical_support || false,
          has_training: equipment.has_training || false,
          has_insurance: equipment.has_insurance || false,
          has_delivery: equipment.has_delivery || false,
          has_recent_maintenance: equipment.has_recent_maintenance || false,
        });

        // Charger les images existantes
        const { data: images, error: imagesError } = await supabase
          .from('equipment_images')
          .select('*')
          .eq('equipment_id', id)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true });

        if (imagesError) throw imagesError;

        if (images) {
          setExistingImages(images.map(img => ({
            id: img.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
            created_at: img.created_at
          })));
        }

      } catch (error) {
        console.error('Erreur chargement:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger l\'équipement',
          variant: 'destructive',
        });
        navigate('/my-equipments');
      } finally {
        setIsLoading(false);
      }
    };

    loadEquipment();
  }, [id, user, navigate]);

  // Gérer la sélection de nouvelles images
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Vérifier le nombre total d'images (existantes + nouvelles)
    const totalImages = existingImages.length - imagesToDelete.length + newImageFiles.length + files.length;
    
    if (totalImages > 5) {
      toast({
        title: 'Limite atteinte',
        description: 'Vous pouvez avoir maximum 5 images par équipement',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier la taille des fichiers
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      toast({
        title: 'Fichiers trop volumineux',
        description: 'Chaque image doit faire moins de 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Créer les previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setNewImageFiles(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Supprimer une image existante
  const handleDeleteExistingImage = (imageId: string) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  // Annuler la suppression d'une image existante
  const handleUndoDeleteExistingImage = (imageId: string) => {
    setImagesToDelete(prev => prev.filter(id => id !== imageId));
  };

  // Supprimer une nouvelle image (avant upload)
  const handleDeleteNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Upload des nouvelles images vers Supabase Storage
  const uploadNewImages = async (): Promise<string[]> => {
    if (newImageFiles.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const file of newImageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data } = supabase.storage
        .from('equipment_images')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  // Supprimer les images marquées pour suppression
  const deleteMarkedImages = async () => {
    if (imagesToDelete.length === 0) return;

    // Récupérer les URLs des images à supprimer pour extraire les paths
    const imagesToDeleteData = existingImages.filter(img => imagesToDelete.includes(img.id));
    
    // Extraire les paths du storage depuis les URLs
    const pathsToDelete = imagesToDeleteData.map(img => {
      // L'URL est du format: https://...supabase.co/storage/v1/object/public/equipment_images/path
      const url = new URL(img.image_url);
      const pathParts = url.pathname.split('/equipment_images/');
      return pathParts[1]; // Retourne juste le path après 'equipment_images/'
    }).filter(Boolean);

    // Supprimer du storage d'abord
    if (pathsToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('equipment_images')
        .remove(pathsToDelete);

      if (storageError) {
        console.error('Erreur suppression storage:', storageError);
      }
    }

    // Puis supprimer de la base de données
    const { error: dbError } = await supabase
      .from('equipment_images')
      .delete()
      .in('id', imagesToDelete);

    if (dbError) throw dbError;
  };

  // Créer les entrées pour les nouvelles images
  const createImageRecords = async (uploadedUrls: string[]) => {
    // Déterminer si c'est la première image (is_primary)
    const hasExistingPrimary = existingImages.some(
      img => img.is_primary && !imagesToDelete.includes(img.id)
    );

    const imageRecords = uploadedUrls.map((url, index) => ({
      equipment_id: id,
      image_url: url,
      is_primary: !hasExistingPrimary && index === 0 // La première nouvelle image devient primaire si aucune existante
    }));

    const { error } = await supabase
      .from('equipment_images')
      .insert(imageRecords);

    if (error) throw error;
  };

  // Sauvegarder les modifications
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !user?.id) return;

    // Vérifier qu'il reste au moins une image après suppression
    const remainingImagesCount = existingImages.length - imagesToDelete.length + newImageFiles.length;
    
    if (remainingImagesCount === 0) {
      toast({
        title: 'Images requises',
        description: 'Vous devez avoir au moins une image pour votre équipement',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      setIsUploadingImages(true);

      // 1. Supprimer les images marquées
      await deleteMarkedImages();

      // 2. Upload des nouvelles images
      const uploadedUrls = await uploadNewImages();

      // 3. Créer les entrées pour les nouvelles images
      if (uploadedUrls.length > 0) {
        await createImageRecords(uploadedUrls);
      }

      setIsUploadingImages(false);

      // ✅ MODIFICATION: 4. Mise à jour de l'équipement avec les nouveaux champs
      const { error } = await supabase
        .from('equipments')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          subcategory: formData.subcategory || null,
          daily_price: parseFloat(formData.daily_price),
          deposit_amount: parseFloat(formData.deposit_amount) || 0,
          condition: formData.condition,
          brand: formData.brand.trim() || null,
          year: formData.year ? parseInt(formData.year) : null,
          location: formData.location.trim(),
          city: formData.city,
          country: formData.country,
          
          // ✅ NOUVEAUX CHAMPS FONCTIONNALITÉS
          has_technical_support: formData.has_technical_support,
          has_training: formData.has_training,
          has_insurance: formData.has_insurance,
          has_delivery: formData.has_delivery,
          has_recent_maintenance: formData.has_recent_maintenance,
          
          // Renvoyer en modération
          moderation_status: 'pending',
          status: 'en_attente',
          rejected_at: null,
          rejection_reason: null,
          approved_at: null,
          published_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast({
        title: '✅ Modifications enregistrées',
        description: 'Votre équipement a été renvoyé en modération',
      });

      navigate('/my-equipments');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsUploadingImages(false);
    }
  };

  // Cleanup des previews
  useEffect(() => {
    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const totalImagesAfterChanges = existingImages.length - imagesToDelete.length + newImageFiles.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-equipments')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Modifier l'équipement</h1>
          <p className="text-gray-600 mt-2">
            Après modification, votre équipement sera renvoyé en modération
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images de l'équipement</CardTitle>
              <p className="text-sm text-gray-600">
                {totalImagesAfterChanges}/5 images • Au moins 1 image requise
              </p>
            </CardHeader>
            <CardContent>
              {/* Images existantes */}
              {existingImages.length > 0 && (
                <div className="mb-6">
                  <Label className="mb-3 block">Images actuelles</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((image) => (
                      <div
                        key={image.id}
                        className={`relative group ${
                          imagesToDelete.includes(image.id) ? 'opacity-50' : ''
                        }`}
                      >
                        <img
                          src={image.image_url}
                          alt="Equipment"
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                        />
                        
                        {imagesToDelete.includes(image.id) ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUndoDeleteExistingImage(image.id)}
                            className="absolute top-2 right-2"
                          >
                            Annuler
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteExistingImage(image.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {image.is_primary && !imagesToDelete.includes(image.id) && (
                          <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            Photo principale
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouvelles images à uploader */}
              {newImageFiles.length > 0 && (
                <div className="mb-6">
                  <Label className="mb-3 block">Nouvelles images à ajouter</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-500"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteNewImage(index)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Nouvelle
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton d'ajout d'images */}
              {totalImagesAfterChanges < 5 && (
                <div>
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-gray-600">
                      Ajouter des images ({5 - totalImagesAfterChanges} restantes)
                    </span>
                  </Label>
                  <p className="text-xs text-gray-500 mt-2">
                    Formats acceptés: JPG, PNG, WEBP • Max 5MB par image
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'équipement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Titre */}
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Catégorie */}
              <div>
                <Label>Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EQUIPMENT_CATEGORIES).map(([key, cat]) => (
                      <SelectItem key={key} value={key}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prix et caution */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daily_price">Prix/jour (FCFA) *</Label>
                  <Input
                    id="daily_price"
                    type="number"
                    value={formData.daily_price}
                    onChange={(e) => setFormData({ ...formData, daily_price: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label htmlFor="deposit_amount">Caution (FCFA)</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* État */}
              <div>
                <Label>État *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Marque et année */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Marque</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Année</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Localisation */}
              <div>
                <Label htmlFor="location">Adresse *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Ville */}
              <div>
                <Label>Ville *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BENIN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ========== ✅ NOUVELLE SECTION: FONCTIONNALITÉS ========== */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Ce que propose cet équipement
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Cochez les services et avantages inclus avec votre équipement
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Support technique */}
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="has_technical_support"
                  checked={formData.has_technical_support}
                  onChange={(e) => setFormData({ ...formData, has_technical_support: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  disabled={isSaving}
                />
                <Label htmlFor="has_technical_support" className="text-sm font-normal cursor-pointer flex-1">
                  Support technique disponible
                </Label>
              </div>

              {/* Formation incluse */}
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="has_training"
                  checked={formData.has_training}
                  onChange={(e) => setFormData({ ...formData, has_training: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  disabled={isSaving}
                />
                <Label htmlFor="has_training" className="text-sm font-normal cursor-pointer flex-1">
                  Formation incluse pour l'utilisation
                </Label>
              </div>

              {/* Assurance incluse */}
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="has_insurance"
                  checked={formData.has_insurance}
                  onChange={(e) => setFormData({ ...formData, has_insurance: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  disabled={isSaving}
                />
                <Label htmlFor="has_insurance" className="text-sm font-normal cursor-pointer flex-1">
                  Assurance incluse dans le prix
                </Label>
              </div>

              {/* Livraison possible */}
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="has_delivery"
                  checked={formData.has_delivery}
                  onChange={(e) => setFormData({ ...formData, has_delivery: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  disabled={isSaving}
                />
                <Label htmlFor="has_delivery" className="text-sm font-normal cursor-pointer flex-1">
                  Livraison possible (peut être payante)
                </Label>
              </div>

              {/* Maintenance récente */}
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="has_recent_maintenance"
                  checked={formData.has_recent_maintenance}
                  onChange={(e) => setFormData({ ...formData, has_recent_maintenance: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  disabled={isSaving}
                />
                <Label htmlFor="has_recent_maintenance" className="text-sm font-normal cursor-pointer flex-1">
                  Maintenance récente effectuée
                </Label>
              </div>

              {/* Info supplémentaire */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Ces informations seront affichées sur votre annonce. Cochez uniquement les options réellement disponibles pour vos locataires.
                  </span>
                </p>
              </div>

            </CardContent>
          </Card>
          {/* ========== FIN NOUVELLE SECTION ========== */}

          {/* Boutons */}
          <div className="flex gap-4 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/my-equipments')}
              disabled={isSaving}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSaving || totalImagesAfterChanges === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploadingImages ? 'Upload images...' : 'Enregistrement...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer et renvoyer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}