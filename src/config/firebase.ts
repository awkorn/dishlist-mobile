import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: 'AIzaSyB80MhDKCiVVhPkJoh8dH9B-PxEtr24MUk',
  authDomain: "dishlist-mobile.firebaseapp.com",
  projectId: "dishlist-mobile",
  storageBucket: "dishlist-mobile.firebasestorage.app",
  messagingSenderId: "123419463959483156789",
  appId: "1:194639594831:web:3f65c28ef8a25f896ff13a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;