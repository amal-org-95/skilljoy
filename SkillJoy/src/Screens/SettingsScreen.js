import React, { useContext } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { LanguageContext } from '../context/LanguageContext'; // استيراد LanguageContext

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useThemeMode();
  const navigation = useNavigation();

  // استخدم دالة تغيير اللغة من LanguageContext لضمان التزامن في التطبيق
  const { changeLanguage, language } = useContext(LanguageContext);

  const toggleLanguage = async () => {
    try {
      const newLang = language === 'ar' ? 'en' : 'ar';
      await changeLanguage(newLang);  // تغيير اللغة عبر السياق
    } catch (err) {
      Alert.alert(t('errorTitle'), err.message || 'Error changing language');
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert(t('errorTitle'), t('logoutError'));
    }
  };

  return (
    <View style={styles.container}>
      <List.Section title={t('generalSettings')}>
        <List.Item
          title={t('language')}
          description={language === 'ar' ? t('arabic') : t('english')}
          left={() => <List.Icon icon="translate" />}
          onPress={toggleLanguage}
        />
        <Divider />

        <List.Item
          title={t('darkMode')}
          left={() => <List.Icon icon="weather-night" />}
          right={() => (
            <Switch value={isDark} onValueChange={toggleTheme} />
          )}
        />
        <Divider />
      </List.Section>

      <List.Section title={t('account')}>
        <List.Item
          title={t('logout')}
          left={() => <List.Icon icon="logout" />}
          onPress={handleLogout}
        />
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    padding: 10,
  },
});
