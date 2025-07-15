import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { TextInput, Avatar, List } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import PropTypes from 'prop-types';

import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';

export default function ContactsScreen({ navigation }) {
const { t, i18n } = useTranslation();
      const { language } = useContext(LanguageContext);
  
  const currentUser = auth().currentUser;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [recentChats, setRecentChats] = useState([]);


  useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);
      
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot(
        snapshot => {
          if (!snapshot || !snapshot.docs) return;
          const userList = snapshot.docs
            .map(doc => ({ uid: doc.id, ...doc.data() }))
            .filter(user => user.uid !== currentUser.uid);
          setUsers(userList);
        },
        error => {
          console.error('Error loading users:', error);
        }
      );

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    const onlineRef = database().ref('/online');

    const handleOnlineStatus = snapshot => {
      const onlineUsers = snapshot.val() || {};
      setOnlineStatuses(onlineUsers);
    };

    onlineRef.on('value', handleOnlineStatus);
    return () => onlineRef.off('value', handleOnlineStatus);
  }, []);

  useEffect(() => {
    const filtered = users
      .map(user => ({
        ...user,
        online: onlineStatuses[user.uid] || false,
      }))
      .filter(user =>
        (user.name || user.email)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );

    setFilteredUsers(filtered);
  }, [searchQuery, users, onlineStatuses]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', currentUser.uid)
      .orderBy('lastMessage.timestamp', 'desc')
      .onSnapshot(snapshot => {
        if (!snapshot || !snapshot.docs) return;
        const chats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentChats(chats);
      });

    return unsubscribe;
  }, [currentUser]);

  const getChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  const openChat = (chatId, otherUser) => {
    navigation.navigate('Chat', {
      chatId,
      otherUserName: otherUser.name || otherUser.email,
      otherUserId: otherUser.uid,
    });
  };

  const renderUserItem = ({ item }) => (
    <List.Item
      title={item.name || item.email}
      description={item.online ? t('online') : t('offline')}
      left={() => (
        <Avatar.Text
          label={(item.name || item.email || 'U')[0].toUpperCase()}
          style={{
            backgroundColor: item.online ? '#4c63afff' : '#ccc',
          }}
        />
      )}
      onPress={() => openChat(getChatId(currentUser.uid, item.uid), item)}
    />
  );

  const renderRecentChatItem = ({ item }) => {
    const otherUserId = item.participants.find(uid => uid !== currentUser.uid);
    const otherUser = users.find(u => u.uid === otherUserId);
    if (!otherUser) return null;

    return (
      <List.Item
        title={otherUser.name || otherUser.email}
        description={item.lastMessage?.text || t('No Messages')}
        left={() => (
          <Avatar.Text
            label={(otherUser.name || otherUser.email || 'U')[0].toUpperCase()}
            style={{
              backgroundColor: onlineStatuses[otherUser.uid] ? '#4caf50' : '#ccc',
            }}
          />
        )}
        onPress={() => openChat(item.id, otherUser)}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        label={t('Search User')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        mode="outlined"
        style={styles.searchInput}
        
      />
      <FlatList
        data={searchQuery ? filteredUsers : recentChats}
        keyExtractor={item => (searchQuery ? item.uid : item.id)}
        renderItem={searchQuery ? renderUserItem : renderRecentChatItem}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

ContactsScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  searchInput: {
      marginTop: 40, // ⬅️ أضف هذا السطر لإنزال العنوان

    margin: 10,
  },
});
