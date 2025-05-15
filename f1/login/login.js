import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBgvQn1sEmbk1o_Y6YvVWUQ0rPeUREUK6A",
    authDomain: "orbit-632fa.firebaseapp.com",
    projectId: "orbit-632fa",
    storageBucket: "orbit-632fa.appspot.com",
    messagingSenderId: "15836350806",
    appId: "1:15836350806:web:935cd8a0c86d176f79eef7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle Login Form Submission
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent form refresh

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        // Step 1: Authenticate User
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Step 2: Get User Role from Firestore
        const userRef = doc(db, "Users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.role === "artisan") {
                alert(" Login successful! Redirecting to Artisan Dashboard...");
                window.location.href = "../MainPages/Artisan MainPage/mainpageArtisan.html"; 
            } else if (userData.role === "customer") {
                alert(" Login successful! Redirecting to Customer Dashboard...");
                window.location.href = "../MainPages/Customer MainPage/mainpage.html"; 
            } else {
                alert(" Unknown user role!");
            }
        } else {
            alert(" User not found in database!");
        }
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            alert(" User does not exist!");
        } else if (error.code === "auth/wrong-password") {
            alert(" Incorrect password!");
        } else {
            alert(" " + error.message);
        }
    }
});
