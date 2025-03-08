// /firebase/firebaseClient.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_firebase_apiKey,
    authDomain: process.env.NEXT_PUBLIC_firebase_authDomain,
    projectId: process.env.NEXT_PUBLIC_firebase_projectId,
    storageBucket: process.env.NEXT_PUBLIC_firebase_storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_firebase_messagingSenderId,
    appId: process.env.NEXT_PUBLIC_firebase_appId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
