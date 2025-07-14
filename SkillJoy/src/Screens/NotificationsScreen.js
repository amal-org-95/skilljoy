import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';  // استيراد الترجمة
import { LanguageContext } from '../context/LanguageContext';

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
      const { language } = useContext(LanguageContext);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);


  
    useEffect(() => {
          i18n.changeLanguage(language);
        }, [language]);


  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('notifications')
      .where('userId', '==', user.uid)
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        if (!snapshot || !snapshot.docs) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        const list = [];
        snapshot.docs.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(list);
        setLoading(false);
      }, error => {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id, isRead) => {
    if (isRead) return; // إذا كانت مقروءة لا تفعل شيء
    try {
      await firestore().collection('notifications').doc(id).update({ isRead: true });
    } catch (error) {
      console.log(t('Error Updating Notification'), error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.isRead ? styles.read : styles.unread]}
      onPress={() => markAsRead(item.id, item.isRead)}
    >
      <Text style={styles.title}>{item.title || t('No Title')}</Text>
      <Text style={styles.body}>{item.body || t('No Content')}</Text>
      <Text style={styles.date}>
        {item.timestamp?.toDate().toLocaleString() || ''}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.center}>
        <Text>{t('No Notifications')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 10 }}
    />
  );
}

const styles = StyleSheet.create({
  notificationItem: {
    padding: 15,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  unread: {
    borderLeftWidth: 5,
    borderLeftColor: '#2196f3',
  },
  read: {
    opacity: 0.6,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  body: {
    marginTop: 5,
    fontSize: 14,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: 'gray',
    textAlign: 'right',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
