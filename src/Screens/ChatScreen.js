import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PropTypes from 'prop-types';
import { LanguageContext } from '../context/LanguageContext';

import { useTranslation } from 'react-i18next';

const EMOJIS = ['👍', '❤', '😂', '😮', '😢', '👏'];

function ReactionPicker({ isVisible, onSelect, onClose }) {
  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.reactionPicker}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onSelect(emoji)}
              style={styles.emojiButton}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

ReactionPicker.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function ChatScreen({ navigation }) {
const { t, i18n } = useTranslation();
    const { language } = useContext(LanguageContext);
  
  const route = useRoute();
  const { chatId, otherUserName, otherUserId } = route.params || {};
  const currentUser = auth().currentUser;

  if (!chatId || !otherUserId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: 'red' }}>{t('incompleteChatData')}</Text>
      </View>
    );
  }

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);
      
  useLayoutEffect(() => {
    navigation.setOptions({
      title: otherUserName || t('chatTitle'),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('VideoCall', { callId: chatId, isCaller: true })}
          style={{ marginRight: 15 }}
        >
          <Icon name="video-call" size={28} color="#4a90e2" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserName, chatId, t]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(querySnapshot => {
        const msgs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
      });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const messageData = {
      text: input.trim(),
      senderId: currentUser.uid,
      timestamp: firestore.FieldValue.serverTimestamp(),
      reactions: {},
    };

    const chatRef = firestore().collection('chats').doc(chatId);

    await chatRef.collection('messages').add(messageData);

    await chatRef.set(
      {
        participants: [currentUser.uid, otherUserId],
        lastMessage: {
          text: messageData.text,
          timestamp: firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    setInput('');
  };

  const toggleReaction = async (messageId, emoji) => {
    const userId = currentUser.uid;
    const messageRef = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(messageId);

    const messageDoc = await messageRef.get();
    const reactions = messageDoc.data()?.reactions || {};

    const usersReacted = reactions[emoji] || [];
    let updatedUsers;

    if (usersReacted.includes(userId)) {
      updatedUsers = usersReacted.filter(id => id !== userId);
    } else {
      updatedUsers = [...usersReacted, userId];
    }

    const updatedReactions = {
      ...reactions,
      [emoji]: updatedUsers,
    };

    if (updatedUsers.length === 0) {
      delete updatedReactions[emoji];
    }

    await messageRef.update({ reactions: updatedReactions });

    setReactionPickerVisible(false);
    setSelectedMessageId(null);
  };

  const onMessageLongPress = (messageId) => {
    setSelectedMessageId(messageId);
    setReactionPickerVisible(true);
  };

  const renderReactions = (reactions) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    return (
      <View style={styles.reactionsContainer}>
        {Object.entries(reactions).map(([emoji, users]) => (
          <View key={emoji} style={styles.reactionBadge}>
            <Text>{emoji} {users.length}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isSender = item.senderId === currentUser.uid;

    return (
      <TouchableOpacity
        onLongPress={() => onMessageLongPress(item.id)}
        style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}
        activeOpacity={0.7}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>{item.text}</Text>
        {renderReactions(item.reactions)}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 10 }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder={t('typeMessagePlaceholder')}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Icon name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ReactionPicker
        isVisible={reactionPickerVisible}
        onSelect={(emoji) => toggleReaction(selectedMessageId, emoji)}
        onClose={() => {
          setReactionPickerVisible(false);
          setSelectedMessageId(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

ChatScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  messageContainer: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 15,
    marginVertical: 5,
  },
  sender: {
    backgroundColor: '#4a90e2',
    alignSelf: 'flex-end',
  },
  receiver: {
    backgroundColor: '#ccc',
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#eee',
    borderRadius: 20,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  reactionBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
  },
  emojiButton: {
    marginHorizontal: 8,
  },
});
