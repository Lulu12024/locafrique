
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    dailyPrice: "",
    depositAmount: "",
    location: "",
    city: "",
    country: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation simple
    if (!formData.title || !formData.description || !formData.category || !formData.dailyPrice) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Simulation d'ajout d'équipement
    toast({
      title: "Succès",
      description: "Équipement ajouté avec succès !",
    });
    
    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "",
      dailyPrice: "",
      depositAmount: "",
      location: "",
      city: "",
      country: ""
    });
    
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span>Ajouter un équipement</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'équipement *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Ex: Perceuse sans fil Bosch"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Décrivez votre équipement..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bricolage">Bricolage</SelectItem>
                  <SelectItem value="jardinage">Jardinage</SelectItem>
                  <SelectItem value="electromenager">Électroménager</SelectItem>
                  <SelectItem value="electronique">Électronique</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dailyPrice">Prix par jour (€) *</Label>
              <Input
                id="dailyPrice"
                type="number"
                value={formData.dailyPrice}
                onChange={(e) => handleInputChange("dailyPrice", e.target.value)}
                placeholder="20"
              />
            </div>
            <div>
              <Label htmlFor="depositAmount">Caution (€)</Label>
              <Input
                id="depositAmount"
                type="number"
                value={formData.depositAmount}
                onChange={(e) => handleInputChange("depositAmount", e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Adresse</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="123 Rue de la Paix"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Paris"
                />
              </div>
              <div>
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="France"
                />
              </div>
            </div>
          </div>

          {/* Images Upload */}
          <div>
            <Label>Photos de l'équipement</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Cliquez pour ajouter des photos</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG jusqu'à 5MB</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Ajouter l'équipement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentModal;
