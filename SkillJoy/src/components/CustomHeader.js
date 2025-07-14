import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';

export default function CustomHeader({ navigation }) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {/* زر القائمة */}
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.iconButton}>
          <MaterialCommunityIcons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <MaterialCommunityIcons name="home" size={22} color="#ffeb3b" />
        <Text style={styles.title}>SkillJoy</Text>
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ChatStack', { screen: 'Chat' })}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="magnify" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SkillExchange')}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="handshake" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('ChatStack', { screen: 'Chat' })}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="chat-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

CustomHeader.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    paddingHorizontal: 10,
    height: 56,
    paddingTop: 8,
    paddingBottom: 8,
    elevation: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 6,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
  },
});
