import React, { useEffect, useState, useContext } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';  // استيراد السياق

import auth from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';

import LoginScreen from '../Screens/LoginScreen';
import RegisterScreen from '../Screens/RegisterScreen';
import HomeStack from './HomeStack';
import ProfileScreen from '../Screens/ProfileScreen';
import SettingsScreen from '../Screens/SettingsScreen';
import SkillExchangeScreen from '../Screens/SkillExchangeScreen';
import TopRatedSkillsScreen from '../Screens/TopRatedSkillsScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function SkillExchangeStack() {
  const { t, i18n } = useTranslation();
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Skill ExchangeMain"
        component={SkillExchangeScreen}
        options={{
          title: t('Skill Exchange'),
          headerStyle: { backgroundColor: '#2196f3' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen
        name="Create Skill"
        component={require('../Screens/CreateSkillScreen').default}
        options={{
          title: t('Add New Skill'),
          headerStyle: { backgroundColor: '#2196f3' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

function DrawerNavigator() {
  const { t, i18n } = useTranslation();
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <Drawer.Navigator
      key={language}  // استخدام اللغة من السياق لإعادة البناء عند التغيير
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
          drawerLabel: t('Home'),
        }}
      />
      <Drawer.Screen
        name="Skill Exchange"
        component={SkillExchangeStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="swap-horizontal" color={color} size={size} />
          ),
          drawerLabel: t('Skill Exchange'),
        }}
      />
      <Drawer.Screen
        name="Top Rated Skills"
        component={TopRatedSkillsScreen}
        options={{
          drawerLabel: t('Top Rated Skills'),
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="star-rate" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
          drawerLabel: t('Profile'),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
          drawerLabel: t('Settings'),
        }}
      />
    </Drawer.Navigator>
  );
}

function AuthStack() {
  const { i18n } = useTranslation();
  const { language } = useContext(LanguageContext);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <Stack.Navigator
      key={language} // هنا أيضاً مهم
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const { language } = useContext(LanguageContext); // جلب اللغة من السياق

  const app = getApp();
  const currentAuth = auth(app);

  useEffect(() => {
    const subscriber = currentAuth.onAuthStateChanged(userAuth => {
      setUser(userAuth);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  // المفتاح هنا هو language من LanguageContext
  return user ? <DrawerNavigator /> : <AuthStack />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
