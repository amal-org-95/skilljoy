import React from 'react';
import PropTypes from 'prop-types';
import { Modal, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';  // استيراد الترجمة

const EMOJIS = ['👍', '❤', '😂', '😮', '😢', '👏'];

export default function ReactionPicker({ visible, onSelect, onClose }) {
  const { t } = useTranslation();

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.container}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onSelect(emoji)}
              style={styles.emojiButton}
            >
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}

          {/* زر إغلاق */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

ReactionPicker.propTypes = {
  visible: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
  },
  emojiButton: {
    marginHorizontal: 10,
  },
  closeButton: {
    marginLeft: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#333',
  },
});
