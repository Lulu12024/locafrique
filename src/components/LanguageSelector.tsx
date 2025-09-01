
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-auto min-w-[120px] bg-white border-gray-200 hover:bg-gray-50">
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-gray-600" />
          <span className="text-sm">{currentLanguage.flag}</span>
        </div>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
        {languages.map((language) => (
          <SelectItem 
            key={language.code} 
            value={language.code}
            className="hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
