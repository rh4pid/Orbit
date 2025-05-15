import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore,collection, doc, getDoc, updateDoc,setDoc, query, where,orderBy,getDocs,deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { updatePaymentCount, getPaymentCount } from "../Customer MainPage/categories.js";
import { updateLocation } from "./firbaseChart.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgvQn1sEmbk1o_Y6YvVWUQ0rPeUREUK6A",
  authDomain: "orbit-632fa.firebaseapp.com",
  projectId: "orbit-632fa",
  storageBucket: "orbit-632fa.appspot.com",
  messagingSenderId: "15836350806",
  appId: "1:15836350806:web:935cd8a0c86d176f79eef7",
};



const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
export {auth};

const profileImg = document.getElementById("profile-button");
// Function to get user details from Firestore
async function getUserDetails(userId) {
  const userRef = doc(db, "Users", userId); 
  const userSnap = await getDoc(userRef); 

  if (userSnap.exists()) {
    
    return userSnap.data(); 
  } else {
    console.error("User data not found!");
    return null;
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userData = await getUserDetails(user.uid);
    if (userData) {
      getArtisanRequests(user.uid);
      loadAcceptedRequests(user.uid);
      if (userData.role === "artisan") {
        artisanDb(userData);
        loadRecents(user.uid);
        displayPaymentMethod(userData, user);
        profileImg.src = userData.profilePicture || "profile-outline.svg";
        profileImg.style.filter = "invert(0%)";
      }
    }
  }
});
const wadd = document.getElementById('workAd');
const hadd = document.getElementById('homeAd');

function artisanDb(data){
  const yLname = document.getElementById('yLname');
  const yFname = document.getElementById('yFname');
  const yEmail = document.getElementById('email');
  const yService = document.getElementById('CurrentService');
  const yNum = document.getElementById('telNum');
  const yoa = document.getElementById('yoa');
  const yoc = document.getElementById('yoc');
  const noi = document.getElementById('NOI');


  yLname.value = data.lastName;
  yFname.value = data.firstName;
  yEmail.value = data.email;
  yService.value = data.serviceProvided[0];
  yNum.value = data.telephone;
  yoa.value = data.yearAdmission;
  yoc.value = data.yearCompletion;
  noi.value = data.institution || "N/A";
  wadd.value = data.workAddress;
  hadd.value = data.homeAddress;

  if(data.serviceProvided[1]){
    document.getElementById('ServiceProvided').textContent = data.serviceProvided[1];
    document.getElementById("ServiceProvided").setAttribute('disabled', true);
    document.querySelector('.artisan-input-group-select').style.display = "block";
    document.querySelector('.saveService').style.display = "none";
    document.querySelector('.addServiceBtn').style.display = "none";
  }

  console.log(data.serviceProvided[0], data.email);


  const ratingsRing = document.querySelector('#ratings .progress-ring');
  const jobsRing = document.querySelector('#jobs .progress-ring');
  const revenueRing = document.querySelector('#revenue .progress-ring');

  const number = (data.totalStars/data.rateCount);
  if(!number){
    document.querySelector('#ratings span').textContent = 0;
  }
  else{
    const ratings = parseFloat(number.toFixed(1));  
    const ratingsPercentage = (ratings / 5) * 100; 
    document.querySelector('#ratings span').textContent = ratings;
    ratingsRing.style.strokeDashoffset = 410 - (ratingsPercentage / 100 * 410);
    
  }
  
  const jobs = data.rateCount;       
  const revenue = 3000;  


  
   
  const jobsPercentage = Math.min((jobs / 80) * 100, 100); 
  document.querySelector('#jobs span').textContent = jobs; 
  jobsRing.style.strokeDashoffset = 410 - (jobsPercentage / 100 * 410);

  const revenuePercentage = Math.min((revenue / 6000) * 100, 100); 
  document.querySelector('#revenue span').textContent = revenue; 
  revenueRing.style.strokeDashoffset = 410 - (revenuePercentage / 100 * 410);
}

async function getArtisanRequests(artisanId) {
  const artisanRequestsRef = collection(db, "Requests");

  try {
    // Query the requests that belong to this artisan
    const q = query(artisanRequestsRef, where("artisanId", "==", artisanId), where("jobStatus", "==", "pending"), orderBy("timestamp", "desc"));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      document.querySelector('.notificationCount').textContent = 0; // new count
      document.querySelector('.notificationCount').style.display = 'none';
    } else {
      // Array to hold the requests
      const requests = [];
      const docIds = [];
      
      querySnapshot.forEach((doc) => {
        requests.push(doc.data());
        docIds.push(doc.id);
      });
      
      // Alert the number of requests
      document.querySelector('.notificationCount').textContent = requests.length;
      alert(`You have ${requests.length} new requests.`);
      
      // Optionally, you can handle the requests here (e.g., display them in the UI)
      console.log(requests);
    }
  } catch (error) {
    console.error("Error retrieving requests:", error);
    alert("Failed to retrieve requests. Try again.");
  }
}
async function loadAcceptedRequests(artisanId) {
  const artisanRequestsRef = collection(db, "Requests");

  try {
    const q = query(
      artisanRequestsRef,
      where("artisanId", "==", artisanId),
      where("jobStatus", "in", ["accepted", "pending", "Pending Confirmation"]),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      
      return;
    }

    createRows(querySnapshot);

  } catch (error) {
    console.error("Error loading accepted requests:", error);
    alert("Failed to load accepted requests.");
  }
}

function createRows(Rdata){
  const tableBody = document.querySelector("#acceptedRequestsTable tbody");
  tableBody.innerHTML = ""; // Clear previous rows

  const docIds = [];
  const requests = [];
  const pendingStat = [];
  const accpPend = []
  
  Rdata.forEach((doc) => {
    requests.push(doc.data());
    docIds.push(doc.id);
  });

  requests.forEach((data, index) => {

    if(data.jobStatus == "pending"){
      pendingStat.push(index);
    }
    // Create a new row
    const row = document.createElement("tr");
    row.classList.add('JOBS');

    if (data.jobStatus === "accepted") {
      data.jobStatus = `${upperCase(data.jobStatus)}`;
      accpPend.push(index);
      console.log(data.jobStatus);
    } else if (data.jobStatus === "pending") {
      pendingStat.push(index);
    }

    // Populate cells
    row.innerHTML = `
      <td>${data.customerName || "N/A"}</td>
      <td>${data.customerLocation || "N/A"}</td>
      <td>${data.jobTime || "N/A"}</td>
      <td>${formatDateRange(data.jobDates)}</td>
      <td>${data.jobStatus.toUpperCase()}</td>
    `;
    // Append row to table body
    tableBody.appendChild(row);
  });

  const rows = document.querySelectorAll('.JOBS');
  rows.forEach((r, index) =>{
    if(pendingStat.includes(index)){
      r.addEventListener('click', (e)=>{
        popupBox(requests[index], docIds[index]);
      })
    }
    else if(accpPend.includes(index)){
      r.addEventListener('click', (e)=>{
        confirmationBox(requests[index], docIds[index]);
      })
    }
  })
}
function formatDateRange(datesArray) {
  if (!datesArray || datesArray.length === 0) return "N/A";

  // Convert to Date objects and sort them
  const sortedDates = datesArray.map(d => new Date(d)).sort((a, b) => a - b);

  const options = { day: '2-digit', month: 'short', year: 'numeric' };

  const start = sortedDates[0].toLocaleDateString('en-US', options);
  const end = sortedDates[sortedDates.length - 1].toLocaleDateString('en-US', options);

  // Return only one date if it's the same
  return start === end ? start : `${start} - ${end}`;
}

function upperCase(string){
  return string.toUpperCase();
}

let artisanIDNum = "";
function popupBox(data, id){
  //DETAILS OF REQUEST
  document.querySelector('.CusName').textContent = data.customerName;
  document.querySelector('.Cuslocation').textContent = data.customerLocation;
  document.querySelector('.custPayMed').textContent = data.payMthd;
  document.querySelector('.custTime').textContent = data.jobTime;
  document.querySelector('.CustArtDays').textContent = data.jobDates;

  document.getElementById('confirmAction').dataset.bookArtisanId = id; 
  document.getElementById('closePopup').dataset.bookArtisanId = id;

  document.getElementById("popup").style.display = "block";
  document.getElementById("overlay").style.display = "block";

  console.log(id);
  artisanIDNum = data.artisanId;
}
let customerIDNumber = "";
function confirmationBox(data, id){
  console.log(data.customerName);
  document.getElementById("popup1").style.display = "block";
  document.getElementById("overlay1").style.display = "block";

  //Artisan details
  document.querySelector('.ArtisanName1').textContent = data.artisanName;
  document.querySelector('.ServiceTypeBooking1').textContent = data.service;

  //Customer details
  document.querySelector('.CusName1').textContent = data.customerName;
  document.querySelector('.Cuslocation1').textContent = data.customerLocation;

  //Job details
  document.querySelector('.custPayMed1').textContent = data.payMthd;
  document.querySelector('.custTime1').textContent = data.jobTime;
  document.querySelector('.CustArtDays1').textContent = data.jobDates;

  document.getElementById('confirmAction1').dataset.bookArtisanId = id; 
  document.getElementById('closePopup1').dataset.bookArtisanId = id;

  customerIDNumber = data.artisanId;
}
document.getElementById('closePopup1').addEventListener('click', (e) => {
  document.getElementById("popup1").style.display = "none";
  document.getElementById("overlay1").style.display = "none";
});

document.getElementById('confirmAction1').addEventListener('click', async (e) => {
  const docId = e.target.dataset.bookArtisanId;

  try {
    const docRef = doc(db, "Requests", docId);
    await updateDoc(docRef, { jobStatus: "Pending Confirmation" });

    alert("Marked as completed, waiting for customer confirmation.");

    // Disable further edits by artisan (optional)
    e.target.disabled = true;

    document.getElementById("popup1").style.display = "none";
    document.getElementById("overlay1").style.display = "none";

    loadAcceptedRequests(customerIDNumber);
  } catch (error) {
    console.error("Error updating request:", error);
    alert(" Failed to mark job as completed.");
  }
});


//BUTTONS SHOWN IN COMFIRMATION ALERT
document.getElementById('closePopup').addEventListener('click', async (e) => {
  const docId = e.target.dataset.bookArtisanId;

  try {
    const docRef = doc(db, "Requests", docId);
    await deleteDoc(docRef);

    alert("🗑️ Request deleted.");
    
    document.getElementById("popup").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    loadAcceptedRequests(artisanIDNum)
  } catch (error) {
    console.error("Error deleting request:", error);
    alert(" Failed to delete request.");
  }
});
document.getElementById('confirmAction').addEventListener('click', async (e) => {
  const docId = e.target.dataset.bookArtisanId;

  try {
    const docRef = doc(db, "Requests", docId);
    await updateDoc(docRef, { jobStatus: "accepted" });

    alert("🛩 Request accepted!");
    
    document.getElementById("popup").style.display = "none";
    document.getElementById("overlay").style.display = "none";

    loadAcceptedRequests(artisanIDNum)
  } catch (error) {
    console.error("Error updating request:", error);
    alert(" Failed to accept request.");
  }
});
//-----------------------UPLOAD PROFILE PIC
const previewImg = document.getElementById('previewImg'); 

document.getElementById('fileInput').addEventListener('change', async function(event) {
  const file = event.target.files[0];

  if (file) {
    const formData = new FormData();
    formData.append("image", file);

    const IMGBB_API_KEY = "940722efb100538cb30257a14b3f93c7";
    const imgbbUrl = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;

    try {
      //Upload to ImgBB
      const response = await fetch(imgbbUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = data.data.url; // Get the image URL

        //Get current user
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, "Users", user.uid);

          //Fetch user data to get the role
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const userRole = userData.role; // Assuming you have a 'role' field

            //Implement role-based check
            if (userRole === "artisan") { // Allow both roles to update
              await updateDoc(userRef, { profilePicture: imageUrl });

              //Show the new image immediately
              previewImg.src = imageUrl;
              profileImg.src = imageUrl;
              previewImg.style.display = "block";
              profileImg.style.filter = "invert(0%)";

              console.log("Profile picture updated successfully!");
            } 
          } 
          else {
            console.error("Could not retrieve user data.");
          }
        } 
        else {
          console.error("User is not logged in.");
        }
      } 
      else {
        console.error("Failed to upload image:", data.error);
      }
    } 
    catch (error) {
      console.error("Error uploading to ImgBB:", error);
    }
  }
});

const editAddbtn = document.querySelector('.editAddress');
editAddbtn.addEventListener('click', async function(event) {

  if(wadd.hasAttribute("readonly")){
    wadd.removeAttribute('readonly');
    hadd.removeAttribute('readonly');
    editAddbtn.textContent = "Save Address";
  }
  else{
    wadd.setAttribute('readonly', true);
    hadd.setAttribute('readonly', true);
    editAddbtn.innerHTML = `Edit Address <i class="fa-regular fa-pen-to-square"></i>`;
    const user = auth.currentUser;

    if (user) {
      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userRole = userData.role; 

        if (userRole === "artisan") { 
          await updateDoc(userRef, { 
            workAddress: wadd.value,
            homeAddress: hadd.value
          });
          console.log("Address updated successfully!");
        } 
      } 
      else {
        console.error("Could not retrieve user data.");
      }
    } 
    else {
      console.error("User is not logged in.");
    }
      
  }
});


const chgPwdBlock = document.querySelector('.passwordBlock');
const OldPwd = document.getElementById('OldPwd');
const NewPwd = document.getElementById('NewPwd');

function closePwdBlk(){
    chgPwdBlock.classList.remove('active');
    chgPwdBlock.style.width = "0%";
    chgPwdBlock.style.height = "80%";
    OldPwd.value = "";
    NewPwd.value = "";
}

document.querySelector('.savePwd').addEventListener('click', async function(){
    const user = auth.currentUser;



    if(NewPwd.value.lenght < 6){
      alert("Password must be at least 6 characters.");
      closePwdBlk();
      return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, OldPwd.value); 
        await reauthenticateWithCredential(user, credential);
        console.log("User reauthenticated");

        await updatePassword(user, NewPwd.value);
        alert("Password updated successfully!");

        closePwdBlk();
    } 
    catch (error) {
        console.error("Error updating password:", error.message);
        alert("Error: " + error.message);
    }
});

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



//SAVE BUTTON SERVICE
const addbtn = document.querySelector('.addServiceBtn');
let addToggle = false;
addbtn.addEventListener('click', (e)=>{
  if(!addToggle){
    document.querySelector('.artisan-input-group-select').style.display = "block";
    document.querySelector('.saveService').style.display = "block";
    addbtn.textContent = "Delete Service";
    addbtn.style.backgroundColor = "#bb0606"
    addToggle = true;
  }
  else{
    document.querySelector('.artisan-input-group-select').style.display = "none";
    document.querySelector('.saveService').style.display = "none";
    addbtn.textContent = "Add Service";
    addbtn.style.backgroundColor = "var(--setCont)"
    addToggle = false;
  }
});

//SAVE NEW SERVICE
document.querySelector('.saveService').addEventListener('click', async function(){
  const selectedService = document.getElementById('ServiceProvided').textContent;
  const user = auth.currentUser;

  if(selectedService != "Select a Service"){
    const userRef = doc(db, "Users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentData = userSnap.data();
      const existingServices = currentData.serviceProvided || [];
  
      // Check if the service already exists to avoid duplicates
      if (!existingServices.includes(selectedService)) {
        const updatedServices = [...existingServices, selectedService];
  
        // Update Firestore
        await updateDoc(userRef, {
          serviceProvided: updatedServices
        });
  
        alert("New Service Saved");
        document.getElementById("ServiceProvided").setAttribute('disabled', true);
        document.querySelector('.artisan-input-group-select').style.display = "block";
        document.querySelector('.saveService').style.display = "none";
        document.querySelector('.addServiceBtn').style.display = "none";
      } else {
        alert("Service already exists");
        document.querySelector('.artisan-input-group-select').style.display = "none";
        document.getElementById('ServiceProvided').textContent = "Select a Service";
        document.querySelector('.saveService').style.display = "none";
        addbtn.textContent = "Add Service";
        addbtn.style.backgroundColor = "var(--setCont)"
        addToggle = false;
      }
    }
    
  }
  else{
    alert('No Service Entered');
    document.querySelector('.artisan-input-group-select').style.display = "none";
    document.getElementById('ServiceProvided').textContent = "Select a Service";
    document.querySelector('.saveService').style.display = "none";
    addbtn.textContent = "Add Service";
    addbtn.style.backgroundColor = "var(--setCont)"
    addToggle = false;
    return;
  }
});

const savePayMtd = document.querySelector('.savePaymentBtn');

savePayMtd.addEventListener('click', async function () {
  const user = auth.currentUser;
  const payBlkTxt = document.querySelectorAll('.Paymentopts label');
  const payBlkInput = document.querySelectorAll('.Paymentopts input');

  let allFilled = true;
  const inputVal = [];

  payBlkInput.forEach(input => {
    if (input.value.trim() === "") {
      allFilled = false;
      alert("Some inputs are empty!");
      inputVal.length = 0;
      return;
    }
    inputVal.push(input.value.trim());
  });

  if (!allFilled) return;

  let newPaymentMth = {};

  payBlkTxt.forEach((method, index) => {
    const cleanMethod = method.textContent.trim(); 
    const number = inputVal[index];

    if (!newPaymentMth[cleanMethod]) {
      newPaymentMth[cleanMethod] = [number];
    } else {
      if (!newPaymentMth[cleanMethod].includes(number)) {
        newPaymentMth[cleanMethod].push(number);
      } else {
        alert(`Number ${number} already exists for ${cleanMethod}`);
        return;
      }
    }
  });

  const userRef = doc(db, "Users", user.uid);
  const userSnap = await getDoc(userRef);

  let mergedPaymentMth = {};

  if (userSnap.exists()) {
    const currentData = userSnap.data();
    const existingPytm = currentData.paymentMth || [];

    existingPytm.forEach(obj => {
      const [methodRaw] = Object.keys(obj);
      const method = methodRaw.trim(); // 
      if (!mergedPaymentMth[method]) {
        mergedPaymentMth[method] = obj[method];
      }
    });
  }

  Object.entries(newPaymentMth).forEach(([method, numbers]) => {
    if (!mergedPaymentMth[method]) {
      mergedPaymentMth[method] = numbers;
    } else {
      numbers.forEach(num => {
        if (!mergedPaymentMth[method].includes(num)) {
          mergedPaymentMth[method].push(num);
        } else {
          console.log(`Skipping duplicate number ${num} for ${method}`);
        }
      });
    }
  });

  const finalPaymentData = Object.entries(mergedPaymentMth).map(([method, nums]) => {
    return { [method]: nums };
  });

  await setDoc(userRef, { paymentMth: finalPaymentData }, { merge: true });
  console.log(" Payment methods saved successfully!", finalPaymentData);
  savePayMtd.style.display = "none";

  payBlkInput.forEach(input => {
    input.setAttribute('readonly', true);
  });
});

function displayPaymentMethod(data, user) {
  const paymentData = data.paymentMth || [];
  const container = document.querySelector('.PaymentBlk');
  const userRef = doc(db, "Users", user.uid);

  if (paymentData && paymentData.length > 0) {
    paymentData.forEach(entry => {
      const method = Object.keys(entry)[0];
      const numbers = entry[method];
  
      numbers.forEach(number => {
        const existingInputs = container.querySelectorAll('input');
        const existingNumbers = Array.from(existingInputs).map(input => input.value);
  
        if (!existingNumbers.includes(number)) {
          const serviceBlk = document.createElement('div');
          serviceBlk.className = 'Paymentopts';
  
          serviceBlk.innerHTML = `
            <label class="orbitron-discover">${method}
              <input type="text" value="${number}" readonly />
            </label>
            <button class="delPaymentBtn">Delete</button>
          `;
  
          container.appendChild(serviceBlk);
  
          // Delete logic
          serviceBlk.querySelector('.delPaymentBtn').addEventListener('click', async () => {
            container.removeChild(serviceBlk);
  
            const updatedData = paymentData.map(entry => {
              const key = Object.keys(entry)[0];
              const vals = entry[key];
  
              if (key === method) {
                const filteredVals = vals.filter(val => val !== number);
                return { [key]: filteredVals };
              }
              return entry;
            });
  
            await setDoc(userRef, { paymentMth: updatedData }, { merge: true });
            console.log(`Deleted ${number} from ${method}`);
          });
        }
      });
    });
  } else {
    // If paymentData is empty or doesn't exist, create a new paymentMth field
    const initialPaymentData = paymentData || []; // Handle case where paymentData is undefined
    const newData = { paymentMth: initialPaymentData };
    setDoc(userRef, newData, { merge: true });
    console.log("Created new paymentMth field with initial data:", initialPaymentData);
  }
  const Pcontainer = document.querySelectorAll('.Paymentopts');
  updatePaymentCount(Pcontainer.length);
  console.log(getPaymentCount());
}


//-----------------------------------RECENT SECTION-------------------
async function loadRecents(artisanId) {
  const artisanRequestsRef = collection(db, "Requests");

  try {
    const q = query(
      artisanRequestsRef,
      where("artisanId", "==", artisanId),
      where("jobStatus", "in", ["completed"]),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return;
    }
    createRecentRows(querySnapshot);
  } 
  catch (error) {
    console.error("Error loading accepted requests:", error);
  }
}

const location = [];
const JobDays = [];

function createRecentRows(Rdata){
  const tableBody = document.getElementById('recentsTbody');
  tableBody.innerHTML = ""; // Clear previous rows

  const docIds = [];
  const requests = [];

  
  Rdata.forEach((doc) => {
    requests.push(doc.data());
    docIds.push(doc.id);
  });

  requests.forEach((data, index) => {
    location.push(data.customerLocation);
    JobDays.push(data.timestamp.toDate().toLocaleDateString('en-US', {
      weekday: 'short'}));
    const row = document.createElement("tr");
    row.classList.add('JOBS');


    const timestamp = data.timestamp;
    const date = timestamp.toDate();
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit', 
      year: 'numeric'
    });

    const rateImg = "../icons/artisan-fill.svg";
    
    let ratingHTML = `<span>`;
    for (let i = 0; i < data.rate; i++) {
      ratingHTML += `<img src="${rateImg}" alt="Rating" width="15px">`;
    }
    ratingHTML += `</span>`;
    let stars = data.rate > 0 ? ratingHTML : "N/A"     

    // Populate cells
    row.innerHTML = `
    <td>${formattedDate}</td>
    <td>${data.customerLocation}</td>
    `;
    // Append row to table body
    tableBody.appendChild(row);
  });

  const lineCtx = document.getElementById('lineChart').getContext('2d');
  const locations = ['Oyibi', 'Madina', 'Osu', 'Tema', "Ashiyie"]; 

  // Travel data: representing the artisan's locations throughout the week
  const travelData = [1, 2, 3, 1, 2, 3, 0, 4]; 

  // Create the line chart
  new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
      datasets: [{
        label: 'Job Locations',
        data: travelData,
        borderColor: 'darkblue',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        fill: true,
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return location[value];  
            },
            beginAtZero: true,
          }
        }
      }
    }
  });


  // Bar Chart (Work Activity)
  const barCtx = document.getElementById('barChart').getContext('2d');
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], 
      datasets: [{
        label: 'Activity',
        borderWidth: 2,
        borderRadius: 5,
        borderColor: 'darkblue',
        data: [5, 9, 7, 11], 
        backgroundColor: '#007bff48'
      }]
    },
    options: {
      responsive: true
    }
  });

  const artisanLocation = wadd.value;
  console.log(JobDays, artisanLocation);
}
