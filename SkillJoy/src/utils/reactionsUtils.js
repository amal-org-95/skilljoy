import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

export async function toggleReaction(collectionPath, docId, emoji, t) {
  const userId = auth().currentUser.uid;
  const docRef = firestore().collection(collectionPath).doc(docId);
  const docSnap = await docRef.get();
  const data = docSnap.data() || {};

  const reactions = data.reactions || {};
  const usersReacted = reactions[emoji] || [];

  let updatedUsers;
  if (usersReacted.includes(userId)) {
    updatedUsers = usersReacted.filter(id => id !== userId);
  } else {
    updatedUsers = [...usersReacted, userId];
  }

  const updatedReactions = {
    ...reactions,
    [emoji]: updatedUsers,
  };

  if (updatedUsers.length === 0) {
    delete updatedReactions[emoji];
  }

  try {
    await docRef.update({ reactions: updatedReactions });
    Alert.alert(t('successTitle'), t('reactionUpdatedMessage'));
  } catch (error) {
    Alert.alert(t('errorTitle'), t('reactionUpdateError'));
  }
}
