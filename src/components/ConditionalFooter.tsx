
import React from 'react';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';

const ConditionalFooter: React.FC = () => {
  const isMobile = useIsMobile();
  
  // Ne pas afficher le footer sur mobile
  if (isMobile) {
    return null;
  }
  
  return <Footer />;
};

export default ConditionalFooter;
