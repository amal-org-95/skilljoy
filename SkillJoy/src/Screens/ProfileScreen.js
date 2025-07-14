import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  I18nManager,
} from 'react-native';
import { Button, Text, Title, Card } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';  // استيراد الترجمة
import { LanguageContext } from '../context/LanguageContext';

function ProfileScreen({ route }) {
  const { t, i18n } = useTranslation();
        const { language } = useContext(LanguageContext);
  

  const currentUser = auth().currentUser;
  const userId = route.params?.userId || currentUser?.uid;

  const [imageUri, setImageUri] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const isCurrentUser = userId === currentUser?.uid;

  useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);
      
  useEffect(() => {
    if (!userId) return;

    const fetchUserInfo = async () => {
      try {
        const doc = await firestore().collection('users').doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          setPhotoURL(data.photoURL || null);
          setDisplayName(data.displayName || t('user'));
          setNewName(data.displayName || '');
        } else {
          setDisplayName(t('user'));
          setPhotoURL(null);
        }
      } catch (error) {
        console.error('Error fetching user info:', error.message);
      }
    };

    const unsubscribe = firestore()
      .collection('Posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        if (!snapshot || !snapshot.docs) {
          setUserPosts([]);
          return;
        }
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserPosts(posts);
      });

    fetchUserInfo();

    return () => unsubscribe();
  }, [userId]);

  const pickImage = async () => {
    if (!isCurrentUser) return;

    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (!result.didCancel && result.assets && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!isCurrentUser) return;

    setLoading(true);
    try {
      const filename = `profile/${userId}.jpg`;
      const reference = storage().ref(filename);
      await reference.putFile(uri);
      const url = await reference.getDownloadURL();

      await firestore().collection('users').doc(userId).set(
        { photoURL: url },
        { merge: true }
      );

      if (currentUser && userId === currentUser.uid) {
        await currentUser.updateProfile({ photoURL: url });
      }

      setPhotoURL(url);
      Alert.alert(t('Done'), t('Profile Pic Updated'));
    } catch (error) {
      Alert.alert(t('Error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayName = async () => {
    if (!newName.trim()) {
      Alert.alert(t('Error'), t('Enter Valid Name'));
      return;
    }

    try {
      await firestore().collection('users').doc(userId).set(
        { displayName: newName },
        { merge: true }
      );

      if (currentUser && userId === currentUser.uid) {
        await currentUser.updateProfile({
          displayName: newName || currentUser.displayName || currentUser.email,
        });
      }

      setDisplayName(newName);
      setEditingName(false);
      Alert.alert(t('Done'), t('Name Updated'));
    } catch (error) {
      Alert.alert(t('Error'), error.message);
    }
  };

  const renderPost = ({ item }) => (
    <Card style={styles.postCard}>
      {item.imageUrl ? <Card.Cover source={{ uri: item.imageUrl }} /> : null}
      <Card.Content>
        <Text style={styles.postText}>{item.text}</Text>
        {item.createdAt && (
          <Text style={styles.postDate}>
            {new Date(item.createdAt.seconds * 1000).toLocaleDateString(i18n.language)}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Title style={styles.title}>{t('Profile')}</Title>

      {loading && <ActivityIndicator size="large" />}

      <Image
        source={
          imageUri
            ? { uri: imageUri }
            : photoURL
            ? { uri: photoURL }
            : require('../../assets/default-avatar.png')
        }
        style={styles.image}
      />

      <Text style={styles.name}>{t('Name')}: {displayName || t('User')}</Text>

      {isCurrentUser && (
        <Text style={styles.email}>{t('Email')}: {currentUser?.email}</Text>
      )}

      {isCurrentUser && (
        <>
          <Button
            mode="outlined"
            onPress={() => setEditingName(true)}
            style={styles.button}
          >
            {t('Edit Name')}
          </Button>

          <Button mode="contained" onPress={pickImage} style={styles.button}>
            {t('Choose Profile Pic')}
          </Button>

          <Button
            mode="outlined"
            onPress={() => auth().signOut()}
            style={styles.button}
          >
            {t('Sign Out')}
          </Button>
        </>
      )}

      <Title style={styles.subtitle}>{t('My Posts')}</Title>

      {userPosts.length > 0 ? (
        <FlatList
          data={userPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          {t('No Posts Yet')}
        </Text>
      )}

      {isCurrentUser && (
        <Modal visible={editingName} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ marginBottom: 10, fontSize: 16 }}>
                {t('Enter New Name')}
              </Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder={t('New Name')}
                style={styles.input}
              />
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Button onPress={updateDisplayName}>{t('save')}</Button>
                <Button onPress={() => setEditingName(false)} textColor="#f44336">
                  {t('cancel')}
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

ProfileScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      userId: PropTypes.string,
    }),
  }),
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#f5f5f5ff',
  },
  title: {
    fontSize: 24,
      marginTop: 20, // ⬅️ أضف هذا السطر لإنزال العنوان

    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 20,
    fontSize: 20,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    marginVertical: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  image: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignSelf: 'center',
    marginVertical: 16,
    backgroundColor: '#eee',
  },
  button: {
    marginVertical: 6,
    alignSelf: 'center',
    width: '80%',
  },
  postCard: {
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  postText: {
    fontSize: 16,
    marginTop: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
    marginBottom: 20,
  },
});
