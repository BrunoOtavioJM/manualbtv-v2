// Manual BTC — Firebase Configuration
// Credenciais do projeto manualbtc-8c8a0
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCNI763YxZS0cb6Qu1DAQbjR7ianOq0M_w",
  authDomain: "manualbtc-8c8a0.firebaseapp.com",
  projectId: "manualbtc-8c8a0",
  storageBucket: "manualbtc-8c8a0.firebasestorage.app",
  messagingSenderId: "257113552913",
  appId: "1:257113552913:web:30a329919bc4cedd7219b0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
