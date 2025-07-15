// src/firebaseConfig.js

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDIwpPp1pmMs0S5hGhWkRHcyYvVExZrssY",
  authDomain: "225443233253-l8i70mcvdpf12kkd3s5asmikdfih5k2n.apps.googleusercontent.com",
  projectId: "myfinalproject-b7306",
  storageBucket: "myfinalproject-b7306.firebasestorage.app",
  messagingSenderId: "225443233253",
  appId: "1:225443233253:android:d166649242ef6ba055c30c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // ✅ تأكد من تهيئة auth
const db = getFirestore(app);

export { auth, db };