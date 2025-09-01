import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle, Users, TrendingUp, Shield, Award, Star, ArrowRight } from "lucide-react";

const ownerApplicationSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  city: z.string().min(1, "Veuillez sélectionner une ville"),
  experience: z.string().min(1, "Veuillez sélectionner votre expérience"),
  equipmentTypes: z.array(z.string()).min(1, "Sélectionnez au moins un type d'équipement"),
  equipmentCount: z.string().min(1, "Veuillez indiquer le nombre d'équipements"),
  motivation: z.string().min(50, "Veuillez détailler votre motivation (minimum 50 caractères)"),
  businessType: z.string().min(1, "Veuillez sélectionner le type d'activité"),
  availability: z.string().min(1, "Veuillez indiquer votre disponibilité"),
  acceptTerms: z.boolean().refine(val => val === true, "Vous devez accepter les conditions"),
  newsletter: z.boolean().optional()
});

type OwnerApplicationForm = z.infer<typeof ownerApplicationSchema>;

const BecomeOwner: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<OwnerApplicationForm>({
    resolver: zodResolver(ownerApplicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      experience: "",
      equipmentTypes: [],
      equipmentCount: "",
      motivation: "",
      businessType: "",
      availability: "",
      acceptTerms: false,
      newsletter: false
    }
  });

  const onSubmit = async (data: OwnerApplicationForm) => {
    setIsSubmitting(true);
    try {
      // Simuler l'envoi de la demande
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Demande de propriétaire:", data);
      
      toast({
        title: "Demande envoyée avec succès !",
        description: "Nous examinerons votre demande et vous contacterons sous 48h.",
      });
      
      form.reset();
      setCurrentStep(1);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const equipmentOptions = [
    "Construction & BTP",
    "Agriculture & Jardinage", 
    "Transport & Véhicules",
    "Événementiel",
    "Bureautique & Hi-Fi",
    "Électroménager",
    "Sport & Loisirs",
    "Autre"
  ];

  const cities = [
    "Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", 
    "Djougou", "Bohicon", "Natitingou", "Ouidah", "Autre"
  ];

  const benefits = [
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Revenus supplémentaires",
      description: "Générez des revenus passifs en louant vos équipements inutilisés"
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Communauté active",
      description: "Rejoignez une communauté de plus de 1000 propriétaires actifs"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Protection assurée",
      description: "Vos équipements sont protégés par notre assurance intégrée"
    },
    {
      icon: <Award className="h-8 w-8 text-green-600" />,
      title: "Support dédié",
      description: "Bénéficiez d'un accompagnement personnalisé pour optimiser vos revenus"
    }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="votre.email@exemple.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input placeholder="+229 XX XX XX XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre ville" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Votre expérience</h3>
              
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Quelle est votre expérience dans la location d'équipements ? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="beginner" id="beginner" />
                          <Label htmlFor="beginner">Débutant - C'est ma première fois</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="some" id="some" />
                          <Label htmlFor="some">Quelques expériences - J'ai déjà loué occasionnellement</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="experienced" id="experienced" />
                          <Label htmlFor="experienced">Expérimenté - Je loue régulièrement</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="professional" id="professional" />
                          <Label htmlFor="professional">Professionnel - C'est mon activité principale</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Type d'activité *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre type d'activité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Particulier</SelectItem>
                        <SelectItem value="craftsman">Artisan</SelectItem>
                        <SelectItem value="company">Entreprise</SelectItem>
                        <SelectItem value="association">Association</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Vos équipements</h3>
              
              <FormField
                control={form.control}
                name="equipmentTypes"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base font-medium">Types d'équipements que vous souhaitez louer *</FormLabel>
                      <p className="text-sm text-gray-600">Sélectionnez toutes les catégories qui s'appliquent</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {equipmentOptions.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="equipmentTypes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipmentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combien d'équipements comptez-vous mettre en location ? *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le nombre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-5">1 à 5 équipements</SelectItem>
                        <SelectItem value="6-15">6 à 15 équipements</SelectItem>
                        <SelectItem value="16-50">16 à 50 équipements</SelectItem>
                        <SelectItem value="50+">Plus de 50 équipements</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quelle sera votre disponibilité pour gérer les locations ? *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre disponibilité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Temps plein - Activité principale</SelectItem>
                        <SelectItem value="part-time">Temps partiel - Activité secondaire</SelectItem>
                        <SelectItem value="weekends">Week-ends uniquement</SelectItem>
                        <SelectItem value="flexible">Horaires flexibles selon demande</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Motivation et finalisation</h3>
              
              <FormField
                control={form.control}
                name="motivation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pourquoi souhaitez-vous devenir propriétaire sur 3W-LOC ? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Décrivez vos motivations, vos objectifs et ce que vous apporteriez à notre communauté..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          J'accepte les conditions générales d'utilisation et la politique de confidentialité *
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newsletter"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Je souhaite recevoir des conseils et actualités par email
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-16">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Devenez propriétaire sur 3W-LOC
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Transformez vos équipements en source de revenus et rejoignez notre communauté de propriétaires prospères
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Revenus garantis</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Assurance incluse</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Support 24/7</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Pourquoi choisir 3W-LOC ?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-4">
                      {benefit.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form Section */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Formulaire de candidature</h2>
              <p className="text-gray-600">
                Complétez ce formulaire pour rejoindre notre réseau de propriétaires
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${currentStep >= step 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                    </div>
                    {step < 4 && (
                      <div className={`
                        flex-1 h-1 mx-4
                        ${currentStep > step ? 'bg-green-600' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Informations</span>
                <span>Expérience</span>
                <span>Équipements</span>
                <span>Finalisation</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Étape {currentStep} sur {totalSteps}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {renderStep()}
                    
                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                      >
                        Précédent
                      </Button>
                      
                      {currentStep < totalSteps ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Suivant
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSubmitting ? "Envoi en cours..." : "Envoyer ma candidature"}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Success Stories Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Témoignages de nos propriétaires
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Amadou Kone",
                  role: "Propriétaire depuis 2 ans",
                  revenue: "15,000 FCFA/mois",
                  rating: 5,
                  comment: "Grâce à 3W-LOC, je génère des revenus réguliers avec mes équipements de construction."
                },
                {
                  name: "Marie Adjovi",
                  role: "Propriétaire depuis 1 an",
                  revenue: "8,500 FCFA/mois",
                  rating: 5,
                  comment: "La plateforme est facile à utiliser et le support client est excellent."
                },
                {
                  name: "Joseph Dossou",
                  role: "Propriétaire depuis 3 ans",
                  revenue: "25,000 FCFA/mois",
                  rating: 5,
                  comment: "Mon activité de location a vraiment décollé depuis que j'ai rejoint 3W-LOC."
                }
              ].map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <CardContent className="pt-0">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-green-600 font-semibold text-lg">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">"{testimonial.comment}"</p>
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-700 font-semibold text-sm">
                        Revenus moyens: {testimonial.revenue}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BecomeOwner;
