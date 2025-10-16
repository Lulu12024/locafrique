// src/components/AddEquipmentModal.tsx - Version avec upload d'images

import React, { useState ,useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Upload, X, Camera, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useEquipments } from "@/hooks/useEquipments";
import { useStorage } from "@/hooks/useStorage";
import { EQUIPMENT_CATEGORIES } from "@/data/categories";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}


const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ isOpen, onClose }) => {
  const { addEquipment, isLoading } = useEquipments();
  const { uploadImage } = useStorage();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    daily_price: "",
    deposit_amount: "",
    location: "",
    city: "Cotonou",
    country: "Bénin",
    condition: "bon",
    brand: "",
    year: ""
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, icon')
        .order('order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive"
      });
    }
  };

  if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);
  // Gestion de la sélection d'images
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Vérifier le nombre maximum d'images
      if (selectedImages.length + files.length > 6) {
        toast({
          title: "Trop d'images",
          description: "Vous pouvez ajouter un maximum de 6 images.",
          variant: "destructive"
        });
        return;
      }

      // Vérifier la taille et le type des fichiers
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse 5MB.`,
            variant: "destructive"
          });
          return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Format non supporté",
            description: `${file.name} n'est pas au format JPG, PNG ou WebP.`,
            variant: "destructive"
          });
          return false;
        }
        
        return true;
      });

      if (validFiles.length > 0) {
        // Ajouter les nouveaux fichiers
        setSelectedImages(prev => [...prev, ...validFiles]);

        // Créer les aperçus
        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreviews(prev => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        });
      }

      // Réinitialiser l'input
      e.target.value = '';
    }
  };

  // Supprimer une image
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation simple
    if (!formData.title || !formData.description || !formData.category || !formData.daily_price) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires (*)",
        variant: "destructive"
      });
      return;
    }

    if (Number(formData.daily_price) <= 0) {
      toast({
        title: "Erreur",
        description: "Le prix journalier doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    if (selectedImages.length < 1) {
      toast({
        title: "Images requises",
        description: "Veuillez ajouter au moins 1 image de votre équipement.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Préparer les données pour l'API
      const equipmentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        daily_price: Number(formData.daily_price),
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : 0,
        category: formData.category,
        location: formData.location.trim(),
        city: formData.city,
        country: formData.country,
        condition: formData.condition,
        brand: formData.brand.trim() || undefined,
        year: formData.year ? Number(formData.year) : undefined
      };

      console.log("📝 Ajout d'équipement via modal:", equipmentData);

      // Étape 1: Créer l'équipement
      const createdEquipment = await addEquipment(equipmentData);
      console.log("✅ Équipement créé:", createdEquipment.id);
      
      setUploadProgress(20);

      // Étape 2: Upload des images
      if (selectedImages.length > 0) {
        console.log("📸 Début de l'upload des images...");
        
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          const isPrimary = i === 0; // Première image = image principale
          
          try {
            console.log(`📸 Upload image ${i + 1}/${selectedImages.length}: ${file.name}`);
            
            const uploadResult = await uploadImage(file, createdEquipment.id, isPrimary);
            
            if (uploadResult.success) {
              console.log(`✅ Image ${file.name} uploadée avec succès`);
            } else {
              console.warn(`⚠️ Échec upload ${file.name}:`, uploadResult.error);
            }
            
            // Mise à jour de la progress bar
            const progress = 20 + ((i + 1) / selectedImages.length) * 80;
            setUploadProgress(progress);
            
          } catch (imageError) {
            console.error(`❌ Erreur upload ${file.name}:`, imageError);
          }
        }
        
        console.log("✅ Upload des images terminé");
      }

      setUploadProgress(100);

      // Toast de succès
      toast({
        title: "🎉 Équipement ajouté avec succès !",
        description: `"${formData.title}" avec ${selectedImages.length} image(s)`,
        duration: 5000,
      });

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        description: "",
        category: "",
        daily_price: "",
        deposit_amount: "",
        location: "",
        city: "Cotonou",
        country: "Bénin",
        condition: "bon",
        brand: "",
        year: ""
      });
      
      setSelectedImages([]);
      setImagePreviews([]);
      setUploadProgress(0);
      
      // Fermer le modal
      onClose();

    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de l'équipement:", error);
      
      // Gestion spéciale de l'erreur 403
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message;
        if (errorMessage.includes('403') || errorMessage.includes('not allowed') || errorMessage.includes('permission')) {
          toast({
            title: "Erreur de permissions (403)",
            description: "Vous n'avez pas les droits pour créer un équipement. Vérifiez votre profil ou contactez l'administrateur.",
            variant: "destructive"
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // const categoryOptions = Object.entries(EQUIPMENT_CATEGORIES).map(([key, category]) => ({
  //   value: key,
  //   label: category.name
  // }));
  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span>Ajouter un équipement</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress bar pendant la soumission */}
          {isSubmitting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Création en cours...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'équipement *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Ex: Perceuse sans fil Bosch"
                disabled={isLoading || isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Décrivez votre équipement, son état, ses caractéristiques..."
                rows={3}
                disabled={isLoading || isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange("category", value)}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="condition">État</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => handleInputChange("condition", value)}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neuf">Neuf</SelectItem>
                    <SelectItem value="excellent">Excellent état</SelectItem>
                    <SelectItem value="bon">Bon état</SelectItem>
                    <SelectItem value="correct">État correct</SelectItem>
                    <SelectItem value="usage">Signes d'usage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  placeholder="Ex: Bosch, Makita..."
                  disabled={isLoading || isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="year">Année</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  placeholder="2020"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Prix */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily_price">Prix journalier (FCFA) *</Label>
                <Input
                  id="daily_price"
                  type="number"
                  value={formData.daily_price}
                  onChange={(e) => handleInputChange("daily_price", e.target.value)}
                  placeholder="5000"
                  min="1"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="deposit_amount">Caution (FCFA)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => handleInputChange("deposit_amount", e.target.value)}
                  placeholder="10000"
                  min="0"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <div>
              <Label>Photos de l'équipement *</Label>
              <p className="text-sm text-gray-600 mb-3">
                Ajoutez des photos attrayantes de votre équipement (minimum 1, maximum 6)
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelection}
                  className="hidden"
                  id="image-upload"
                  disabled={isLoading || isSubmitting || selectedImages.length >= 6}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Cliquez pour ajouter des photos ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WebP - Max 5MB par fichier
                  </p>
                </label>
              </div>

              {/* Aperçu des images sélectionnées */}
              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Images sélectionnées ({selectedImages.length}/6)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Aperçu ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-green-500 text-white px-2 py-0.5 rounded text-xs">
                            Principal
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Adresse</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Quartier, rue..."
                disabled={isLoading || isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(value) => handleInputChange("city", value)}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cotonou">Cotonou</SelectItem>
                    <SelectItem value="Porto-Novo">Porto-Novo</SelectItem>
                    <SelectItem value="Parakou">Parakou</SelectItem>
                    <SelectItem value="Abomey-Calavi">Abomey-Calavi</SelectItem>
                    <SelectItem value="Ouidah">Ouidah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="Bénin"
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Note sur l'erreur 403 */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-orange-900 text-base mb-2">
                  ⚠️ Avertissement Important
                </p>
                <p className="text-orange-800 font-medium leading-relaxed">
                  En publiant une annonce, vous reconnaissez être seul responsable de vos transactions et de la remise du bien.
                </p>
                
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading || isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter l'équipement
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentModal;