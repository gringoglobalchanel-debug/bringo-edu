import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCdRpj7y3L4PIwWiJgzYRHDU3XxcIVfmW4",
  authDomain: "bringoedu.firebaseapp.com",
  projectId: "bringoedu",
  storageBucket: "bringoedu.firebasestorage.app",
  messagingSenderId: "667720262345",
  appId: "1:667720262345:web:ad55dd71c19ffcb73fa318"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
