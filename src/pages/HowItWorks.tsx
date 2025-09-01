
import React from "react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  CheckCircle, 
  ArrowRight, 
  Shield, 
  Clock, 
  Star, 
  Users,
  MessageCircle,
  CreditCard,
  Truck,
  RotateCcw,
  UserPlus,
  Search,
  Calendar,
  HelpCircle
} from "lucide-react";

const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: "Créez votre compte",
      description: "Inscrivez-vous gratuitement en quelques secondes et choisissez votre profil: locataire ou propriétaire.",
      icon: UserPlus,
      color: "bg-green-500",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Trouvez le matériel idéal",
      description: "Parcourez notre large sélection de matériels disponibles à la location près de chez vous.",
      icon: Search,
      color: "bg-blue-500",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Réservez en ligne",
      description: "Sélectionnez vos dates et effectuez votre demande de réservation en quelques clics.",
      icon: Calendar,
      color: "bg-purple-500",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Paiement sécurisé",
      description: "Réglez en ligne ou sur place selon les options proposées par le propriétaire.",
      icon: CreditCard,
      color: "bg-orange-500",
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Récupérez le matériel",
      description: "Rencontrez le propriétaire et récupérez votre matériel à la date convenue.",
      icon: Truck,
      color: "bg-indigo-500",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      title: "Utilisez et restituez",
      description: "Utilisez le matériel pour vos projets et restituez-le en bon état à la fin de la période.",
      icon: RotateCcw,
      color: "bg-teal-500",
      gradient: "from-teal-500 to-green-500"
    }
  ];
  
  const faqItems = [
    {
      question: "Comment fonctionne la caution ?",
      answer: "La caution est un montant de garantie demandé par le propriétaire pour couvrir d'éventuels dommages. Elle est entièrement remboursée après la restitution du matériel en bon état.",
      icon: Shield
    },
    {
      question: "Que se passe-t-il si le matériel est endommagé ?",
      answer: "En cas de dommage, une évaluation est faite et une partie ou la totalité de la caution peut être conservée pour couvrir les réparations. Nous encourageons toujours un dialogue entre les parties pour trouver un accord équitable.",
      icon: HelpCircle
    },
    {
      question: "Comment sont gérés les paiements ?",
      answer: "Les paiements sont sécurisés via notre plateforme. Le montant est débité uniquement après confirmation de la réservation par le propriétaire, et le paiement est transféré au propriétaire après la période de location.",
      icon: CreditCard
    },
    {
      question: "Puis-je prolonger ma période de location ?",
      answer: "Oui, si le matériel est disponible. Vous devez faire une demande de prolongation via la plateforme, qui sera soumise à l'approbation du propriétaire.",
      icon: Clock
    },
    {
      question: "Comment devenir propriétaire sur 3W-LOC ?",
      answer: "Il suffit de créer un compte en choisissant le profil 'propriétaire', puis d'ajouter votre matériel disponible à la location avec photos et description détaillée.",
      icon: Users
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Sécurité garantie",
      description: "Transactions sécurisées et protection contre les fraudes",
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      icon: Clock,
      title: "Disponible 24/7",
      description: "Réservez et gérez vos locations à tout moment",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: MessageCircle,
      title: "Support réactif",
      description: "Équipe de support disponible pour vous accompagner",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      icon: Users,
      title: "Communauté active",
      description: "Plus de 5000 utilisateurs font confiance à 3W-LOC",
      color: "text-orange-600",
      bg: "bg-orange-50"
    }
  ];

  const testimonials = [
    {
      name: "Kofi A.",
      role: "Locataire",
      rating: 5,
      comment: "Grâce à 3W-LOC, j'ai pu louer une bétonnière pour mon chantier à un prix très abordable. Le processus était simple et rapide !",
      avatar: "K"
    },
    {
      name: "Amadou M.",
      role: "Propriétaire",
      rating: 5,
      comment: "Je mets mon tracteur en location pendant les périodes où je ne l'utilise pas. Cela m'a permis de générer un revenu supplémentaire significatif.",
      avatar: "A"
    },
    {
      name: "Awa T.",
      role: "Locataire",
      rating: 5,
      comment: "Pour mon mariage, j'ai pu trouver tout le matériel événementiel dont j'avais besoin sur 3W-LOC. Une vraie solution pour les grands événements!",
      avatar: "A"
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow">
        {/* Hero Section - Amélioré */}
        <section className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="container-custom text-center relative z-10">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              Guide complet
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              Comment fonctionne 3W-LOC ?
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              Découvrez comment notre plateforme révolutionne la location de matériel pour tous vos besoins
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center bg-white/20 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Simple & Rapide</span>
              </div>
              <div className="flex items-center bg-white/20 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">100% Sécurisé</span>
              </div>
              <div className="flex items-center bg-white/20 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Support 24/7</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-gray-100 shadow-lg"
                asChild
              >
                <Link to="/">
                  Voir les matériels
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-green-600 bg-white/10"
                asChild
              >
                <Link to="/auth">Créer un compte</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Section étapes - Design amélioré */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Processus simple</Badge>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Le processus en 6 étapes simples</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                De la création de compte à la restitution, suivez notre guide étape par étape
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${step.gradient}`}></div>
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${step.gradient} rounded-xl flex items-center justify-center text-white mr-4 group-hover:scale-110 transition-transform`}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs font-bold">
                        Étape {index + 1}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-green-600 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section fonctionnalités - Nouveau */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Fonctionnalités</Badge>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Pourquoi choisir 3W-LOC ?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Section témoignages - Design amélioré */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Témoignages</Badge>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Ce que disent nos utilisateurs</h2>
              <p className="text-xl text-gray-600">Des milliers d'utilisateurs satisfaits nous font confiance</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-gray-600 italic leading-relaxed">"{testimonial.comment}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Section FAQ - Design amélioré */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Questions fréquemment posées</h2>
              <p className="text-xl text-gray-600">Trouvez rapidement les réponses à vos questions</p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-6">
              {faqItems.map((item, index) => (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white mr-4 flex-shrink-0 mt-1">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-3 text-gray-900">{item.question}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-16">
              <p className="mb-6 text-gray-600 text-lg">Vous avez d'autres questions ?</p>
              <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg">
                <Link to="/contact">
                  Contactez-nous
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="container-custom text-center">
            <h2 className="text-4xl font-bold mb-6">Prêt à commencer ?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Rejoignez des milliers d'utilisateurs qui font déjà confiance à 3W-LOC
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-gray-100 shadow-lg"
                asChild
              >
                <Link to="/auth">
                  Créer mon compte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-green-600 bg-white/10"
                asChild
              >
                <Link to="/become-owner">Devenir propriétaire</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HowItWorks;
