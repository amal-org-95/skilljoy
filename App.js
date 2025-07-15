import React, { useState, useEffect, useContext } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import AuthStack from './src/navigation/AuthStack';
import './src/i18n/i18n';
import useFirebaseMessaging from './src/hooks/useFirebaseMessaging';
import { requestUserPermission, notificationListener } from './src/notifications/notifications';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NavigationContainer } from '@react-navigation/native';
import { I18nManager, ActivityIndicator, View, Text } from 'react-native';
import RNRestart from 'react-native-restart';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from './src/context/LanguageContext';

// Firebase modular imports
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';

const auth = getAuth(getApp());

const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: 'home',
      Profile: 'profile/:userId',
      PostDetail: 'post/:postId',
    },
  },
};

function AppInner() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useThemeMode();
  const { t, i18n } = useTranslation();
  const { language } = useContext(LanguageContext);

  // تغيير اللغة والعكس بين rtl و ltr
  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    if (newLang === 'ar') {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
    // يحتاج إعادة تشغيل التطبيق لتفعيل RTL بشكل كامل
  };

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  useFirebaseMessaging();

  useEffect(() => {
    requestUserPermission();
    notificationListener();

    const unsubscribe = auth.onAuthStateChanged(userAuth => {
      setUser(userAuth);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // تحديث الاتجاه بناءً على اللغة المختارة مع إعادة تشغيل فقط عند تغير الاتجاه
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      const isRTL = lng === 'ar';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        RNRestart.Restart();
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer linking={linking} key={i18n.language}>
        <View style={{ flex: 1 }}>
          {/* تفعيل الترجمة داخل JSX */}
          <Text style={{ display: 'none' }}>{t('welcome')}</Text>
          {user ? <AppNavigator key={i18n.language} /> : <AuthStack />}
        </View>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </ThemeProvider>
  );
}
