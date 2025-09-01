
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-8">
            <h1 className="text-3xl font-bold mb-6">Conditions Générales d'Utilisation</h1>
            <p className="text-gray-600 mb-8">Dernière mise à jour: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-3">
                  Bienvenue sur 3W-LOC. Les présentes Conditions Générales d'Utilisation (CGU) régissent votre utilisation de la plateforme 3W-LOC, accessible via le site web www.3w-loc.com et l'application mobile 3W-LOC (collectivement, la "Plateforme").
                </p>
                <p className="mb-3">
                  En accédant à notre Plateforme ou en l'utilisant, vous acceptez d'être lié par ces CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre Plateforme.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">2. Définitions</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>"Utilisateur"</strong> : toute personne qui accède à la Plateforme, qu'elle soit inscrite ou non.</li>
                  <li><strong>"Membre"</strong> : Utilisateur inscrit sur la Plateforme.</li>
                  <li><strong>"Propriétaire"</strong> : Membre qui propose du matériel à la location sur la Plateforme.</li>
                  <li><strong>"Locataire"</strong> : Membre qui loue du matériel via la Plateforme.</li>
                  <li><strong>"Service"</strong> : ensemble des fonctionnalités proposées par la Plateforme 3W-LOC.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">3. Inscription et compte</h2>
                <p className="mb-3">
                  Pour utiliser pleinement notre Service, vous devez créer un compte. Lors de l'inscription, vous vous engagez à :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Fournir des informations exactes, complètes et à jour.</li>
                  <li>Maintenir la confidentialité de votre mot de passe et de toute information relative à votre compte.</li>
                  <li>Assumer l'entière responsabilité de toutes les activités qui se déroulent sous votre compte.</li>
                  <li>Nous informer immédiatement de toute utilisation non autorisée de votre compte.</li>
                </ul>
                <p className="mt-3">
                  3W-LOC se réserve le droit de refuser l'accès au Service, de fermer des comptes, de supprimer ou de modifier du contenu à sa seule discrétion.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">4. Conditions spécifiques aux Propriétaires</h2>
                <p className="mb-3">
                  En tant que Propriétaire, vous vous engagez à :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ne proposer que du matériel dont vous êtes légalement propriétaire ou pour lequel vous disposez des droits nécessaires pour le mettre en location.</li>
                  <li>Fournir une description précise et complète du matériel proposé (état, caractéristiques, valeur, etc.).</li>
                  <li>Fixer un prix de location raisonnable et conforme aux pratiques du marché.</li>
                  <li>Respecter les réservations confirmées et rendre le matériel disponible aux dates convenues.</li>
                  <li>S'assurer que le matériel loué est en bon état de fonctionnement et répond aux normes de sécurité en vigueur.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">5. Conditions spécifiques aux Locataires</h2>
                <p className="mb-3">
                  En tant que Locataire, vous vous engagez à :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Utiliser le matériel loué conformément à son usage prévu et dans le respect des instructions fournies par le Propriétaire.</li>
                  <li>Restituer le matériel dans l'état dans lequel il a été loué, hormis l'usure normale liée à son utilisation.</li>
                  <li>Payer le prix de location convenu ainsi que la caution demandée, le cas échéant.</li>
                  <li>Ne pas sous-louer ou prêter le matériel loué à un tiers.</li>
                  <li>Indemniser le Propriétaire en cas de dommage ou de perte du matériel loué.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">6. Paiements et commissions</h2>
                <p className="mb-3">
                  3W-LOC facilite les transactions entre les Membres mais n'est pas partie aux contrats de location conclus entre eux. Pour l'utilisation de notre service, les conditions suivantes s'appliquent :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>3W-LOC perçoit une commission sur chaque transaction réalisée via la Plateforme. Cette commission est clairement indiquée avant la validation de la transaction.</li>
                  <li>Les paiements sont traités via notre système sécurisé. Les fonds sont versés au Propriétaire après confirmation de la bonne exécution de la location.</li>
                  <li>Une caution peut être demandée par le Propriétaire et sera remboursée au Locataire après vérification de l'état du matériel à son retour.</li>
                  <li>En cas d'annulation, des frais peuvent s'appliquer selon les conditions détaillées dans notre politique d'annulation.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">7. Responsabilités et assurances</h2>
                <p className="mb-3">
                  3W-LOC ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation de la Plateforme ou du matériel loué via celle-ci. Il est fortement recommandé à tous les Membres de souscrire une assurance appropriée pour couvrir les risques liés à la location de matériel.
                </p>
                <p className="mb-3">
                  Les Propriétaires sont invités à vérifier que leur assurance couvre la mise en location de leur matériel à des tiers. De même, les Locataires devraient s'assurer qu'ils sont couverts pour l'utilisation de matériel loué.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">8. Propriété intellectuelle</h2>
                <p className="mb-3">
                  Tous les droits de propriété intellectuelle relatifs à la Plateforme et à son contenu (textes, images, logos, etc.) sont la propriété exclusive de 3W-LOC ou de ses concédants de licence. Ces éléments sont protégés par les lois relatives à la propriété intellectuelle.
                </p>
                <p className="mb-3">
                  Aucune reproduction ou utilisation de ces éléments n'est autorisée sans l'accord préalable écrit de 3W-LOC.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">9. Protection des données personnelles</h2>
                <p className="mb-3">
                  3W-LOC accorde une grande importance à la protection de vos données personnelles. Notre Politique de Confidentialité décrit la manière dont nous collectons, utilisons et protégeons vos données. En utilisant notre Plateforme, vous consentez à notre Politique de Confidentialité.
                </p>
                <p className="mb-3">
                  Pour plus d'informations, veuillez consulter notre <Link to="/privacy" className="text-terracotta hover:underline">Politique de Confidentialité</Link>.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">10. Modification des CGU</h2>
                <p className="mb-3">
                  3W-LOC se réserve le droit de modifier ces CGU à tout moment. Les modifications prendront effet dès leur publication sur la Plateforme. Il vous appartient de consulter régulièrement ces CGU pour vous tenir informé des changements éventuels.
                </p>
                <p className="mb-3">
                  L'utilisation continue de la Plateforme après la publication des modifications vaut acceptation de votre part des CGU modifiées.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">11. Loi applicable et juridiction compétente</h2>
                <p className="mb-3">
                  Les présentes CGU sont soumises au droit béninois. Tout litige relatif à l'interprétation ou à l'exécution de ces CGU relève de la compétence exclusive des tribunaux de Cotonou, Bénin.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">12. Contact</h2>
                <p className="mb-3">
                  Pour toute question concernant ces CGU, veuillez nous contacter à l'adresse suivante : contact@3w-loc.com ou via notre <Link to="/contact" className="text-terracotta hover:underline">formulaire de contact</Link>.
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

export default Terms;
