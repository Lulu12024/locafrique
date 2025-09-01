
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-8">
            <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
            <p className="text-gray-600 mb-8">Dernière mise à jour: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-3">
                  Chez 3W-LOC, nous nous engageons à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme.
                </p>
                <p className="mb-3">
                  En utilisant 3W-LOC, vous acceptez les pratiques décrites dans cette politique de confidentialité. Si vous n'êtes pas d'accord avec cette politique, veuillez ne pas utiliser notre plateforme.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">2. Informations que nous collectons</h2>
                <p className="mb-3">
                  Nous collectons différents types d'informations pour fournir et améliorer notre service :
                </p>
                <h3 className="font-semibold mb-2">2.1. Informations que vous nous fournissez</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Informations d'inscription : nom, prénom, adresse e-mail, numéro de téléphone, mot de passe.</li>
                  <li>Informations de profil : photo de profil, adresse, description, préférences.</li>
                  <li>Informations de paiement : coordonnées bancaires, historique des transactions.</li>
                  <li>Communications : messages échangés avec d'autres utilisateurs ou notre service client.</li>
                  <li>Contenu généré : annonces, évaluations, commentaires.</li>
                </ul>
                
                <h3 className="font-semibold mb-2">2.2. Informations collectées automatiquement</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Données d'utilisation : pages visitées, fonctionnalités utilisées, temps passé sur la plateforme.</li>
                  <li>Données techniques : adresse IP, type d'appareil, navigateur, système d'exploitation, identifiants uniques.</li>
                  <li>Données de localisation : localisation géographique (si vous l'autorisez).</li>
                  <li>Cookies et technologies similaires : informations stockées sur votre appareil pour améliorer votre expérience.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">3. Comment nous utilisons vos informations</h2>
                <p className="mb-3">
                  Nous utilisons les informations collectées pour les finalités suivantes :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Fournir, maintenir et améliorer notre service.</li>
                  <li>Traiter vos transactions et gérer votre compte.</li>
                  <li>Faciliter la communication entre les utilisateurs de la plateforme.</li>
                  <li>Vous envoyer des notifications, des mises à jour et des informations relatives à votre compte.</li>
                  <li>Personnaliser votre expérience et vous proposer du contenu adapté à vos intérêts.</li>
                  <li>Analyser l'utilisation de notre plateforme pour améliorer nos services.</li>
                  <li>Détecter, prévenir et résoudre les problèmes techniques ou de sécurité.</li>
                  <li>Respecter nos obligations légales.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">4. Partage des informations</h2>
                <p className="mb-3">
                  Nous pouvons partager vos informations dans les circonstances suivantes :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Entre utilisateurs</strong> : Certaines de vos informations (nom, photo de profil, évaluations) sont visibles par d'autres utilisateurs pour faciliter les locations.</li>
                  <li><strong>Prestataires de services</strong> : Nous collaborons avec des entreprises tierces qui nous aident à fournir notre service (paiement, hébergement, analyse de données).</li>
                  <li><strong>Conformité légale</strong> : Nous pouvons divulguer des informations si la loi l'exige ou pour protéger nos droits.</li>
                  <li><strong>Transfert d'entreprise</strong> : En cas de fusion, acquisition ou vente d'actifs, vos informations peuvent être transférées.</li>
                </ul>
                <p className="mt-3">
                  Nous ne vendons pas vos informations personnelles à des tiers.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">5. Protection des données</h2>
                <p className="mb-3">
                  La sécurité de vos données est importante pour nous. Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations contre tout accès, utilisation ou divulgation non autorisés.
                </p>
                <p className="mb-3">
                  Cependant, aucune méthode de transmission sur Internet ou de stockage électronique n'est totalement sécurisée. Nous ne pouvons garantir une sécurité absolue.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">6. Vos droits</h2>
                <p className="mb-3">
                  En fonction de votre lieu de résidence, vous pouvez disposer de certains droits concernant vos informations personnelles :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Accéder à vos données personnelles.</li>
                  <li>Rectifier vos données si elles sont inexactes ou incomplètes.</li>
                  <li>Supprimer vos données dans certaines circonstances.</li>
                  <li>Limiter ou vous opposer au traitement de vos données.</li>
                  <li>Recevoir vos données dans un format structuré (portabilité des données).</li>
                  <li>Retirer votre consentement à tout moment.</li>
                </ul>
                <p className="mt-3">
                  Pour exercer ces droits, veuillez nous contacter via les coordonnées fournies à la fin de cette politique.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">7. Conservation des données</h2>
                <p className="mb-3">
                  Nous conservons vos informations aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. La durée de conservation varie en fonction du type d'information et de son usage.
                </p>
                <p className="mb-3">
                  Lorsque nous n'avons plus besoin de vos informations, nous les supprimons ou les anonymisons de manière sécurisée.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">8. Transferts internationaux</h2>
                <p className="mb-3">
                  3W-LOC est basé au Bénin, mais nos services peuvent être fournis par des entités opérant dans d'autres pays. Vos informations peuvent donc être transférées et traitées dans des pays autres que le vôtre.
                </p>
                <p className="mb-3">
                  Nous prenons des mesures pour garantir que vos données bénéficient d'un niveau de protection adéquat, quel que soit l'endroit où elles sont traitées.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">9. Cookies et technologies similaires</h2>
                <p className="mb-3">
                  Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience, comprendre comment notre service est utilisé et personnaliser le contenu.
                </p>
                <p className="mb-3">
                  Vous pouvez configurer votre navigateur pour refuser tous les cookies ou pour vous avertir lorsqu'un cookie est envoyé. Cependant, certaines fonctionnalités de notre service peuvent ne pas fonctionner correctement sans cookies.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">10. Modifications de cette politique</h2>
                <p className="mb-3">
                  Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement significatif en publiant la nouvelle politique sur notre plateforme ou en vous envoyant une notification.
                </p>
                <p className="mb-3">
                  Nous vous encourageons à consulter régulièrement cette politique pour rester informé de la façon dont nous protégeons vos informations.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">11. Contact</h2>
                <p className="mb-3">
                  Si vous avez des questions concernant cette politique de confidentialité ou nos pratiques en matière de protection des données, veuillez nous contacter à :
                </p>
                <p className="mb-3">
                  Email : privacy@3w-loc.com<br />
                  Adresse : 123 Rue Principale, Cotonou, Bénin
                </p>
                <p className="mb-3">
                  Vous pouvez également utiliser notre <Link to="/contact" className="text-terracotta hover:underline">formulaire de contact</Link>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
