// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cortexnovamind.firebaseapp.com",
  projectId: "cortexnovamind",
  storageBucket: "cortexnovamind.firebasestorage.app",
  messagingSenderId: "859620248981",
  appId: "1:859620248981:web:41f9381f7f9bfaedc0fa9c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth=getAuth(app)
export const googleProvider=new GoogleAuthProvider()