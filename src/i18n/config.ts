
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from '../locales/fr.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'fr',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
