
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useEquipments } from "@/hooks/useEquipments";
import { useStorage } from "@/hooks/useStorage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/hooks/useCategories";
import { UploadCloud } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { EQUIPMENT_CATEGORIES, CategoryKey } from "@/data/categories";
import ImageUploader from "@/components/dashboard/equipment/ImageUploader";

interface AddEquipmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormState {
  title: string;
  description: string;
  daily_price: number | "";
  deposit_amount: number | "";
  category: string;
  subcategory: string;
  brand: string;
  year: number | "";
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
  condition: "neuf",
  location: "",
  city: "Cotonou",
  country: "Bénin",
};

// Liste des villes du Bénin
const BENIN_CITIES = [
  "Abomey-Calavi",
  "Cotonou", 
  "Ouidah",
  "Porto-Novo",
  "Natitingou",
  "Parakou"
];

const AddEquipmentForm: React.FC<AddEquipmentFormProps> = ({ onSuccess, onCancel }) => {
  const { addEquipment } = useEquipments();
  const { uploadImage } = useStorage();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (files: File[]) => {
    setImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des images (minimum 3, maximum 6)
    if (images.length < 3) {
      toast({
        title: "Images insuffisantes",
        description: "Vous devez ajouter au moins 3 images de votre équipement.",
        variant: "destructive",
      });
      return;
    }

    if (images.length > 6) {
      toast({
        title: "Trop d'images",
        description: "Vous ne pouvez pas ajouter plus de 6 images.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("📦 Préparation des données pour l'ajout...");
      
      // Convertir les montants en valeurs numériques et inclure tous les champs requis
      const equipmentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        daily_price: typeof formData.daily_price === 'string' ? parseFloat(formData.daily_price) : formData.daily_price,
        deposit_amount: typeof formData.deposit_amount === 'string' ? parseFloat(formData.deposit_amount) : formData.deposit_amount,
        category: formData.category,
        subcategory: formData.subcategory || null,
        brand: formData.brand || null,
        year: typeof formData.year === 'string' ? (formData.year ? parseInt(formData.year) : null) : formData.year,
        condition: formData.condition,
        location: formData.location.trim(),
        city: formData.city,
        country: formData.country,
        status: "disponible" as const
      };
      
      console.log("📦 Données de l'équipement préparées:", equipmentData);
      
      const result = await addEquipment(equipmentData);
      
      console.log("📦 Résultat de l'ajout:", result);
      
      if (result.success && result.data) {
        console.log("✅ Équipement ajouté avec succès!");
        
        // Upload images with first image as primary
        if (images.length > 0) {
          console.log("📸 Upload des images...");
          try {
            for (let i = 0; i < images.length; i++) {
              const file = images[i];
              console.log(`📸 Upload de l'image ${i + 1}/${images.length}:`, file.name);
              
              const uploadResult = await uploadImage(file, result.data.id, i === 0); // Première image = primaire
              
              if (!uploadResult.success) {
                console.warn(`⚠️ Échec de l'upload de l'image ${file.name}:`, uploadResult.error);
              } else {
                console.log(`✅ Image ${file.name} uploadée avec succès`);
              }
              
              // Update progress
              setUploadProgress(((i + 1) / images.length) * 100);
            }
            console.log("✅ Toutes les images ont été traitées");
          } catch (imageError) {
            console.error("❌ Erreur lors de l'upload des images:", imageError);
            // Ne pas bloquer le processus pour les images
          }
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error("❌ Échec de l'ajout de l'équipement:", result.error);
        toast({
          title: "Erreur d'ajout",
          description: result.error?.message || "Une erreur est survenue lors de l'ajout de l'équipement.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de l'équipement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Ajouter un équipement
        </h2>
        <p className="text-gray-500">
          Remplissez le formulaire ci-dessous pour ajouter un nouvel équipement à
          la location.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'équipement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nom de l'équipement"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description détaillée de l'équipement"
                required
              />
            </div>

            {/* Catégorie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: CategoryKey) => {
                    setFormData(prev => ({ ...prev, category: value, subcategory: "" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EQUIPMENT_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subcategory">Sous-catégorie</Label>
                <Select 
                  value={formData.subcategory} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une sous-catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category && EQUIPMENT_CATEGORIES[formData.category as CategoryKey]?.subcategories.map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {subcat.replace(/_/g, ' ').charAt(0).toUpperCase() + subcat.replace(/_/g, ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prix et Caution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily_price">Prix par jour (FCFA) *</Label>
                <Input
                  type="number"
                  id="daily_price"
                  value={formData.daily_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      daily_price: e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                  placeholder="Prix de location par jour"
                  required
                />
              </div>
              <div>
                <Label htmlFor="deposit_amount">Caution (FCFA)</Label>
                <Input
                  type="number"
                  id="deposit_amount"
                  value={formData.deposit_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deposit_amount: e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                  placeholder="Montant de la caution"
                />
              </div>
            </div>

            {/* Marque et Année */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Marque</Label>
                <Input
                  type="text"
                  id="brand"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  placeholder="Marque de l'équipement"
                />
              </div>
              <div>
                <Label htmlFor="year">Année</Label>
                <Input
                  type="number"
                  id="year"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value === "" ? "" : parseInt(e.target.value) })
                  }
                  placeholder="Année de fabrication"
                />
              </div>
            </div>

            {/* État */}
            <div>
              <Label htmlFor="condition">État</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) =>
                  setFormData({ ...formData, condition: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'état" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neuf">Neuf</SelectItem>
                  <SelectItem value="tres_bon">Très bon</SelectItem>
                  <SelectItem value="bon">Bon</SelectItem>
                  <SelectItem value="usage">Usagé</SelectItem>
                  <SelectItem value="a_reparer">À réparer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Localisation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Adresse</Label>
                <Input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Adresse de localisation"
                />
              </div>
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) =>
                    setFormData({ ...formData, city: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ville" />
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
            </div>

            {/* Images */}
            <div>
              <Label>Images (3 à 6 photos requises) *</Label>
              <ImageUploader 
                onImagesSelected={handleImageChange}
                selectedFiles={images}
                maxImages={6}
                minImages={3}
              />
            </div>

            {/* Progress bar for image upload */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <Label>Upload des images en cours...</Label>
                <Progress value={uploadProgress} className="mt-2" />
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || images.length < 3}
              >
                {isSubmitting ? (
                  <>
                    Enregistrement...
                  </>
                ) : (
                  "Publier l'équipement"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEquipmentForm;
