import React, { useContext } from 'react';
import { Alert } from 'react-native';
import i18n from 'i18next';
import { LanguageContext } from '../context/LanguageContext';

// Firebase (modular API)
import { getMessaging, requestPermission, getToken, onMessage, onNotificationOpenedApp, getInitialNotification } from '@react-native-firebase/messaging';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, collection, doc, updateDoc, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';

// التهيئة
const messaging = getMessaging(getApp());
const auth = getAuth(getApp());
const firestore = getFirestore(getApp());

// طلب صلاحية الإشعارات
export async function requestUserPermission() {
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    await getFcmToken();
  } else {
    Alert.alert(i18n.t('notificationPermissionDenied'));
  }
}

// الحصول على FCM Token وتخزينه في Firestore
async function getFcmToken() {
  const fcmToken = await getToken(messaging);
  if (fcmToken) {
    console.log('FCM Token:', fcmToken);

    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(firestore, 'users', user.uid), {
          fcmToken: fcmToken,
        });
        console.log(i18n.t('fcmTokenSaved'));
      } catch (error) {
        console.log(i18n.t('fcmTokenSaveFailed'), error);
      }
    }
  } else {
    console.log(i18n.t('fcmTokenFetchFailed'));
  }
}

// الاستماع للإشعارات ومعالجة التنقل وتخزين الإشعار
export function notificationListener(navigation) {
  // التطبيق في الواجهة
  onMessage(messaging, async remoteMessage => {
    Alert.alert(i18n.t('newNotification'), remoteMessage.notification?.body || '');

    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(firestore, 'notifications'), {
        userId: user.uid,
        title: remoteMessage.notification?.title || '',
        body: remoteMessage.notification?.body || '',
        isRead: false,
        timestamp: serverTimestamp(),
      });
    }
  });

  // فتح التطبيق من الخلفية
  onNotificationOpenedApp(messaging, async remoteMessage => {
    console.log(i18n.t('appOpenedFromBackground'), remoteMessage.notification);

    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(firestore, 'notifications'), {
        userId: user.uid,
        title: remoteMessage.notification?.title || '',
        body: remoteMessage.notification?.body || '',
        isRead: false,
        timestamp: serverTimestamp(),
      });
    }

    if (navigation) {
      navigation.navigate('Notifications');
    }
  });

  // فتح التطبيق من الإغلاق الكامل
  getInitialNotification(messaging).then(async remoteMessage => {
    if (remoteMessage) {
      console.log(i18n.t('appOpenedFromQuit'), remoteMessage.notification);

      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(firestore, 'notifications'), {
          userId: user.uid,
          title: remoteMessage.notification?.title || '',
          body: remoteMessage.notification?.body || '',
          isRead: false,
          timestamp: serverTimestamp(),
        });
      }

      if (navigation) {
        navigation.navigate('Notifications');
      }
    }
  });
}
