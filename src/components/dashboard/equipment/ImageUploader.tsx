
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Image as ImageIcon, Check } from "lucide-react";

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  maxImages?: number;
  minImages?: number;
  selectedFiles: File[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesSelected,
  maxImages = 6,
  minImages = 3,
  selectedFiles,
}) => {
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Check if adding these files would exceed the maximum
      if (selectedFiles.length + files.length > maxImages) {
        toast({
          title: "Trop d'images",
          description: `Vous pouvez téléverser un maximum de ${maxImages} images.`,
          variant: "destructive",
        });
        return;
      }
      
      // Validate file types and sizes
      const validFiles = files.filter(file => {
        const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        
        if (!isValidType) {
          toast({
            title: "Type de fichier non pris en charge",
            description: "Seuls les formats JPG et PNG sont acceptés.",
            variant: "destructive",
          });
        }
        
        if (!isValidSize) {
          toast({
            title: "Fichier trop volumineux",
            description: "La taille maximum est de 5 MB.",
            variant: "destructive",
          });
        }
        
        return isValidType && isValidSize;
      });
      
      if (validFiles.length > 0) {
        onImagesSelected([...selectedFiles, ...validFiles]);
      }
    }
  };
  
  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    onImagesSelected(newFiles);
  };
  
  const renderSelectedFiles = () => {
    if (selectedFiles.length === 0) return null;
    
    return (
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {selectedFiles.map((file, index) => (
          <div 
            key={index} 
            className="relative border rounded-md p-2 bg-gray-50"
          >
            <div className="flex items-center">
              <div className="h-16 w-16 mr-2 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                {URL.createObjectURL(file) ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              className="absolute top-1 right-1 p-1 rounded-full bg-white/80 hover:bg-red-50 text-gray-500 hover:text-red-500"
              onClick={() => handleRemoveFile(index)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div>
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-6 text-center">
        <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
        <p className="text-sm">
          Déposez des photos ici ou{" "}
          <label className="text-terracotta cursor-pointer">
            parcourez
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleFileChange}
              disabled={selectedFiles.length >= maxImages}
            />
          </label>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Formats acceptés: JPG, PNG. Max 5 MB
        </p>
        
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Check className={`h-4 w-4 ${selectedFiles.length >= minImages ? 'text-green-500' : 'text-gray-300'}`} />
          <span>
            {selectedFiles.length}/{minImages} images minimum requises
          </span>
        </div>
        
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <span className={selectedFiles.length >= maxImages ? 'text-amber-500' : ''}>
            {selectedFiles.length}/{maxImages} images maximum
          </span>
        </div>
      </div>
      
      {renderSelectedFiles()}
    </div>
  );
};

export default ImageUploader;
