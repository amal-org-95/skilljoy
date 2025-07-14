import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import SkillExchangeScreen from '../Screens/SkillExchangeScreen';  
import CreateSkillScreen from '../Screens/CreateSkillScreen';      

const Stack = createStackNavigator();

export default function SkillExchangeStack() {
  const { t, i18n } = useTranslation();

  return (
    <Stack.Navigator key={i18n.language}>
      <Stack.Screen 
        name="SkillExchangeMain" 
        component={SkillExchangeScreen} 
        options={{ title: t('Skill Exchange') }}
      />
      <Stack.Screen 
        name="Create Skill" 
        component={CreateSkillScreen} 
        options={{ title: t('Add New Skill') }}
      />
    </Stack.Navigator>
  );
}
