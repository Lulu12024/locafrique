import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth";
import { Loader2, Upload } from "lucide-react";
import { uploadIdDocument } from "@/utils/fileUpload";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileSettings: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    country: "",
    id_number: "",
    user_type: "locataire" as 'locataire' | 'proprietaire',
  });
  
  // Populate form with existing profile data
  useEffect(() => {
    if (user) {
      console.log("Utilisateur trouvé, données:", { user, profile });
      
      // Utiliser les données utilisateur même sans profil complet
      setFormData({
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        email: user.email || "",
        phone_number: profile?.phone_number || "",
        address: profile?.address || "",
        city: profile?.city || "",
        country: profile?.country || "",
        id_number: profile?.id_number || "",
        user_type: profile?.user_type || "locataire",
      });
      
      setIsLoading(false);
    }
  }, [profile, user]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type and size
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        toast({
          title: "Type de fichier non pris en charge",
          description: "Seuls les formats JPG, PNG et PDF sont acceptés.",
          variant: "destructive",
        });
        return;
      }
      
      if (!isValidSize) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximum est de 5 MB.",
          variant: "destructive",
        });
        return;
      }
      
      setIdDocument(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Upload ID document if selected
      let idDocumentUrl = profile?.id_document_url;
      
      if (idDocument) {
        const uploadedUrl = await uploadIdDocument(idDocument, user.id);
        if (uploadedUrl) {
          idDocumentUrl = uploadedUrl;
        }
      }
      
      // Update profile data
      const profileData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        id_number: formData.id_number,
        id_document_url: idDocumentUrl,
        user_type: formData.user_type,
      };
      
      const result = await updateProfile(profileData);
      
      if (result.success) {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été mises à jour avec succès."
        });
      } else {
        throw new Error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Veuillez vous connecter pour accéder aux paramètres.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres du profil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input 
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input 
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                value={formData.email}
                className="bg-gray-50" 
                readOnly 
              />
              <p className="text-xs text-muted-foreground mt-1">
                L'adresse email ne peut pas être modifiée.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Numéro de téléphone</Label>
              <Input 
                id="phone_number"
                name="phone_number" 
                value={formData.phone_number} 
                onChange={handleChange}
                placeholder="+229 00000000" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input 
              id="address"
              name="address" 
              value={formData.address} 
              onChange={handleChange}
              placeholder="Votre adresse complète" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input 
                id="city"
                name="city" 
                value={formData.city} 
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input 
                id="country"
                name="country" 
                value={formData.country} 
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Informations d'identification</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id_number">Numéro de pièce d'identité</Label>
                <Input 
                  id="id_number"
                  name="id_number" 
                  value={formData.id_number} 
                  onChange={handleChange}
                  placeholder="Numéro de carte nationale d'identité, passeport..." 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="id_document">Document d'identité</Label>
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm">
                    {profile?.id_document_url ? "Changer de document" : "Téléversez une copie de votre pièce d'identité"}{" "}
                    <label className="text-terracotta cursor-pointer">
                      parcourir
                      <input
                        id="id_document"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={handleIdDocumentChange}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formats acceptés: JPG, PNG, PDF. Max 5 MB
                  </p>
                </div>
                
                {/* Afficher le nom du fichier sélectionné ou du document existant */}
                {(idDocument || profile?.id_document_url) && (
                  <div className="mt-2 p-2 bg-gray-50 border rounded-md">
                    <div className="flex items-center">
                      <div className="flex-1 min-w-0">
                        {idDocument ? (
                          <p className="text-sm truncate">{idDocument.name}</p>
                        ) : profile?.id_document_url ? (
                          <p className="text-sm">Document d'identité existant</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
