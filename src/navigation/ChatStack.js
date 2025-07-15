import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import ContactsScreen from '../Screens/ContactsScreen';
import ChatScreen from '../Screens/ChatScreen';
import VideoCallScreen from '../Screens/VideoCallScreen';

const Stack = createStackNavigator();

export default function ChatStack() {
  const { t, i18n } = useTranslation();

  return (
    <Stack.Navigator
      key={i18n.language}  // إعادة بناء الـ Stack عند تغيير اللغة
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Contacts" 
        component={ContactsScreen} 
        options={{ title: t('contacts') }} 
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ title: t('chat') }} 
      />
      <Stack.Screen 
        name="VideoCall" 
        component={VideoCallScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}
