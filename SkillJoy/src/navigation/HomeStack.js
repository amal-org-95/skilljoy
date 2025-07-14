import React, { useEffect, useState, useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, View, Text, BackHandler, I18nManager } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { useNavigation } from '@react-navigation/native';

import ChatStack from './ChatStack';
import SkillDetailsScreen from '../Screens/SkillDetailsScreen';
import HomeScreen from '../Screens/HomeScreen';
import SkillExchangeScreen from '../Screens/SkillExchangeScreen';
import CreateSkillScreen from '../Screens/CreateSkillScreen';
import CreatePostScreen from '../navigation/CreatePostScreen';
import NotificationsScreen from '../Screens/NotificationsScreen';
import RequestsScreen from '../Screens/RequestsScreen';
import TopRatedSkillsScreen from '../Screens/TopRatedSkillsScreen';
import { LanguageContext } from '../context/LanguageContext';
import { notificationListener } from '../notifications/notifications';
import { useTranslation } from 'react-i18next';

const Stack = createStackNavigator();

function HomeScreenWrapper() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const { language } = useContext(LanguageContext);

  // عند تغير اللغة في السياق، نحدث i18n ونضبط RTL
  useEffect(() => {
    i18n.changeLanguage(language);
    I18nManager.forceRTL(language === 'ar');
  }, [language, i18n]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      BackHandler.exitApp();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    notificationListener(navigation);
  }, [navigation]);

  useEffect(() => {
    const user = getAuth(getApp()).currentUser;
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = firestore()
      .collection('notifications')
      .where('userId', '==', user.uid)
      .where('isRead', '==', false)
      .onSnapshot(
        snapshot => {
          setUnreadCount(snapshot?.size || 0);
        },
        error => {
          console.error('Error fetching notifications:', error);
          setUnreadCount(0);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: t('SkillJoy'),
      headerStyle: { backgroundColor: '#2196f3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
          <MaterialCommunityIcons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Requests')} style={{ marginHorizontal: 10 }}>
            <MaterialCommunityIcons name="account-switch" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ChatStack')} style={{ marginHorizontal: 10 }}>
            <MaterialCommunityIcons name="chat-outline" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ marginHorizontal: 10 }}>
            <View>
              <MaterialCommunityIcons name="bell-outline" size={26} color="#fff" />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: 'red',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, unreadCount, t]);

  return <HomeScreen />;
}

export default function HomeStack() {
  const { t } = useTranslation();
  const { language } = useContext(LanguageContext);

  // المفتاح يعتمد على اللغة، لإجبار إعادة البناء عند التغيير
  return (
    <Stack.Navigator key={language}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreenWrapper}
        options={{ headerShown: true, title: t('SkillJoy') }}
      />

      <Stack.Screen
        name="Top Rated Skills"
        component={TopRatedSkillsScreen}
        options={{ title: t('Top Rated Skills') }}
      />

      <Stack.Screen
        name="Skill Exchange"
        component={SkillExchangeScreen}
        options={{
          title: t('Skill Exchange'),
          headerStyle: { backgroundColor: '#2196f3' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => {
            const navigation = useNavigation();
            return (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
                <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
              </TouchableOpacity>
            );
          },
        }}
      />

      <Stack.Screen
        name="ChatStack"
        component={ChatStack}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Create Skill"
        component={CreateSkillScreen}
        options={{
          title: t('Add New Skill'),
          headerStyle: { backgroundColor: '#2196f3' },
          headerTintColor: '#fff',
        }}
      />

      <Stack.Screen
        name="SkillDetails"
        component={SkillDetailsScreen}
        options={{ title: t('skillDetails') }}
      />

      <Stack.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          title: t('Requests'),
          headerStyle: { backgroundColor: '#2196f3' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => {
            const navigation = useNavigation();
            return (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
                <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
              </TouchableOpacity>
            );
          },
        }}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: t('Notifications'),
          headerStyle: { backgroundColor: '#2196f3' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <Stack.Screen
        name="Create Post"
        component={CreatePostScreen}
        options={{
          title: t('Create Post'),
          headerStyle: { backgroundColor: '#2196f3' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}
