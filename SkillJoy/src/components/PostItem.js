import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Share,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Avatar,
  IconButton,
  Surface,
} from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import PropTypes from 'prop-types';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';

function formatDate(timestamp, t) {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return t('Now');
  if (diffMins < 60) return `${diffMins} ${t('Minutes Ago', { count: diffMins })}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ${t('Hours Ago', { count: diffHours })}`;
  return date.toLocaleDateString();
}

export default function PostItem({ post }) {
const { t, i18n } = useTranslation();
const { language } = useContext(LanguageContext); // ✅ لتحديث الترجمة عند تغيير اللغة

useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const user = auth().currentUser;
  const navigation = useNavigation();

  const commentInputRef = useRef(null);

  useEffect(() => {
    const unsubscribeComments = firestore()
      .collection('Posts')
      .doc(post.id)
      .collection('Comments')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const fetchedComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(fetchedComments);
      });

    const unsubscribeLikes = firestore()
      .collection('Posts')
      .doc(post.id)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          setLikes(data.likes || []);
          setLiked(data.likes?.includes(user.uid));
          setSaved(data.savedBy?.includes(user.uid));
        } else {
          setLikes([]);
          setLiked(false);
          setSaved(false);
        }
      });

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [post.id, user.uid]);

  const toggleLike = async () => {
    const postRef = firestore().collection('Posts').doc(post.id);

    if (liked) {
      await postRef.update({
        likes: firestore.FieldValue.arrayRemove(user.uid),
      });
    } else {
      await postRef.update({
        likes: firestore.FieldValue.arrayUnion(user.uid),
      });
    }
  };

  const toggleSave = async () => {
    const postRef = firestore().collection('Posts').doc(post.id);

    if (saved) {
      await postRef.update({
        savedBy: firestore.FieldValue.arrayRemove(user.uid),
      });
      setSaved(false);
    } else {
      await postRef.update({
        savedBy: firestore.FieldValue.arrayUnion(user.uid),
      });
      setSaved(true);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim().length === 0) return;

    await firestore()
      .collection('Posts')
      .doc(post.id)
      .collection('Comments')
      .add({
        text: newComment.trim(),
        userId: user?.uid || 'Unknown',
        displayName: user?.displayName || user?.email?.split('@')[0] || t('User'),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    setNewComment('');
    Keyboard.dismiss();
  };

  const confirmDelete = () => {
    Alert.alert(
      t('Confirm Delete'),
      t('Confirm DeleteMessage'),
      [
        { text: t('Cancel'), style: 'Cancel' },
        { text: t('Delete'), style: 'Destructive', onPress: deletePost },
      ],
      { cancelable: true }
    );
  };

  const deletePost = async () => {
    try {
      const commentsSnapshot = await firestore()
        .collection('Posts')
        .doc(post.id)
        .collection('Comments')
        .get();

      const batch = firestore().batch();
      commentsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      await firestore().collection('Posts').doc(post.id).delete();

      Alert.alert(t('PostDeleted'));
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert(t('Delete Error'));
    }
  };

  const onShare = async () => {
    try {
      const message = post.text + (post.imageUrl ? `\n${post.imageUrl}` : '');
      await Share.share({ message });
    } catch (error) {
      Alert.alert(t('Share Error'), error.message);
    }
  };

  const confirmDeleteComment = (commentId) => {
    Alert.alert(
      t('Confirm Delete Comment'),
      t('Confirm Delete CommentMessage'),
      [
        { text: t('Cancel'), style: 'Cancel' },
        {
          text: t('Delete'),
          style: 'Destructive',
          onPress: () => deleteComment(commentId),
        },
      ],
      { cancelable: true }
    );
  };

  const deleteComment = async (commentId) => {
    try {
      await firestore()
        .collection('Posts')
        .doc(post.id)
        .collection('Comments')
        .doc(commentId)
        .delete();
      Alert.alert(t('Comment Deleted'));
    } catch (error) {
      Alert.alert(t('Delete Error'));
    }
  };

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const saveEditedComment = async () => {
    if (editingCommentText.trim().length === 0) return;

    try {
      await firestore()
        .collection('Posts')
        .doc(post.id)
        .collection('Comments')
        .doc(editingCommentId)
        .update({
          text: editingCommentText.trim(),
        });
      setEditingCommentId(null);
      setEditingCommentText('');
      Alert.alert(t('Comment Edited'));
    } catch {
      Alert.alert(t('Edit Error'));
    }
  };

  const renderCommentItem = ({ item }) => {
    const isCommentOwner = user?.uid === item.userId;

    return (
      <View style={styles.comment}>
        <Avatar.Text
          size={30}
          label={item.displayName ? item.displayName[0].toUpperCase() : '?'}
        />
        <View style={styles.commentTextContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.commentUser}>{item.displayName || t('user')}</Text>

            {isCommentOwner && editingCommentId !== item.id && (
              <View style={{ flexDirection: 'row' }}>
                <Button
                  compact
                  mode="text"
                  onPress={() => startEditComment(item)}
                  style={{ marginRight: 5 }}
                >
                  {t('edit')}
                </Button>
                <Button
                  compact
                  mode="text"
                  textColor="red"
                  onPress={() => confirmDeleteComment(item.id)}
                >
                  {t('delete')}
                </Button>
              </View>
            )}
          </View>

          {editingCommentId === item.id ? (
            <>
              <TextInput
                value={editingCommentText}
                onChangeText={setEditingCommentText}
                mode="outlined"
                multiline
                style={styles.editInput}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Button onPress={cancelEditComment} style={{ marginRight: 8 }}>
                  {t('cancel')}
                </Button>
                <Button mode="contained" onPress={saveEditedComment}>
                  {t('save')}
                </Button>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.commentText}>{item.text}</Text>
              <Text style={styles.commentDate}>{formatDate(item.createdAt, t)}</Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={40}
          label={post.author ? post.author[0].toUpperCase() : 'م'}
        />
        <View style={styles.headerText}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile', { userId: post.userId })}
          >
            <Text style={styles.author}>{post.author || t('user')}</Text>
          </TouchableOpacity>
          <Text style={styles.postDate}>{formatDate(post.createdAt, t)}</Text>
        </View>
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      {post.imageUrl ? (
        <TouchableOpacity activeOpacity={0.8}>
          <Avatar.Image
            size={300}
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
          />
        </TouchableOpacity>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleLike}
          accessibilityLabel={t('likeButton')}
        >
          <IconButton
            icon={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? '#e91e63' : '#1976d2'}
          />
          <Text style={[styles.actionText, liked && { color: '#e91e63' }]}>
            {likes.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setShowComments(!showComments);
            if (!showComments) {
              setTimeout(() => {
                commentInputRef.current?.focus();
              }, 300);
            }
          }}
          accessibilityLabel={t('commentsButton')}
        >
          <IconButton icon="comment-outline" size={24} color="#fbc02d" />
          <Text style={styles.actionText}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleSave}
          accessibilityLabel={t('savePostButton')}
        >
          <IconButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={saved ? '#fbc02d' : '#1976d2'}
          />
          <Text style={[styles.actionText, saved && { color: '#fbc02d' }]}>
            {saved ? t('saved') : t('save')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onShare}
          accessibilityLabel={t('shareButton')}
        >
          <IconButton icon="share-variant" size={24} color="#1976d2" />
          <Text style={styles.actionText}>{t('share')}</Text>
        </TouchableOpacity>
      </View>

      {user?.uid === post.userId && (
        <Button
          mode="contained"
          onPress={confirmDelete}
          style={[styles.button, { backgroundColor: '#fbc02d' }]}
        >
          {t('deletePost')}
        </Button>
      )}

      {showComments && (
        <>
          <Text style={styles.commentsTitle}>{t('comments')}:</Text>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderCommentItem}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 300 }}
          />

          <TextInput
            ref={commentInputRef}
            label={t('addComment')}
            value={newComment}
            onChangeText={setNewComment}
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleAddComment} style={styles.button}>
            {t('addCommentBtn')}
          </Button>
        </>
      )}
    </Surface>
  );
}

PostItem.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string,
    imageUrl: PropTypes.string,
    userId: PropTypes.string,
    author: PropTypes.string,
    createdAt: PropTypes.object,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    marginLeft: 10,
  },
  author: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1976d2',
  },
  postDate: {
    fontSize: 12,
    color: '#1976d2',
    marginTop: 2,
  },
  postText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
    color: '#1976d2',
  },
  postImage: {
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
    width: '100%',
    height: 300,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontWeight: 'bold',
    color: '#1976d2',
    fontSize: 14,
    marginLeft: 4,
  },
  commentsTitle: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    color: '#1976d2',
  },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#1976d2',
  },
  commentText: {
    marginBottom: 4,
    color: '#1976d2',
  },
  commentDate: {
    fontSize: 10,
    color: '#fbc02d',
  },
  input: {
    marginTop: 10,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#fbc02d',
  },
  editInput: {
    backgroundColor: '#fff',
    marginBottom: 6,
  },
});
