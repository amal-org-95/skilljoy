import React, { useState, useContext } from 'react';
import { View, StyleSheet, I18nManager } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Title,
  ActivityIndicator,
  Surface,
  Card,
} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
        const { language } = useContext(LanguageContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    if (newLang === 'ar') {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
    // ملاحظة: تحتاج لإعادة تشغيل التطبيق لتفعيل RTL بشكل كامل
  };

  const handleRegister = async () => {
    setError('');

    if (!email.trim() || !password) {
      setError(t('enterEmailAndPassword'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await auth().createUserWithEmailAndPassword(email.trim(), password);
      await firestore().collection('users').doc(result.user.uid).set({
        email: email.trim(),
        displayName: email.split('@')[0],
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.log('Register error:', err);
      if (err && err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setError(t('emailInUse'));
            break;
          case 'auth/invalid-email':
            setError(t('invalidEmail'));
            break;
          case 'auth/weak-password':
            setError(t('weakPassword'));
            break;
          default:
            setError(err.message);
        }
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError(t('unknownError'));
      }
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);

  return (
    <View style={styles.root}>
      <Surface style={styles.surface}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.langToggleContainer}>
              <Button mode="text" onPress={toggleLanguage} compact>
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </Button>
            </View>
            <Title style={styles.title}>SkillJoy</Title>

            <TextInput
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              mode="outlined"
              disabled={loading}
            />

            <TextInput
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon
                  icon={secureText ? 'eye-off' : 'eye'}
                  onPress={() => setSecureText(!secureText)}
                />
              }
              disabled={loading}
            />

            <TextInput
              label={t('confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureText}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon
                  icon={secureText ? 'eye-off' : 'eye'}
                  onPress={() => setSecureText(!secureText)}
                />
              }
              disabled={loading}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            {loading ? (
              <ActivityIndicator animating size="large" style={{ marginVertical: 20 }} />
            ) : (
              <Button mode="contained" onPress={handleRegister} style={styles.button}>
                {t('register')}
              </Button>
            )}
          </Card.Content>
        </Card>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    justifyContent: 'center',
    padding: 16,
  },
  surface: {
    elevation: 8,
    borderRadius: 10,
  },
  card: {
    borderRadius: 10,
    paddingVertical: 16,
  },
  langToggleContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});
