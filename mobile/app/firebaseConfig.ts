import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "nutria-cfef5.firebaseapp.com",
  projectId: "nutria-cfef5",
  storageBucket: "nutria-cfef5.appspot.com",
  messagingSenderId: "42942654387",
  appId: "1:42942654387:web:ffba807336cd8c1c518dc6"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// --- CORREÇÃO AQUI: Adicione () ---
const auth = firebase.auth(); 
// ----------------------------------
const db = firebase.firestore();

export { auth, db };