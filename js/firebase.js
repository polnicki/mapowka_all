// Konfiguracja Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBVkApkbl0g46lsuKOdFTNf4I7J8zsUL2k",
    authDomain: "mapowka-16505.firebaseapp.com",
    databaseURL: "https://mapowka-16505-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mapowka-16505",
    storageBucket: "mapowka-16505.appspot.com",
    messagingSenderId: "586467643301",
    appId: "1:586467643301:web:d6cf945e07034d876ba24c"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();