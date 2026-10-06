import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8IJrnZ8Y6pbJiS3yBChrL5WFvBRawLgA",
  authDomain: "edumind-ai-88fbd.firebaseapp.com",
  projectId: "edumind-ai-88fbd",
  storageBucket: "edumind-ai-88fbd.firebasestorage.app",
  messagingSenderId: "361708160367",
  appId: "1:361708160367:web:221135baf3478156b4d49a",
  measurementId: "G-BYDF71E55P"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
