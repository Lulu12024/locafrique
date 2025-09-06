import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Mail, 
  User, 
  CreditCard,
  FileText,
  Loader2,
  X,
  Eye,
  Shield
} from 'lucide-react';

const IdentityVerificationSystem = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [idImage, setIdImage] = useState(null);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractGenerated, setContractGenerated] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Données d'exemple pour la démonstration
  const bookingData = {
    id: "BOOK-2025-001",
    equipment: {
      title: "Pelleteuse hydraulique Caterpillar 320",
      owner: {
        name: "Jean Kouassi",
        id_number: "CI123456789",
        verified: true
      }
    },
    renter: {
      name: "Marie Dupont",
      id_number: "CI987654321",
      verified: false
    },
    rental_period: "15-20 Janvier 2025",
    total_amount: 225000,
    commission: 11250 // 5% fixe
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    setIsProcessing(true);
    setIdImage(file);
    
    // Simulation du traitement OCR
    setTimeout(() => {
      setExtractedInfo({
        name: "DUPONT MARIE CLAIRE",
        idNumber: "CI987654321",
        dateOfBirth: "15/03/1985",
        placeOfBirth: "Abidjan",
        documentType: "Carte Nationale d'Identité",
        confidence: 95
      });
      setIsProcessing(false);
    }, 2000);
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const generateContract = async () => {
    setIsProcessing(true);
    
    // Simulation de génération de contrat
    setTimeout(() => {
      setContractGenerated(true);
      setActiveStep(3);
      setIsProcessing(false);
    }, 3000);
  };

  const sendContractByEmail = async () => {
    setIsProcessing(true);
    
    // Simulation d'envoi d'email
    setTimeout(() => {
      setEmailSent(true);
      setIsProcessing(false);
    }, 2000);
  };

  const IdentityCapture = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Vérification d'identité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Veuillez photographier ou télécharger votre pièce d'identité. 
            L'image sera automatiquement cadrée et les informations extraites.
          </p>
          
          {!idImage ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option appareil photo */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-32 flex-col space-y-3"
                >
                  <Camera className="h-12 w-12 text-blue-600" />
                  <div>
                    <p className="font-medium">Prendre une photo</p>
                    <p className="text-sm text-gray-500">Utiliser l'appareil photo</p>
                  </div>
                </Button>
              </div>
              
              {/* Option téléchargement */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-32 flex-col space-y-3"
                >
                  <Upload className="h-12 w-12 text-green-600" />
                  <div>
                    <p className="font-medium">Télécharger un fichier</p>
                    <p className="text-sm text-gray-500">JPG, PNG (max 5MB)</p>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Aperçu de l'image avec extraction */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <img 
                      src={URL.createObjectURL(idImage)} 
                      alt="Pièce d'identité" 
                      className="w-64 h-40 object-cover rounded-lg border-2 border-blue-300"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                  
                  {isProcessing ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-gray-600">Extraction des informations...</p>
                      </div>
                    </div>
                  ) : extractedInfo ? (
                    <div className="flex-1 space-y-3">
                      <h4 className="font-semibold text-gray-900">Informations extraites</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-gray-600">Nom complet</Label>
                          <p className="font-medium">{extractedInfo.name}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">N° d'identité</Label>
                          <p className="font-medium font-mono">{extractedInfo.idNumber}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Date de naissance</Label>
                          <p className="font-medium">{extractedInfo.dateOfBirth}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Type de document</Label>
                          <p className="font-medium">{extractedInfo.documentType}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confiance: {extractedInfo.confidence}%
                        </Badge>
                      </div>
                    </div>
                  ) : null}
                </div>
                
                {extractedInfo && (
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      onClick={() => {
                        setIdImage(null);
                        setExtractedInfo(null);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reprendre
                    </Button>
                    <Button onClick={() => setActiveStep(2)}>
                      Valider et continuer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const ContractPreview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Aperçu du contrat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations des parties avec identités */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Propriétaire */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Propriétaire (Bailleur)</h4>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-8 bg-blue-200 rounded border flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-700" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{bookingData.equipment.owner.name}</p>
                  <p className="text-gray-600 font-mono">{bookingData.equipment.owner.id_number}</p>
                </div>
                {bookingData.equipment.owner.verified && (
                  <Shield className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
            
            {/* Locataire */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">Locataire (Preneur)</h4>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-8 bg-green-200 rounded border flex items-center justify-center overflow-hidden">
                  {idImage ? (
                    <img 
                      src={URL.createObjectURL(idImage)} 
                      alt="ID" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CreditCard className="h-4 w-4 text-green-700" />
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium">{extractedInfo?.name || bookingData.renter.name}</p>
                  <p className="text-gray-600 font-mono">{extractedInfo?.idNumber || bookingData.renter.id_number}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
          
          {/* Détails du contrat */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h4 className="font-semibold text-gray-900">Détails de la location</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Équipement</Label>
                <p className="font-medium">{bookingData.equipment.title}</p>
              </div>
              <div>
                <Label className="text-gray-600">Période</Label>
                <p className="font-medium">{bookingData.rental_period}</p>
              </div>
              <div>
                <Label className="text-gray-600">Montant total</Label>
                <p className="font-medium">{bookingData.total_amount.toLocaleString()} FCFA</p>
              </div>
              <div>
                <Label className="text-gray-600">Commission (5%)</Label>
                <p className="font-medium text-orange-600">{bookingData.commission.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>
          
          {/* Validation automatique */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-900">Validation automatique réussie</h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✓ Identité du locataire vérifiée</li>
              <li>✓ Informations extraites automatiquement</li>
              <li>✓ Commission de 5% appliquée</li>
              <li>✓ Contrat prêt à être généré</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={generateContract}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer le contrat
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setActiveStep(1)}>
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ContractGenerated = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            Contrat généré avec succès
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              Contrat de location #{bookingData.id}
            </h3>
            <p className="text-green-700 mb-4">
              Le contrat a été généré automatiquement avec les informations d'identité vérifiées
            </p>
            
            {/* Aperçu miniature du contrat */}
            <div className="bg-white border-2 border-green-300 rounded-lg p-4 mb-4 max-w-sm mx-auto">
              <div className="space-y-2 text-xs text-left">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-3 bg-blue-200 rounded"></div>
                  <span className="font-medium">{bookingData.equipment.owner.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-3 bg-green-200 rounded overflow-hidden">
                    {idImage && (
                      <img 
                        src={URL.createObjectURL(idImage)} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className="font-medium">{extractedInfo?.name}</span>
                </div>
                <div className="text-gray-600">
                  <p>{bookingData.equipment.title}</p>
                  <p>{bookingData.rental_period}</p>
                  <p className="font-mono">{bookingData.total_amount.toLocaleString()} FCFA</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center py-6"
            >
              <Download className="h-5 w-5 mr-2" />
              Télécharger le PDF
            </Button>
            
            <Button 
              onClick={sendContractByEmail}
              disabled={isProcessing || emailSent}
              className="w-full flex items-center justify-center py-6"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : emailSent ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Email envoyé
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  Envoyer par email
                </>
              )}
            </Button>
          </div>
          
          {emailSent && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <p className="text-blue-900 font-medium">Email envoyé automatiquement</p>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Le contrat a été envoyé aux deux parties avec toutes les informations d'identité intégrées.
              </p>
            </div>
          )}
          
          {/* Récapitulatif final */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Récapitulatif de la transaction</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Montant de la location</span>
                  <span>{(bookingData.total_amount - bookingData.commission).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Commission plateforme (5%)</span>
                  <span>{bookingData.commission.toLocaleString()} FCFA</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{bookingData.total_amount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );

  const steps = [
    { id: 1, name: 'Vérification', desc: 'Capture de l\'identité', completed: extractedInfo !== null },
    { id: 2, name: 'Contrat', desc: 'Génération automatique', completed: contractGenerated },
    { id: 3, name: 'Finalisation', desc: 'Téléchargement et envoi', completed: emailSent }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête avec progression */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Système de Vérification d'Identité
        </h1>
        <p className="text-gray-600 mb-6">
          Validation automatique sans signature - Commission fixe 5%
        </p>
        
        {/* Indicateur de progression */}
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${
                activeStep >= step.id ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step.completed ? 'bg-green-600 border-green-600 text-white' :
                  activeStep >= step.id ? 'border-blue-600' : 'border-gray-300'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-xs">{step.desc}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 ${
                  activeStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu des étapes */}
      <div>
        {activeStep === 1 && <IdentityCapture />}
        {activeStep === 2 && <ContractPreview />}
        {activeStep === 3 && <ContractGenerated />}
      </div>
    </div>
  );
};

export default IdentityVerificationSystem;