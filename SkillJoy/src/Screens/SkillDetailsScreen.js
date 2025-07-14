import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import StarRating from 'react-native-star-rating-widget';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next'; // استيراد الترجمة
import { LanguageContext } from '../context/LanguageContext';

export default function SkillDetailsScreen({ route }) {
const { t, i18n } = useTranslation();
    const { language } = useContext(LanguageContext);
  
  const { skillId } = route.params;
  const [skill, setSkill] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const userId = auth().currentUser.uid;


    useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);


      
  useEffect(() => {
    const fetchSkill = async () => {
      const doc = await firestore().collection('skills').doc(skillId).get();
      setSkill({ id: doc.id, ...doc.data() });
      setLoading(false);
    };

    const fetchUserRating = async () => {
      const ratingDoc = await firestore()
        .collection('skills')
        .doc(skillId)
        .collection('ratings')
        .doc(userId)
        .get();

      if (ratingDoc.exists) {
        setUserRating(ratingDoc.data().rating);
      }
    };

    fetchSkill();
    fetchUserRating();
  }, []);

  const handleRating = async (rating) => {
    setUserRating(rating);

    await firestore()
      .collection('skills')
      .doc(skillId)
      .collection('ratings')
      .doc(userId)
      .set({
        rating,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    const ratingsSnapshot = await firestore()
      .collection('skills')
      .doc(skillId)
      .collection('ratings')
      .get();

    const totalRatings = ratingsSnapshot.size;
    const sumRatings = ratingsSnapshot.docs.reduce(
      (sum, doc) => sum + doc.data().rating,
      0
    );
    const averageRating = sumRatings / totalRatings;

    await firestore().collection('skills').doc(skillId).update({
      averageRating,
      ratingsCount: totalRatings,
    });
  };

  if (loading || !skill)
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1a73e8" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{skill.name}</Text>
      <Text style={styles.description}>{skill.description}</Text>

      <Text style={styles.ratingText}>
        {t('averageRating')}: {skill.averageRating?.toFixed(1) || '0'} ⭐ (
        {skill.ratingsCount || 0} {t('ratings')})
      </Text>

      <StarRating
        rating={userRating}
        onChange={handleRating}
        starSize={32}
        color="#f5b50a"
        enableSwiping={true}
      />
    </View>
  );
}

SkillDetailsScreen.propTypes = {
  route: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  description: { fontSize: 16, marginBottom: 20 },
  ratingText: { fontSize: 16, marginBottom: 10 },
});
