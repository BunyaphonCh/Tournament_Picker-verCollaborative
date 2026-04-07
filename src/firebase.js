import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env,
    authDomain: import.meta.env,
    projectId: import.meta.env,
    storageBucket: import.meta.env,
    messagingSenderId: import.meta.env,
    appId: import.meta.env
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
