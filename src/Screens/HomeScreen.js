import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Surface, Text, Title } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import PostItem from '../components/PostItem';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from '@react-native-firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { language } = useContext(LanguageContext);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);
  const user = auth().currentUser;
  const navigation = useNavigation();

  const db = getFirestore(getApp());
  const storage = getStorage(getApp());

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, snapshot => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetchedPosts);
    });

    return unsubscribe;
  }, [language]);

  const pickPostImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (!result.didCancel && result.assets && result.assets[0].uri) {
      setPostImage(result.assets[0].uri);
    }
  };

  const uploadPostImage = async () => {
    if (!postImage) return null;
    const filename = `posts/${Date.now()}.jpg`;
    const imageRef = ref(storage, filename);
    const response = await fetch(postImage);
    const blob = await response.blob();
    await uploadBytes(imageRef, blob);
    const url = await getDownloadURL(imageRef);
    return url;
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim() && !postImage) return;
    const imageUrl = await uploadPostImage();
    await addDoc(collection(db, 'posts'), {
      text: newPost.trim(),
      imageUrl: imageUrl || '',
      userId: user.uid,
      author: user.displayName || t('User'),
      likes: [],
      createdAt: serverTimestamp(),
    });
    setNewPost('');
    setPostImage(null);
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      t('Confirm Delete'),
      t('Confirm DeleteMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'posts', postId));
              Alert.alert(t('Deleted'), t('Post Deleted'));
            } catch (error) {
              Alert.alert(t('Error'), t('DeleteError'));
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Surface style={styles.surface}>
        <Title style={styles.title}>SkillJoy</Title>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { userId: user.uid })}
          style={{ alignSelf: 'center', marginBottom: 12 }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#6200ee' }}>
            {user.displayName || t('user')}
          </Text>
        </TouchableOpacity>

        <TextInput
          label={t('Write Post')}
          value={newPost}
          onChangeText={setNewPost}
          mode="outlined"
          multiline
          style={styles.input}
          right={
            postImage ? (
              <TextInput.Icon
                icon="close-circle"
                onPress={() => setPostImage(null)}
              />
            ) : null
          }
        />

        <View style={styles.buttonsRow}>
          <Button
            mode="outlined"
            onPress={pickPostImage}
            icon="image"
            style={styles.button}
          >
            {t('Choose Image')}
          </Button>

          <Button
            mode="contained"
            onPress={handlePostSubmit}
            style={styles.button}
            disabled={!newPost.trim() && !postImage}
          >
            {t('Publish')}
          </Button>
        </View>

        {postImage && (
          <Image source={{ uri: postImage }} style={styles.previewImage} />
        )}
      </Surface>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            onDelete={() => handleDeletePost(item.id)}
            currentUserId={user.uid}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    padding: 16,
  },
  surface: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  previewImage: {
    marginTop: 10,
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  list: {
    flex: 1,
    marginTop: 10,
  },
});
