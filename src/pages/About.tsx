
import React from "react";
import Navbar from "@/components/Navbar";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">À propos de 3W-LOC</h1>
            
            <div className="prose prose-lg mx-auto">
              <p className="text-xl text-gray-600 mb-8 text-center">
                3W-LOC est la première plateforme de location d'équipements au Bénin et en Afrique francophone.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-semibold mb-4 text-terracotta">Notre Mission</h2>
                  <p className="text-gray-600">
                    Démocratiser l'accès aux équipements professionnels en créant une plateforme 
                    sécurisée et conviviale qui connecte les propriétaires d'équipements aux 
                    personnes qui en ont besoin.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-semibold mb-4 text-ocean">Notre Vision</h2>
                  <p className="text-gray-600">
                    Devenir la référence africaine en matière de location d'équipements, 
                    en favorisant l'économie collaborative et en contribuant au développement 
                    économique local.
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-sm mb-12">
                <h2 className="text-3xl font-semibold mb-6 text-center">Nos Valeurs</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🤝</span>
                    </div>
                    <h3 className="font-semibold mb-2">Confiance</h3>
                    <p className="text-sm text-gray-600">
                      Nous construisons un environnement de confiance mutuelle entre tous nos utilisateurs.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="font-semibold mb-2">Simplicité</h3>
                    <p className="text-sm text-gray-600">
                      Une interface intuitive pour rendre la location d'équipements accessible à tous.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🌍</span>
                    </div>
                    <h3 className="font-semibold mb-2">Impact Local</h3>
                    <p className="text-sm text-gray-600">
                      Nous contribuons au développement économique local en Afrique francophone.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-terracotta to-ocean p-8 rounded-lg text-white text-center">
                <h2 className="text-3xl font-semibold mb-4">Rejoignez-nous</h2>
                <p className="text-xl mb-6">
                  Que vous souhaitiez louer ou mettre en location vos équipements, 
                  3W-LOC est là pour vous accompagner.
                </p>
                <div className="flex justify-center space-x-4">
                  <button className="bg-white text-terracotta px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Commencer maintenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
