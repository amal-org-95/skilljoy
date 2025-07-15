import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import PropTypes from 'prop-types';

import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';

function CreateSkillScreen({ navigation }) {
const { t, i18n } = useTranslation();
    const { language } = useContext(LanguageContext);


  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    const currentUser = auth().currentUser;


    useEffect(() => {
          i18n.changeLanguage(language);
        }, [language]);
        
    if (!name.trim() || !description.trim()) {
      Alert.alert(t('Error'), t('Fill All Fields'));
      return;
    }

    if (!currentUser) {
      Alert.alert(t('Error'), t('Please Login First'));
      return;
    }

    const ownerId = currentUser.uid;
    const ownerName = currentUser.displayName || t('unknownUser');

    setLoading(true);

    try {
      await firestore().collection('Skills').add({
        name,
        description,
        ownerId,
        ownerName,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert(t('saved'), t('Skill Added Success'));
      navigation.goBack();
    } catch (error) {
      console.error('Firestore Error:', error.message);
      Alert.alert(t('error'), t('savingError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>{t('Add New Skill')}</Text>

        <TextInput
          placeholder={t('Skill Name')}
          style={[styles.input, { height: 60 }]}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          placeholder={t('Skill Description')}
          style={[styles.input, { height: 100 }]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={loading}>
          <Text style={styles.saveButtonText}>
            {loading ? t('saving') : t('Save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

CreateSkillScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f0fe' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default CreateSkillScreen;
