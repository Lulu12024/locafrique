
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useStorage } from './useStorage';
import { toast } from "@/components/ui/use-toast";

export function useMobileImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { uploadImage } = useStorage();

  const selectAndUploadImage = async (equipmentId: string, isPrimary: boolean = false) => {
    try {
      setIsUploading(true);
      
      let file: File | null = null;

      if (Capacitor.isNativePlatform()) {
        // Sur mobile natif, on peut utiliser les plugins Capacitor pour accéder à la caméra/galerie
        // Pour l'instant, on utilise l'input file standard
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        return new Promise((resolve, reject) => {
          input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            const selectedFile = target.files?.[0];
            
            if (selectedFile) {
              try {
                const result = await uploadImage(selectedFile, equipmentId, isPrimary);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            } else {
              reject(new Error('Aucun fichier sélectionné'));
            }
          };
          
          input.click();
        });
      } else {
        // Sur web, utiliser l'input file standard
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        return new Promise((resolve, reject) => {
          input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            const selectedFile = target.files?.[0];
            
            if (selectedFile) {
              try {
                const result = await uploadImage(selectedFile, equipmentId, isPrimary);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            } else {
              reject(new Error('Aucun fichier sélectionné'));
            }
          };
          
          input.click();
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection/upload d\'image:', error);
      toast({
        title: "Erreur",
        description: "Impossible de téléverser l'image.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    selectAndUploadImage,
    isUploading
  };
}
