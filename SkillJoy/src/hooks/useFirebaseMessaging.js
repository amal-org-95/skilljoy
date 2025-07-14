// src/hooks/useFirebaseMessaging.js

import { useEffect } from 'react';
import { getMessaging, requestPermission, getToken, onMessage, AuthorizationStatus } from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';

export default function useFirebaseMessaging() {
  useEffect(() => {
    const messaging = getMessaging(getApp());

    const askPermissionAndGetToken = async () => {
      const authStatus = await requestPermission(messaging);
      if (
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL
      ) {
        const token = await getToken(messaging);
        console.log('Device FCM Token:', token);
        // يمكنك حفظ التوكن في Firestore هنا
      }
    };

    askPermissionAndGetToken();

    const unsubscribe = onMessage(messaging, async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      // يمكنك عرض إشعار محلي هنا
    });

    return unsubscribe;
  }, []);
}
