import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import PropTypes from 'prop-types';
import { DrawerActions } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';

function RequestsScreen({ navigation }) {
const { t, i18n } = useTranslation();
const { language } = useContext(LanguageContext);

  const currentUser = auth().currentUser;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);

      
  // زر الهيدر: القائمة أو الرجوع بدون زر تغيير اللغة
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.dispatch(DrawerActions.openDrawer());
            }
          }}
          style={{ marginLeft: 15 }}
        >
          <MaterialCommunityIcons
            name={navigation.canGoBack() ? 'arrow-right' : 'menu'}
            size={28}
            color="#000"
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('exchangeRequests')
      .where('skillOwnerId', '==', currentUser.uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        querySnapshot => {
          const reqs = [];
          querySnapshot.forEach(doc => {
            reqs.push({ id: doc.id, ...doc.data() });
          });
          setRequests(reqs);
          setLoading(false);
        },
        error => {
          console.error('Error fetching exchange requests:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [currentUser.uid]);

  const acceptRequest = async request => {
    try {
      await firestore().collection('exchangeRequests').doc(request.id).update({
        status: 'accepted',
        respondedAt: firestore.FieldValue.serverTimestamp(),
      });

      const chatId = [request.requesterId, request.skillOwnerId].sort().join('_');
      const chatRef = firestore().collection('chats').doc(chatId);
      const chatDoc = await chatRef.get();

      if (!chatDoc.exists) {
        await chatRef.set({
          users: [request.requesterId, request.skillOwnerId],
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      Alert.alert(t('acceptedTitle'), t('acceptedMessage'));

      navigation.navigate('ChatStack', {
        screen: 'Chat',
        params: { chatId, otherUserName: request.requesterName },
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert(t('errorTitle'), t('acceptErrorMessage'));
    }
  };

  const rejectRequest = async request => {
    try {
      await firestore().collection('exchangeRequests').doc(request.id).update({
        status: 'rejected',
        respondedAt: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert(t('rejectedTitle'), t('rejectedMessage'));
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert(t('errorTitle'), t('rejectErrorMessage'));
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <Text style={styles.skillName}>{t('skillLabel')}: {item.skillName}</Text>
      <Text>{t('requesterLabel')}: {item.requesterName}</Text>
      <Text>{t('statusLabel')}: {t(item.status)}</Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptRequest(item)}
        >
          <Text style={styles.buttonText}>{t('accept')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => rejectRequest(item)}
        >
          <Text style={styles.buttonText}>{t('reject')}</Text>
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

  if (requests.length === 0) {
    return (
      <View
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <Text style={{ fontSize: 16, color: '#555' }}>{t('noRequests')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('requestsTitle')}</Text>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderRequestItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

RequestsScreen.propTypes = {
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
  requestCard: {
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
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default RequestsScreen;
