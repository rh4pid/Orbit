import { db } from "./chatbot.js";
import { collection, getDocs, query, where, doc, getDoc, updateDoc , addDoc, serverTimestamp,orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { updatecnfmBol } from "./mainpage.js";


let msgArray = [];
const updatepopupCnfm = (data, id) => {
  msgArray.length = 0;
  msgArray.push(data);
  msgArray.push(id);
  popCmfm(data,id);
};
//const getpopupCnfm = () => msgArray;
export {updatepopupCnfm };
const auth = getAuth();


const confirmRadio = document.getElementById("confirmRadio");
const denyRadio = document.getElementById("denyRadio");
const confirmSection = document.getElementById("confirmSection");
const denySection = document.getElementById("denySection");
const overlay2 = document.getElementById("overlay2");
const popup2 = document.getElementById("popup2");

const stars = document.querySelectorAll(".star");
const ratingInput = document.getElementById("ratingInput");

stars.forEach(star => {
  star.addEventListener("click", () => {
    const value = parseInt(star.getAttribute("data-value"));
    ratingInput.value = value;

    stars.forEach(s => {
      s.classList.toggle("filled", parseInt(s.getAttribute("data-value")) <= value);
    });
  });
});


document.querySelectorAll('.cancel-button').forEach(btn =>{
    btn.addEventListener('click', (e)=>{
        closePopup();
    });
});

function closePopup() {
  popup2.style.display = "none";
  overlay2.style.display = "none";
  updatecnfmBol(true);
  resetDecision();
}

function resetDecision() {
  confirmRadio.checked = false;
  denyRadio.checked = false;
  confirmSection.style.display = "none";
  denySection.style.display = "none";
  ratingInput.value = "";
  stars.forEach(s => s.classList.remove("filled"));
  document.getElementById("favouriteCheckbox").checked = false;
  document.getElementById("denyReason").value = "";
}

confirmRadio.addEventListener("change", () => {
    confirmSection.style.display = "block";
    denySection.style.display = "none";
});

denyRadio.addEventListener("change", () => {
    denySection.style.display = "block";
    confirmSection.style.display = "none";
});


document.getElementById("sendConfirm").addEventListener("click", async () => {
    const rating = parseInt(ratingInput.value);
    const favourite = document.getElementById("favouriteCheckbox").checked;
    const artisanId = msgArray[0].artisanId; // Artisan's ID
    const artisanService = msgArray[0].service;
    const requestId = msgArray[1];
    const customer = auth.currentUser;

    if (!rating) {
        alert("Please rate the artisan before submitting.");
        return;
    }

    try {
        // Step 1: Get artisan doc
        console.log("Fetching artisan:", artisanId);
        const artisanRef = doc(db, "Users", artisanId);
        const artisanSnap = await getDoc(artisanRef);

        if (!artisanSnap.exists()) {
            console.error("Artisan document does not exist");
            alert("Invalid artisan information.");
            return;
        }

        if (artisanSnap.data().role !== "artisan") {
          console.error("User found, but role is not 'artisan'");
          alert("Invalid artisan information.");
          return;
        }

        const artisanData = artisanSnap.data();
        const currentRateCount = artisanData.rateCount || 0;
        const currentTotalStars = artisanData.totalStars || 0;

        console.log(" Artisan stats before update:", {
          currentRateCount,
          currentTotalStars
        });

        // Step 2: Update artisan stats
        await updateDoc(artisanRef, {
          rateCount: currentRateCount + 1,
          totalStars: currentTotalStars + rating
        });

        // Step 3: Handle favourites (if checked)
        if (favourite && customer) {
            console.log("Adding to favourites for customer:", customer.uid);
            const customerRef = doc(db, "Users", customer.uid);
            const customerSnap = await getDoc(customerRef);

            if (!customerSnap.exists()) {
                console.error(" Customer document does not exist");
                alert("Invalid customer account.");
                return;
            }

            if (customerSnap.data().role !== "customer") {
              console.error(" User role is not 'customer'");
              alert("Invalid customer account.");
              return;
            }

            const customerData = customerSnap.data();
            const favourites = customerData.favourites || [];
            
            const isAlreadyFavourited = favourites.some(fav => fav.id === artisanId && fav.service === artisanService);
            
            if (isAlreadyFavourited) {
              // Show an alert if the artisan and service are already in favourites
              alert("This artisan with the selected service is already in your favourites.");
            } else {
              // Add the artisan and service to the favourites list
              await updateDoc(customerRef, {
                favourites: [...favourites, { id: artisanId, service: artisanService }]
              });
              alert(" Artisan added to favourites!");
            }
            
        }

        const docId = msgArray[1];

        try {
          const docRef = doc(db, "Requests", docId);
          await updateDoc(docRef, { jobStatus: "completed", rate:rating});
  
          alert("Job Done Confirmed.");
  
          document.getElementById("popup2").style.display = "none";
          document.getElementById("overlay2").style.display = "none";
        } catch (error) {
          console.error("Error confirming Job:", error);
          alert(" Failed to confirm Job.");
        }
    
        closePopup();
    } catch (error) {
        console.error(" Error confirming job:", error);
        alert("Something went wrong while confirming the job. Check console for details.");
    }

    closePopup();
});



document.getElementById("sendDeny").addEventListener("click", async (e) => {
    const docId = msgArray[1];

    try {
        const docRef = doc(db, "Requests", docId);
        await updateDoc(docRef, { jobStatus: "accepted"});

        alert("🗑️ Request Accepted.");

        document.getElementById("popup2").style.display = "none";
        document.getElementById("overlay2").style.display = "none";
        //loadAcceptedRequests(customerIDNumber);
    } catch (error) {
        console.error("Error cancelling request:", error);
        alert(" Failed to cancel request.");
    }

    closePopup();
});


function popCmfm(data, id){
  document.getElementById("sendConfirm").dataset.bookArtisanId = id; 

  //sendRequestToArtisan(data.artisanId);

  //Artisan details
  document.querySelector('.ArtisanName2').textContent = data.artisanName;
  document.querySelector('.ServiceTypeBooking2').textContent = data.service || "N/A";
  console.log(data);
}

//=============================> WHEN CUSTOMER DENIES WORK COMPLETION <=====================================//

// async function sendRequestToArtisan(artisanId){
//     const customer = auth.currentUser;

//     if (!customer) {
//       alert("You must be logged in.");
//       return;
//     }

//     const requestData = {

//     };

//     try {
//         await addDoc(collection(db, "Users"), requestData);

//     } catch (error) {
//         console.error("Error sending confirmation status:", error);
//         alert("Failed to send send Status. Try again.");
//     }    
// }


//---------------SHARING LOCATION
const shareBtn = document.getElementById('shareLocationBtn');
const Locstatus = document.getElementById('locationStatus');
const latInput = document.getElementById('currentLat');
const longInput = document.getElementById('currentLong');


shareBtn.addEventListener('click', async () => {
  if (!navigator.geolocation) {
    Locstatus.textContent = 'Geolocation is not supported by your browser.';
    return;
  }

  Locstatus.textContent = 'Locating…';

  navigator.geolocation.getCurrentPosition(async (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const timestamp = new Date().toISOString();
    const user = auth.currentUser;

    latInput.value = latitude;
    longInput.value = longitude;

    Locstatus.textContent = 'Location captured successfully!';

    if (user) {
      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const currentData = userSnap.data();
        const existingLocations = currentData.liveLocation || [];

        const newLocation = {
          latitude,
          longitude,
          timestamp
        };

        // Add the new location to the array
        const updatedLocations = [...existingLocations, newLocation];

        await updateDoc(userRef, {
          liveLocation: updatedLocations
        });

        alert("New Location Saved");
      } else {
        // If no document exists, create one with the location
        await setDoc(userRef, {
          liveLocation: [{
            latitude,
            longitude,
            timestamp
          }]
        });

        alert("Location Document Created");
      }
    } else {
      alert("User not authenticated");
    }
  }, () => {
    Locstatus.textContent = 'Unable to retrieve your location.';
  });
});
