import React, { useState, useEffect, useLayoutEffect,useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';  // استيراد الترجمة
import { LanguageContext } from '../context/LanguageContext';

function SkillExchangeScreen({ navigation }) {
const { t, i18n } = useTranslation();
    const { language } = useContext(LanguageContext);
  
  const [skills, setSkills] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  const currentUser = auth().currentUser;


    useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);


      
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('skills')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (querySnapshot) => {
          const skillsData = [];
          querySnapshot.forEach((doc) => {
            skillsData.push({ id: doc.id, ...doc.data() });
          });
          setSkills(skillsData);
          setLoading(false);
        },
        (error) => {
          console.log('Error fetching skills:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const filteredSkills = skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(searchText.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchText.toLowerCase()) ||
      skill.owner.toLowerCase().includes(searchText.toLowerCase())
  );

  const requestExchange = async (skill) => {
    if (!currentUser) {
      Alert.alert(t('errorTitle'), t('loginRequired'));
      return;
    }

    if (skill.ownerId === currentUser.uid) {
      Alert.alert(t('warningTitle'), t('cannotRequestOwnSkill'));
      return;
    }

    try {
      const existingRequest = await firestore()
        .collection('Exchange Requests')
        .where('skillId', '==', skill.id)
        .where('requesterId', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .get();

      if (!existingRequest.empty) {
        Alert.alert(t('warningTitle'), t('pendingRequestExists'));
        return;
      }

      await firestore().collection('Exchange Requests').add({
        skillId: skill.id,
        skillName: skill.name,
        skillOwnerId: skill.ownerId,
        skillOwnerName: skill.owner,
        requesterId: currentUser.uid,
        requesterName: currentUser.displayName || t('user'),
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert(t('successTitle'), t('requestSent'));
    } catch (error) {
      console.error('Error sending exchange request:', error);
      Alert.alert(t('errorTitle'), t('requestError'));
    }
  };

  const openChat = async (skill) => {
    if (!currentUser) {
      Alert.alert(t('errorTitle'), t('loginRequired'));
      return;
    }

    if (skill.ownerId === currentUser.uid) {
      Alert.alert(t('warningTitle'), t('cannotChatWithSelf'));
      return;
    }

    try {
      const chatId = [currentUser.uid, skill.ownerId].sort().join('_');

      const chatRef = firestore().collection('chats').doc(chatId);
      const chatDoc = await chatRef.get();
      if (!chatDoc.exists) {
        await chatRef.set({
          users: [currentUser.uid, skill.ownerId],
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      navigation.navigate('Chat', {
        chatId,
        otherUserName: skill.owner,
      });
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert(t('errorTitle'), t('chatError'));
    }
  };

  const renderSkillItem = ({ item }) => (
    <View style={styles.skillCard}>
      <Text style={styles.skillName}>{item.name}</Text>
      <Text style={styles.skillDesc}>{item.description}</Text>
      <Text style={styles.skillOwner}>{t('skill Owner')}: {item.owner}</Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.exchangeButton}
          onPress={() => requestExchange(item)}
        >
          <Text style={styles.buttonText}>{t('Request Exchange')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => openChat(item)}
        >
          <MaterialCommunityIcons name="chat" size={20} color="#fff" />
          <Text style={styles.buttonText}>{t('Chat')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('Skill Exchange')}</Text>

      <TextInput
        style={styles.searchInput}
        placeholder={t('search place holder')}
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={filteredSkills}
        keyExtractor={(item) => item.id}
        renderItem={renderSkillItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('No Matching Skills')}</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Create Skill')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

SkillExchangeScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1a73e8',
  },
  searchInput: {
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skillCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  skillName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b47a1',
  },
  skillDesc: {
    marginTop: 6,
    fontSize: 14,
    color: '#555',
  },
  skillOwner: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#777',
    fontSize: 13,
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  exchangeButton: {
    backgroundColor: '#ff7043',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#1a73e8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: '#1a73e8',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a73e8',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default SkillExchangeScreen;
