import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import i18n from '../i18n/i18n';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(i18n.language);

  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    setLanguage(lng);
  };

  // 🔄 مزامنة التغيير من i18n إلى state إذا تغير من خارج السياق (احتياطي)
  useEffect(() => {
    const onLanguageChanged = (lng) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
