import React, { useState, useEffect, useRef,useContext } from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native';
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, RTCView, mediaDevices } from 'react-native-webrtc';
import firestore from '@react-native-firebase/firestore';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';  // استيراد
import { LanguageContext } from '../context/LanguageContext';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export default function VideoCallScreen({ route, navigation }) {
const { t, i18n } = useTranslation();
const { language } = useContext(LanguageContext);
  
  const { callId, isCaller } = route.params;
  const pc = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);

  const [localVideoURL, setLocalVideoURL] = useState(null);
  const [remoteVideoURL, setRemoteVideoURL] = useState(null);


    useEffect(() => {
        i18n.changeLanguage(language);
      }, [language]);


      
  useEffect(() => {
    pc.current = new RTCPeerConnection(configuration);

    mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then(stream => {
      localStream.current = stream;
      setLocalVideoURL(stream.toURL());
      stream.getTracks().forEach(track => pc.current.addTrack(track, stream));
    }).catch(error => {
      Alert.alert(t('errorTitle'), t('cameraMicPermissionError'));
      navigation.goBack();
    });

    pc.current.ontrack = event => {
      if (event.streams && event.streams[0]) {
        remoteStream.current = event.streams[0];
        setRemoteVideoURL(remoteStream.current.toURL());
      }
    };

    const callDoc = firestore().collection('calls').doc(callId);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    if (isCaller) {
      callDoc.set({ createdAt: firestore.FieldValue.serverTimestamp() });
      pc.current.onicecandidate = event => {
        if (event.candidate) {
          offerCandidates.add(event.candidate.toJSON());
        }
      };

      pc.current.createOffer().then(offer => {
        pc.current.setLocalDescription(offer);
        callDoc.update({ offer: offer.toJSON() });
      });

      callDoc.onSnapshot(snapshot => {
        const data = snapshot.data();
        if (!pc.current.currentRemoteDescription && data?.answer) {
          const answerDesc = new RTCSessionDescription(data.answer);
          pc.current.setRemoteDescription(answerDesc);
        }
      });

      answerCandidates.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current.addIceCandidate(candidate);
          }
        });
      });
    } else {
      pc.current.onicecandidate = event => {
        if (event.candidate) {
          answerCandidates.add(event.candidate.toJSON());
        }
      };

      callDoc.get().then(snapshot => {
        const data = snapshot.data();
        const offerDesc = new RTCSessionDescription(data.offer);
        pc.current.setRemoteDescription(offerDesc);

        pc.current.createAnswer().then(answer => {
          pc.current.setLocalDescription(answer);
          callDoc.update({ answer: answer.toJSON() });
        });
      });

      offerCandidates.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current.addIceCandidate(candidate);
          }
        });
      });
    }

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      if (pc.current) {
        pc.current.close();
      }
      callDoc.delete();
    };
  }, []);

  return (
    <View style={styles.container}>
      <RTCView
        streamURL={localVideoURL}
        style={styles.localVideo}
        objectFit="cover"
      />
      <RTCView
        streamURL={remoteVideoURL}
        style={styles.remoteVideo}
        objectFit="cover"
      />
      <Button title={t('endCall')} onPress={() => navigation.goBack()} />
    </View>
  );
}

VideoCallScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      callId: PropTypes.string.isRequired,
      isCaller: PropTypes.bool.isRequired,
    }).isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  localVideo: { width: 120, height: 160, position: 'absolute', top: 10, right: 10, zIndex: 2 },
  remoteVideo: { flex: 1 },
});
