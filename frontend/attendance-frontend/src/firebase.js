import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBZWNtZNKGWx-1K3WZVOoF2O8yVX7vQKxw",
  authDomain: "attendance-23d5a.firebaseapp.com",
  databaseURL: "https://attendance-23d5a-default-rtdb.firebaseio.com",
  projectId: "attendance-23d5a",
  storageBucket: "attendance-23d5a.appspot.com",
  messagingSenderId: "1052175055559",
  appId: "1:1052175055559:web:9f89d8d3ac7f2d6ecd8d7a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
export default app;
