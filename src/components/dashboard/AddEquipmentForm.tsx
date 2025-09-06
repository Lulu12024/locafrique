import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { 
  Upload, 
  Plus, 
  X, 
  Camera, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  MapPin,
  Euro,
  Calendar,
  Package,
  Info
} from "lucide-react";
import { useEquipments } from "@/hooks/useEquipments";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "@/components/ui/use-toast";
import { EQUIPMENT_CATEGORIES, getCategoryOptions, getSubcategoryOptions } from "@/data/categories";

interface AddEquipmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormState {
  title: string;
  description: string;
  daily_price: string;
  deposit_amount: string;
  category: string;
  subcategory: string;
  brand: string;
  year: string;
  condition: string;
  location: string;
  city: string;
  country: string;
}

const defaultFormState: FormState = {
  title: "",
  description: "",
  daily_price: "",
  deposit_amount: "",
  category: "",
  subcategory: "",
  brand: "",
  year: "",
  condition: "bon",
  location: "",
  city: "Cotonou",
  country: "Bénin",
};

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

const FixedAddEquipmentForm: React.FC<AddEquipmentFormProps> = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { addEquipment, isLoading } = useEquipments();
  const { uploadImage } = useStorage();
  
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation en temps réel
  useEffect(() => {
    const errors: Record<string, string> = {};

    if (formData.title && formData.title.length < 3) {
      errors.title = "Le titre doit contenir au moins 3 caractères";
    }
    if (formData.title && formData.title.length > 100) {
      errors.title = "Le titre ne peut pas dépasser 100 caractères";
    }

    if (formData.description && formData.description.length < 10) {
      errors.description = "La description doit contenir au moins 10 caractères";
    }

    if (formData.daily_price && (isNaN(Number(formData.daily_price)) || Number(formData.daily_price) <= 0)) {
      errors.daily_price = "Le prix doit être un nombre positif";
    }

    if (formData.deposit_amount && (isNaN(Number(formData.deposit_amount)) || Number(formData.deposit_amount) < 0)) {
      errors.deposit_amount = "La caution ne peut pas être négative";
    }

    if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1)) {
      errors.year = "L'année doit être comprise entre 1900 et l'année prochaine";
    }

    setValidationErrors(errors);
  }, [formData]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Réinitialiser la sous-catégorie si la catégorie change
    if (field === 'category') {
      setFormData(prev => ({
        ...prev,
        subcategory: ""
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Vérifier le nombre total d'images
    const totalImages = images.length + files.length;
    if (totalImages > 6) {
      toast({
        title: "Trop d'images",
        description: "Vous ne pouvez ajouter que 6 images maximum.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la taille des fichiers
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Fichiers trop volumineux",
        description: `${oversizedFiles.length} fichier(s) dépasse(nt) 5MB.`,
        variant: "destructive",
      });
      return;
    }

    // Vérifier le type des fichiers
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast({
        title: "Format non supporté",
        description: "Seuls les formats JPG, PNG et WebP sont acceptés.",
        variant: "destructive",
      });
      return;
    }

    // Ajouter les nouvelles images
    setImages(prev => [...prev, ...files]);

    // Créer les aperçus
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Réinitialiser l'input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const requiredFields = ['title', 'description', 'daily_price', 'category'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof FormState].trim());

    if (missingFields.length > 0) {
      toast({
        title: "Champs obligatoires manquants",
        description: `Veuillez remplir: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    if (images.length < 3) {
      toast({
        title: "Images insuffisantes",
        description: "Vous devez ajouter au moins 3 images de votre équipement.",
        variant: "destructive",
      });
      return false;
    }

    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs dans le formulaire.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      console.log("📝 Début de la soumission du formulaire");

      // Préparer les données de l'équipement
      const equipmentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        daily_price: Number(formData.daily_price),
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : 0,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        brand: formData.brand.trim() || undefined,
        year: formData.year ? Number(formData.year) : undefined,
        condition: formData.condition,
        location: formData.location.trim(),
        city: formData.city,
        country: formData.country
      };

      console.log("📦 Données de l'équipement:", equipmentData);

      // Étape 1: Créer l'équipement
      // NOUVELLE INTERFACE : addEquipment retourne directement EquipmentData ou lance une exception
      const createdEquipment = await addEquipment(equipmentData);
      
      console.log("✅ Équipement créé avec succès:", createdEquipment.id);
      setUploadProgress(25);

      // Étape 2: Upload des images
      if (images.length > 0) {
        console.log("📸 Début de l'upload des images...");
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const isPrimary = i === 0; // Première image = image principale
          
          try {
            console.log(`📸 Upload image ${i + 1}/${images.length}: ${file.name}`);
            
            const uploadResult = await uploadImage(file, createdEquipment.id, isPrimary);
            
            if (uploadResult.success) {
              console.log(`✅ Image ${file.name} uploadée avec succès`);
            } else {
              console.warn(`⚠️ Échec upload ${file.name}:`, uploadResult.error);
            }
            
            // Mise à jour de la progress bar
            const progress = 25 + ((i + 1) / images.length) * 75;
            setUploadProgress(progress);
            
          } catch (imageError) {
            console.error(`❌ Erreur upload ${file.name}:`, imageError);
          }
        }
        
        console.log("✅ Upload des images terminé");
      }

      setUploadProgress(100);

      // Toast de succès final (déjà affiché par useEquipments, mais on peut ajouter des détails)
      toast({
        title: "🎉 Publication réussie !",
        description: (
          <div className="space-y-1">
            <p className="font-medium">"{formData.title}"</p>
            <p className="text-sm">
              Catégorie: {EQUIPMENT_CATEGORIES[formData.category]?.name}
            </p>
            <p className="text-sm">
              {images.length} image(s) ajoutée(s)
            </p>
          </div>
        ),
      });

      // Réinitialiser le formulaire
      setFormData(defaultFormState);
      setImages([]);
      setImagePreviews([]);
      setUploadProgress(0);

      // Callback de succès
      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger vers la liste des équipements
        setTimeout(() => {
          navigate('/my-equipments');
        }, 2000);
      }

    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error);
      
      // L'erreur a déjà été gérée et affichée par useEquipments
      // On peut ajouter un toast additionnel si nécessaire
      if (error instanceof Error) {
        console.log("Erreur capturée:", error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const subcategoryOptions = formData.category ? getSubcategoryOptions(formData.category) : [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Ajouter un nouvel équipement
        </h1>
        <p className="text-gray-600">
          Remplissez le formulaire ci-dessous pour mettre votre équipement en location
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informations principales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Titre de l'annonce *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Pelleteuse hydraulique Caterpillar 320"
                className={validationErrors.title ? 'border-red-500' : ''}
              />
              {validationErrors.title && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.title}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.title.length}/100 caractères
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description détaillée *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Décrivez votre équipement, son état, ses caractéristiques..."
                rows={4}
                className={validationErrors.description ? 'border-red-500' : ''}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.description}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.description.length}/1000 caractères
              </p>
            </div>

            {/* Catégorie et sous-catégorie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Catégorie *
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoryOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-sm font-medium">
                  Sous-catégorie
                </Label>
                <Select 
                  value={formData.subcategory} 
                  onValueChange={(value) => handleInputChange('subcategory', value)}
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une sous-catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Tarification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="daily_price" className="text-sm font-medium">
                  Prix par jour (FCFA) *
                </Label>
                <Input
                  id="daily_price"
                  type="number"
                  value={formData.daily_price}
                  onChange={(e) => handleInputChange('daily_price', e.target.value)}
                  placeholder="Ex: 45000"
                  min="1"
                  className={validationErrors.daily_price ? 'border-red-500' : ''}
                />
                {validationErrors.daily_price && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.daily_price}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_amount" className="text-sm font-medium">
                  Caution (FCFA)
                </Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => handleInputChange('deposit_amount', e.target.value)}
                  placeholder="Ex: 150000"
                  min="0"
                  className={validationErrors.deposit_amount ? 'border-red-500' : ''}
                />
                {validationErrors.deposit_amount && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.deposit_amount}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Montant remboursable après retour de l'équipement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Détails de l'équipement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Détails de l'équipement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-sm font-medium">
                  Marque
                </Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="Ex: Caterpillar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm font-medium">
                  Année
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="Ex: 2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={validationErrors.year ? 'border-red-500' : ''}
                />
                {validationErrors.year && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.year}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition" className="text-sm font-medium">
                  État
                </Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  Ville
                </Label>
                <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
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

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Adresse précise
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ex: Quartier Cadjehoun, près du marché"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos de l'équipement (3-6 images)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zone d'upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Cliquez pour ajouter des photos
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG ou WebP - Maximum 5MB par image
                </p>
              </label>
            </div>

            {/* Aperçu des images */}
            {imagePreviews.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Images sélectionnées ({imagePreviews.length}/6)</h4>
                  {imagePreviews.length >= 3 && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Minimum atteint
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Aperçu ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2 bg-blue-600">
                          Image principale
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indication du statut */}
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-1 ${
                images.length >= 3 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {images.length >= 3 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {images.length >= 3 
                  ? `${images.length} image(s) - Prêt !` 
                  : `${images.length} image(s) - Minimum 3 requis`
                }
              </span>
              <span className="text-gray-500">
                Maximum: 6 images
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
          )}
          
          <Button 
            type="submit" 
            disabled={isSubmitting || isLoading || images.length < 3}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Publier l'annonce
              </>
            )}
          </Button>
        </div>

        {/* Progress bar pendant l'upload */}
        {isSubmitting && uploadProgress > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  {uploadProgress < 25 ? "Création de l'équipement..." :
                   uploadProgress < 100 ? "Upload des images..." :
                   "Finalisation..."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};

export default FixedAddEquipmentForm;