// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAD8TrsFADXIFFqwaspGff9UtiqmYEH-nk",
    authDomain: "orbit-632fa.firebaseapp.com",
    projectId: "orbit-632fa",
    storageBucket: "orbit-632fa.appspot.com",
    messagingSenderId: "15836350806",
    appId: "1:15836350806:web:935cd8a0c86d176f79eef7",
    measurementId: "G-YRZ1VQNZW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

//--------------------GET CORIDATES OF HOME AND WORK ADDRESS-----------------------
async function getCoordinates(location) {
    if (!location.trim()) return null;

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}&countrycodes=GH&limit=1`);
        const data = await response.json();

        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
    } catch (error) {
        console.error("Error fetching coordinates:", error);
    }

    return null;
}


const getElementVal = (id) => document.getElementById(id)?.value.trim();

async function verifyPoliceReference(refNumber) {
    const policeRefRegex = /^[A-Z]{2,10}\/\d{1,5}\/\d{1,2}\/\d{4}$/;
  
    if (!policeRefRegex.test(refNumber)) {
      alert("Invalid police reference number format. Please enter a valid number.");
      return false;
    }
  
    try {
      let response = await fetch("http://127.0.0.1:5000/verify_ref", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference: refNumber }),
      });
  
      let result = await response.json();
  
      if (result.valid) {
        return true;
      } else {
        alert("Invalid police reference number.");
        return false;
      }
    } catch (error) {
      console.error("Error verifying police reference:", error);
      alert("Verification failed. Please try again.");
      return false;
    }
}
  
async function signupUser(role) {
    event.preventDefault();


    const firstName = getElementVal(role === "customer" ? "RfirstName" : "PfirstName");
    const lastName = getElementVal(role === "customer" ? "RlastName" : "PlastName");
    const email = getElementVal(role === "customer" ? "Remail" : "Pemail");
    const password = getElementVal(role === "customer" ? "Rpassword" : "Ppassword");
    const confirmPassword = getElementVal(role === "customer" ? "RconfirmPassword" : "PconfirmPassword");


    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        alert(" All fields are required!");
        return;
    }
    if (password !== confirmPassword) {
        alert(" Passwords do not match!");
        return;
    }

    // Artisan-specific validation
    let userData = {
        firstName,
        lastName,
        email,
        role, // "customer" or "artisan"
        profilePicture: "",
        createdAt: new Date().toISOString()
    };

    if (role === "artisan") {
        // Validate artisan-specific fields
        const telephone = getElementVal("Ptel");
        const serviceProvided = document.getElementById('ServiceProvided').textContent;
        const yearsExperience = document.getElementById("yrsExp").innerText.trim();
        const education = document.getElementById("EduBg").innerText.trim();
        const ageRange = document.getElementById('Page').innerText.trim();
        const certificate = document.querySelector("input[name='certificate']:checked")?.value || "N/A";
        const homeAddress = getElementVal("PhomeLoc");
        const workAddress = getElementVal("PworkLoc");
        const policeReport = getElementVal("policeReport");

        const ServiceInstitution =  document.getElementById('ServiceInstitution').value.trim();
        const yrAdmin =  document.getElementById('yrAdmin').value.trim();
        const yrComp = document.getElementById('yrComp').value.trim();

        // Call the async verification function
        const isPoliceRefValid = await verifyPoliceReference(policeReport);

        if (!isPoliceRefValid) {
            alert("Invalid police reference number.");
            return;
        }

        // Check if Ghana Card images are uploaded and verified
        let frontLabel = document.querySelector("label[for='file3']").textContent;
        let backLabel = document.querySelector("label[for='file4']").textContent;
        if (!frontLabel.includes("Verified") || !backLabel.includes("Verified")) {
            alert(" Please upload and verify both sides of your Ghana Card before proceeding.");
            return;
        }


        // Upload images in parallel
        const imageKeys = ["fileInput", "file1", "file3", "file4"];
        const uploadedImages = await Promise.all(imageKeys.map(uploadImage));

        // Check if profile picture is uploaded
        if (!uploadedImages[0] || uploadedImages[0] === "N/A") {
            alert(" Profile picture is required!");
            return;
        }

        const [homeCoords, workCoords] = await Promise.all([
            getCoordinates(homeAddress),
            getCoordinates(workAddress)
        ]);

        userData = {
            ...userData,
            ServiceInstitution,
            telephone,
            yrComp,
            yrAdmin,
            serviceProvided:[serviceProvided],
            yearsExperience,
            education,
            ageRange,
            certificate,
            homeAddress,
            homeCoords,
            workAddress,
            workCoords,
            profilePicture: uploadedImages[0],
            certificateProof: uploadedImages[1],
            policeReport,
            GhanaCard: [uploadedImages[2], uploadedImages[3]],
            rateCount: 0,
            totalStars: 0
        };
    }

    try {
        // Create Firebase Authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Store user in Firestore
        await setDoc(doc(db, "Users", uid), userData);

        alert("Account created successfully!");
        location.reload();
    } catch (error) {
        console.error("Signup Error:", error.message);
        alert(error.message);
    }
}

async function uploadImage(inputId) {
    const fileInput = document.getElementById(inputId);
    if (!fileInput.files[0]) return "N/A";

    const formData = new FormData();
    formData.append("image", fileInput.files[0]);

    try {
        const response = await fetch("https://api.imgbb.com/1/upload?key=940722efb100538cb30257a14b3f93c7", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        return data.success ? data.data.url : "N/A";
    } catch (error) {
        console.error("Image upload failed:", error);
        return "N/A";
    }
}

document.querySelector(".submit-btn").addEventListener("click", () => signupUser("customer"));
document.getElementById("artisanSubmit").addEventListener("click", () => signupUser("artisan"));
