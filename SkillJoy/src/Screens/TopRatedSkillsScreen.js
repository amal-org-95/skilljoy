import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';  // استيراد الترجمة
import { LanguageContext } from '../context/LanguageContext';

export default function TopRatedSkillsScreen() {
const { t, i18n } = useTranslation();
      const { language } = useContext(LanguageContext);
  
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();


    useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);


      
  useEffect(() => {
    const fetchTopSkills = async () => {
      try {
        const snapshot = await firestore()
          .collection('skills')
          .orderBy('Average Rating', 'desc')
          .limit(20)
          .get();

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSkills(data);
      } catch (error) {
        console.error('error fetching top rated skills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSkills();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌟 {t('Top Skills Title')}</Text>
      <FlatList
        data={skills}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.skillItem}
            onPress={() => navigation.navigate('Skill Details', { skillId: item.id })}
          >
            <Text style={styles.name}>⭐ {item.name}</Text>
            <Text style={styles.meta}>
              ⭐ {item.averageRating?.toFixed(1) || 0} | 🗳️ {item.ratingsCount || 0} {t('ratings')}
            </Text>
            <Text style={styles.owner}>👤 {item.ownerName || t('No Name')}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('No Skills Found')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
      marginTop: 20, // ⬅️ أضف هذا السطر لإنزال العنوان

    marginBottom: 16,
    textAlign: 'center',
    color: '#1a73e8',
  },
  skillItem: {
    padding: 16,
    backgroundColor: '#f0f4ff',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  meta: { fontSize: 14, color: '#666', marginTop: 4 },
  owner: { fontSize: 13, color: '#999', marginTop: 2 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});
