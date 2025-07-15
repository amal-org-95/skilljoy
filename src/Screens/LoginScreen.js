import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert, I18nManager } from 'react-native';
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
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native'; // تم إضافة هذا
import '../i18n/i18n';
import { LanguageContext } from '../context/LanguageContext';

GoogleSignin.configure({
  webClientId: '225443233253-apc5etqtik4gtevet9tdtc3np9fgebov.apps.googleusercontent.com',
});

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
      const { language } = useContext(LanguageContext);
  
  const navigation = useNavigation(); // تم إضافة هذا

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      const doc = await firestore().collection('users').doc(userCredential.user.uid).get();
      if (!doc.exists) {
        await firestore().collection('users').doc(userCredential.user.uid).set({
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || '',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (err) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(t('cancel'));
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(t('error'), 'Play Services not available or outdated');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

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

            {!!error && <Text style={styles.error}>{error}</Text>}

            {loading ? (
              <ActivityIndicator animating size="large" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <Button mode="contained" onPress={handleSignIn} style={styles.button}>
                  {t('login')}
                </Button>

                {/* زر التنقل لشاشة التسجيل */}
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Register')}
                  style={styles.button}
                >
                  {t('Register')}
                </Button>

                <Button onPress={handleGoogleSignIn} style={styles.button}>
                  {t('googleSignIn')}
                </Button>
              </>
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
