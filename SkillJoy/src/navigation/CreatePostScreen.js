import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';

import PropTypes from 'prop-types';

// ترجمة ولغة
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';

// Firebase Modular SDK (Firestore, Auth)
import { getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// مكتبة التخزين (react-native-firebase) لأن Web SDK غير مدعوم للرفع من URI في React Native
import storage from '@react-native-firebase/storage';

export default function CreatePostScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (!result.didCancel && result.assets && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const auth = getAuth(getApp());
    const user = auth.currentUser;
    if (!user) throw new Error(t('User Not LoggedIn'));

    const filename = `posts/${user.uid}/${Date.now()}.jpg`;
    const reference = storage().ref(filename);
    await reference.putFile(uri);
    const url = await reference.getDownloadURL();
    return url;
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert(t('Error'), t('Enter Post Text'));
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
      }

      const firestore = getFirestore(getApp());
      const auth = getAuth(getApp());
      const user = auth.currentUser;
      if (!user) throw new Error(t('User Not LoggedIn'));

      await addDoc(collection(firestore, 'Posts'), {
        text: text.trim(),
        imageUrl,
        createdAt: serverTimestamp(),
        userId: user.uid,
        author: user.displayName || user.email || t('User'),
        likes: [],
        savedBy: [],
      });

      Alert.alert(t('Success'), t('post Published Successfully'));
      setText('');
      setImageUri(null);
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('Error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={t('Post Text')}
        value={text}
        onChangeText={setText}
        multiline
        style={{ marginBottom: 20 }}
      />
      <Button mode="outlined" onPress={pickImage} style={{ marginBottom: 20 }}>
        {imageUri ? t('Change Image') : t('Pick Image Optional')}
      </Button>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button mode="contained" onPress={handleSubmit}>
          {t('Publish Post')}
        </Button>
      )}
    </View>
  );
}

CreatePostScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
});
