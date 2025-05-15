import { Catalog } from "./categories.js";
import { db } from "./chatbot.js";
import { collection, getDocs, query, onSnapshot,where, doc, getDoc, updateDoc,setDoc, addDoc, serverTimestamp,orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { updatepopupCnfm } from "./mainjs1.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
const storage = getStorage(); // This uses your initialized Firebase app




let allSkills = Catalog.flatMap(category => category.skills);

let cnfmBol = false;
const updatecnfmBol = (status) => {
  cnfmBol = status;
}

export{updatecnfmBol}


//HOME TAB
const homeTabs = document.querySelectorAll('.home-tab'),
homeContent = document.querySelectorAll('.home-tab-content');

homeTabs.forEach((hTabs, index) =>{
  hTabs.addEventListener('click', (e) =>{
    homeContent.forEach(hContent => {
      hContent.classList.remove('active');
    });
    homeContent[index].classList.add('active');

    homeTabs.forEach(hTabs =>{
      hTabs.classList.remove('active');
    });
    homeTabs[index].classList.add('active');
  });
});

async function messageArtisan(artisanID) {
  const customer = auth.currentUser;
  if (!customer) return alert("Please sign in.");

  const customerID = customer.uid;

  // Ensure chatID is consistent (sorted to avoid ID collision issues)
  const sortedIDs = [customerID, artisanID].sort();
  const chatID = `${sortedIDs[0]}-${sortedIDs[1]}`;

  const textInput = document.getElementById("messageInputField");
  const imageContainer = document.getElementById("image-container");
  const mediaInput = document.getElementById("file-media");

  const text = textInput.value.trim();
  const files = Array.from(mediaInput.files).slice(0, 3); // Max 3 images

  const IMGBB_API_KEY = "940722efb100538cb30257a14b3f93c7";
  const visuals = [];


  // Upload images to ImgBB
  for (const file of files) {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        visuals.push(data.data.url);
      }
    } catch (err) {
      console.error("ImgBB upload error:", err);
    }
  }


  const chatDocRef = doc(db, "Chats", chatID);
  let chatExists = false;

  // Check if chat document exists
  try {
    const chatDocSnap = await getDoc(chatDocRef);
    chatExists = chatDocSnap.exists();
  } catch (err) {
    return alert("Error accessing chat. Check console for details.");
  }

  // Create or update the chat document
  try {
    if (!chatExists) {
      await setDoc(chatDocRef, {
        participants: sortedIDs,
        lastMessage: text || (visuals.length > 0 ? "📷 Image(s)" : ""),
        lastSenderID: customerID,
        lastTimestamp: serverTimestamp(),
      });
    } else {
      await updateDoc(chatDocRef, {
        participants: sortedIDs,
        lastMessage: text || (visuals.length > 0 ? "📷 Image(s)" : ""),
        lastSenderID: customerID,
        lastTimestamp: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Error creating/updating chat document:", err);
    return alert("Permission error while creating/updating chat.");
  }

  // Add the message to the subcollection
  const messagesRef = collection(db, "Chats", chatID, "messages");

  try {
    await addDoc(messagesRef, {
      senderID: customerID,
      message: { text, visuals },
      timestamp: serverTimestamp(),
      seen: false,
    });
  } catch (err) {
    return alert("Permission error while sending message.");
  }

  // Clear inputs and reload chat
  textInput.value = "";
  mediaInput.value = "";
  imageContainer.textContent = "";

  loadChat(chatID, artisanID);
}

function renderMessage(docSnap, currentUserID) {
  const data = docSnap.data();
  const { senderID, message } = data;
  const { text = "", visuals = [] } = message;

  const msgDiv = document.createElement("div");


  if (senderID === currentUserID) {
    msgDiv.classList.add("cus-message", "message");
  } else {
    msgDiv.classList.add("artisan-message", "message");
  }

  if (text.trim()) {
      const textP = document.createElement("p");
      textP.textContent = text;
      msgDiv.appendChild(textP);
  }

  visuals.forEach((url) => {
    if (url.trim()) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "chat image";
      img.style.maxWidth = "100px";
      img.style.margin = "5px";
      msgDiv.appendChild(img);
    }
  });

  const chatBox = document.getElementById("messageBoxTextArea");
  chatBox.appendChild(msgDiv);
}
function loadChat(chatID, artisanID) {
  const chatBox = document.getElementById("messageBoxTextArea");
  const chatDocRef = doc(db, "Chats", chatID);

  getDoc(chatDocRef).then((docSnap) => {
    if (!docSnap.exists()) {
      // Do nothing if chat does not exist
      chatBox.innerHTML = "";
      return;
    }
    const messagesRef = collection(db, "Chats", chatID, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    onSnapshot(q, (snapshot) => {
      chatBox.innerHTML = "";
      snapshot.forEach((docSnap) => renderMessage(docSnap, artisanID));
    });
  });
}

async function sendRequestToArtisan(artisanId) {
  const customer = auth.currentUser;

  if (!customer) {
    alert("You must be logged in.");
    return;
  }

  if(userLocationBook.value == "" || userFullName.value == ""){
    alert("All fields must be filled");
    document.getElementById("popup").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    return;
  }
  const requestData = {
    customerId: customer.uid,
    artisanId: artisanId,
    service:document.querySelector('.ServiceTypeBooking').textContent,
    artisanName: document.querySelector('.ArtisanName').textContent,
    customerName: userFullName.value,
    customerLocation: userLocationBook.value,
    jobTime: choiceType === "Instant" ? "This Moment" : `${convertTime(userStartTime.value)} - ${convertTime(userEndTime.value)}`,
    jobDates: choiceType === "Instant" ? [new Date().toISOString().split("T")[0]] : selectedDates,
    jobStatus: "pending",
    timestamp: serverTimestamp(),
    payMthd: document.querySelector('.custPayMed').textContent
  };


  try {
    await addDoc(collection(db, "Requests"), requestData);
    alert("Request Sent!");
    loadAcceptedRequests(customer.uid);
    document.getElementById("popup").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    homeContent.forEach(hContent => {
      hContent.classList.remove('active');
    });
    homeContent[1].classList.add('active');

    homeTabs.forEach(hTabs =>{
      hTabs.classList.remove('active');
    });
    homeTabs[1].classList.add('active');
  } catch (error) {
    console.error("Error sending request:", error);
    alert("Failed to send request. Try again.");
  }
}
async function getArtisanRequests(customerId) {
  const customerRequestsRef = collection(db, "Requests");

  try {
    // Query both accepted and pending requests
    const q = query(
      customerRequestsRef,
      where("customerId", "==", customerId),
      where("jobStatus", "in", ["accepted", "Pending Confirmation"]),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {

    } else {
      // Separate the counts
      let acceptedCount = 0;
      let pendingCount = 0;

      const requests = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push(data);

        if (data.jobStatus === "accepted") {
          acceptedCount++;
        } else if (data.jobStatus === "Pending Confirmation") {
          pendingCount++;
        }
      });

      // Show alerts
      if (acceptedCount > 0) {
        alert(`You have ${acceptedCount} accepted request(s).`);
      }
      if (pendingCount > 0) {
        alert(`You have ${pendingCount} request(s) pending confirmation.`);
      }

      // Update notification count
      document.querySelector('.notificationCount').textContent = requests.length;

      console.log(`Accepted: ${acceptedCount}, Pending: ${pendingCount}`);
    }
  } catch (error) {
    console.error("Error retrieving requests:", error);
    alert("Failed to retrieve requests. Try again.");
  }
}

async function loadAcceptedRequests(customerId) {
  const artisanRequestsRef = collection(db, "Requests");

  try {
    const q = query(
      artisanRequestsRef,
      where("customerId", "==", customerId),
      where("jobStatus", "in", ["accepted", "pending", "Pending Confirmation"]),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Do not alert if there are no requests at all
      return;
    }

    // Check if there are any accepted requests
    let hasAccepted = false;
    querySnapshot.forEach((doc) => {
      if (doc.data().jobStatus === "accepted") {
        hasAccepted = true;
      }
    });

    if (!hasAccepted) {
      alert("No accepted requests.");
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
  const accpPend = [];
  
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
      row.style.backgroundColor = "green"; // light green
      row.style.filter = "invert(0%)";
    } else if (data.jobStatus === "pending") {
      row.style.backgroundColor = "#FFBF00"; // light yellow
      pendingStat.push(index);
      row.style.filter = "invert(0%)";
    }
    else{
      accpPend.push(index);
    }

    

    // Populate cells
    row.innerHTML = `
      <td>${data.artisanName || "N/A"}</td>
      <td>${data.customerLocation || "N/A"}</td>
      <td>${data.jobTime || "N/A"}</td>
      <td>${formatDateRange(data.jobDates)}</td>
      <td>${data.jobStatus}</td>
    `;
    // Append row to table body
    tableBody.appendChild(row);
  });

  const rows = document.querySelectorAll('.JOBS');
  rows.forEach((r, index) =>{
    if(pendingStat.includes(index)){
      r.addEventListener('click', (e)=>{
        popup1(requests[index], docIds[index]);
        document.getElementById("overlay1").style.display = "block";
        document.getElementById('popup1').style.display = "block";
      });
    }
    if(accpPend.includes(index)){
      r.addEventListener('click', (e)=>{
        updatepopupCnfm(requests[index], docIds[index]);
        document.getElementById("popup2").style.display = "block";
        document.getElementById("overlay2").style.display = "block";
      });
    }
  });
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



let customerIDNumber = "";
function popup1(data, id){
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

  customerIDNumber = data.customerId;
}

//BUTTONS SHOWN IN COMFIRMATION ALERT
document.getElementById('closePopup1').addEventListener('click', async (e) => {
  const docId = e.target.dataset.bookArtisanId;

  try {
    const docRef = doc(db, "Requests", docId);
    await updateDoc(docRef, { jobStatus: "cancelled" });

    alert("Request canceled.");

    document.getElementById("popup1").style.display = "none";
    document.getElementById("overlay1").style.display = "none";
    loadAcceptedRequests(customerIDNumber);
  } catch (error) {
    console.error("Error cancelling request:", error);
    alert(" Failed to cancel request.");
  }
});

document.getElementById('confirmAction1').addEventListener('click', (e)=>{
  document.getElementById("popup1").style.display = "none";
  document.getElementById("overlay1").style.display = "none";
});





const profileImg = document.getElementById("profile-button");
const auth = getAuth();

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

let customerDetailsFName = "";
let customerDetailsLName = "";
const engageSendBtn = document.getElementById('btn-send');
let customerID = "";
// Check authentication state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is logged in, fetch Firestore data
    const userData = await getUserDetails(user.uid);
    
    if (userData) {
      getArtisanRequests(user.uid);
      loadAcceptedRequests(user.uid);
      loadRecents(user.uid);
      customerID = user.uid;
      document.getElementById('btn-send').dataset.EngaeArtisanId = user.uid;
      if (userData.role === "customer") {
        
        myFav(userData);
        profileImg.src = userData.profilePicture; 
        profileImg.style.filter = "invert(0%)";
        
        document.getElementById('email').value = userData.email;
        document.getElementById('yFname').value = userData.firstName;
        document.getElementById('yLname').value = userData.lastName;
        document.getElementById('fullNameBook').value = `${userData.firstName} ${userData.lastName}`;
      } 
      console.log(customerDetailsLName, customerDetailsFName); 
    }
  } 
  else {
    window.location.href = "login.html";
  }
});



// Function to get artisan details
const artisanDB = [];
async function getArtisanDetails() {
  artisanDB.length = 0; 

  const usersRef = collection(db, "Users"); 
  const q = query(usersRef, where("role", "==", "artisan")); 
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    artisanDB.push({
      id: doc.id,
      name: `${data.firstName} ${data.lastName}`,
      location: data.workAddress ,
      serviceType: data.serviceProvided,
      rateCount: data.rateCount,
      totalStars: data.totalStars,
      dp: data.profilePicture, 
      cert: data.certificate,  
      edu: data.education,     
      location: data.workAddress,
      cordinates: data.workCoords,
      ageRange: data.ageRange || "N/A",
      yearsExperience: data.yearsExperience,
      policeReport: data.policeReport || "N/A",
      telephone:data.telephone
    });
  });

  return artisanDB;
}




const sideTabs = document.querySelectorAll('.side-tabs'),
  mainContent = document.querySelectorAll('.main-content'),
  sideIcons = document.querySelectorAll('.fa-solid');

sideTabs.forEach((tabs, index) =>{
  tabs.addEventListener('click', (e)=>{
    //SWITCH BETWEEN CONTENTS
    mainContent.forEach(sideTabContent => {
      sideTabContent.classList.remove('active');
    });
    mainContent[index].classList.add('active');

    //SELECT TABS
    sideTabs.forEach(tabs =>{
      tabs.classList.remove('active');
    })
    
    if(index == 5){
      document.querySelector('.notificationCount').textContent = 0; // new count
      document.querySelector('.notificationCount').style.display = 'none';
    }
    sideTabs[index].classList.add('active');
  });
});

const bellIcon = document.querySelector('.headerNotification');
bellIcon.addEventListener('click', (e)=>{
  document.querySelector('.notificationCount').textContent = 0; // new count
  document.querySelector('.notificationCount').style.display = 'none';

  //SWITCH BETWEEN CONTENTS
  mainContent.forEach(sideTabContent => {
    sideTabContent.classList.remove('active');
  });
  mainContent[5].classList.add('active');

  //SELECT TABS
  sideTabs.forEach(tabs =>{
    tabs.classList.remove('active');
  })
  sideTabs[5].classList.add('active');
});



const previewMedia = document.getElementById('file-media');
const imageContainer = document.getElementById('image-container');
const messageTextArea = document.getElementById('messageBoxTextArea');

previewMedia.addEventListener('change', (e)=>{
  const input = document.getElementById('file-media');
  imageContainer.innerHTML = '';

  if (input.files) {
      Array.from(input.files).forEach(file => {
          const reader = new FileReader();
          reader.onload = function(event) {
              const mediaElement = document.createElement(file.type.startsWith('image') ? 'img' : 'video');
              mediaElement.src = event.target.result;
              mediaElement.classList.add('media-preview');
              mediaElement.style.maxWidth = '100px';
              mediaElement.style.marginRight = '5px';
              mediaElement.controls = file.type.startsWith('video');
              imageContainer.appendChild(mediaElement);
          };
          reader.readAsDataURL(file);
      });
  }
});

const callck = document.querySelector('.callCheck');
const callckTel = document.querySelector('.ArtisanTblock')
callck.addEventListener('change', (e)=>{
  if(callck.checked){
    callckTel.classList.add('active');
  }
  else{
    callckTel.classList.remove('active');
  }
});




// HOME > SLIDESHOW
const slideContainer = document.getElementById("slide");

Catalog.forEach(slide => {
  const slideItem = document.createElement("div");
  slideItem.classList.add("item");
  slideItem.style.backgroundImage = `url(${slide.image})`;

  slideItem.innerHTML = `
    <div class="content">
      <div class="blurback">
        <div class="name">${slide.cat}</div>
        <div class="des">${slide.skills}</div>
      </div>
    </div>
    `;

  slideContainer.appendChild(slideItem);
});

//NEXT AND PREV BUTTON IN HOME > SLIDESHOW 
document.getElementById('next').onclick = function(){
  let lists = document.querySelectorAll('.item');
  document.getElementById('slide').appendChild(lists[0]);
}
document.getElementById('prev').onclick = function(){
  let lists = document.querySelectorAll('.item');
  document.getElementById('slide').prepend(lists[lists.length - 1]);
}

let refreshInterval = setInterval(() => {
  next.click();
}, 5000);
next.addEventListener("click", () => {
  clearInterval(refreshInterval); 
  refreshInterval = setInterval(() => {
    next.click();
  }, 5000); 
});


// HOME > CATEGORY SECTION

// Get the category container
const categoryContainer = document.querySelector(".Cat");

// Generate categories dynamically
Catalog.forEach(category => {
  const cateDiv = document.createElement("div");
  cateDiv.classList.add("cate");
  cateDiv.style.backgroundImage = `url(${category.image})`;
  cateDiv.textContent = category.cat;
  
  categoryContainer.appendChild(cateDiv);

});



/*PAGE AFTER A CATEGORY IMAGE IS CLICKED*/ 
const again = document.querySelectorAll('.cate');
const serviceVal = document.querySelector('.serviceValue');
const serviceP = document.querySelector('.serviceProviders');
const artisanTable = document.querySelector('#resultsList tbody');


again.forEach((cards, index) =>{
  cards.addEventListener('click', (e)=>{
    serviceVal.innerHTML = Catalog[index].cat;
    serviceP.innerHTML ="";

    
    //THIS DISPLAYS THE SKILLS FROM EACH CATEGORY
    Catalog[index].skills.forEach(skill => {
      const cate = document.createElement("div");
      cate.classList.add("artisans");
      cate.style.backgroundImage = `url(${Catalog[index].image})`;
    
      cate.innerHTML = skill;
      serviceP.appendChild(cate);
    });

    specificArtisan();

    homeContent.forEach((hContent, index) => {
      hContent.classList.remove('active');
    });
    homeContent[2].classList.add('active');
  });
});

 //---------------------LIST OF ARTISANS OF THE SAME SKILL----------------------
function listArtisan(sCard){
  document.getElementById("locationInput").value = "";

  getArtisanDetails().then(() => {
  //-----------------------FILTER OUT THE ARTISANS BY SERVICE PROVIDED-------------          
    artisanTable.innerHTML = '';
    const filteredArtisanDB = artisanDB.filter(DB => DB.serviceType.includes(sCard));

    displayTable(filteredArtisanDB,sCard);
    console.log(sCard);
    const rowSkills = document.querySelectorAll('#resultsList tbody tr');
      
    rowSkills.forEach((rows, index) =>{
      rows.addEventListener('click', (e)=>{
        const rateImg = "../icons/artisan-fill.svg";
        let ratings = Math.floor(filteredArtisanDB[index].totalStars/ filteredArtisanDB[index].rateCount);
        const r = document.createElement("tr");
        
        let ratingHTML = `<span>`;
        for (let i = 0; i < ratings; i++) {
          ratingHTML += `<img src="${rateImg}" alt="Rating" width="15px">`;
        }
        ratingHTML += `</span>`;
        let stars = ratings > 0 ? ratingHTML : "N/A" 
//--------------------------------------------------INSPECT PAGE---------------------------------------
        if(document.getElementById("locationInput").value){
          inspectPage(filteredArtisanDB[index], stars, sCard);  
        }
      })
    });

    const userLocation = document.getElementById('getUserLocation');

    userLocation.addEventListener('click', (e)=>{
      getUserLocation(filteredArtisanDB,sCard);
    });

    document.getElementById("locationInput").addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        searchLocation(filteredArtisanDB,sCard);
      }
    });
  });
}

//THIS DISPLAYS THE LIST OF PERSONS WITH THE SPECIFIC ARTISAN SKILLS
function specificArtisan(){
  const skillCards = document.querySelectorAll('.artisans');
  skillCards.forEach(sCard =>{
    sCard.addEventListener('click', (e) =>{
      listArtisan(sCard.textContent);
      homeContent.forEach((hContent, index) => {
        hContent.classList.remove('active');
      });
      homeContent[3].classList.add('active');   
    })
  })

}
//------------------------------------INSPECTION PAGE OF ARTISAN----------------------------
const artPic = document.getElementById('ArtisanPreviewImg');
artPic.style.display = 'block';
const Pfirst = document.getElementById('Pfirst');
const Plast = document.getElementById('Plast');
const qrate = document.querySelector('.Qrate');
const edu = document.querySelector('.Qedubg');
const cert = document.querySelector('.Qcert');
const vert = document.querySelector('.Qvert');
const yrsExp = document.querySelector('.Qexp');
const ageRang = document.getElementById('Page');

function inspectPage(data, stars, sv){
  console.log(sv);
  let fullName = data.name;
  artPic.src = data.dp; 
  Pfirst.textContent = fullName.split(" ")[0];
  Plast.textContent = fullName.split(" ")[1];
  edu.textContent = data.edu;
  cert.textContent = data.cert;
  qrate.innerHTML = stars;
  ageRang.textContent = data.ageRange;
  yrsExp.textContent = data.yearsExperience;

  vert.textContent = data.policeReport ? "Yes" : "No";

  const qbtn = document.querySelectorAll('.ArtisanPageBtn');

  qbtn.forEach((btn, index)=>{
    btn.addEventListener('click', (e)=>{
      console.log(btn.textContent);

      homeContent.forEach((hContent, index) => {
        hContent.classList.remove('active');
      });
      if(index == 0){
        homeContent[5].classList.add('active');
        bookArtisan(data, sv);
      }
      else{
        homeContent[6].classList.add('active');
        document.getElementById('messageBoxTextArea').textContent = "";
        engageArtisan(data, sv)
      }
      
    });
  });
}

//----------------------------------BUTTONS FROM ENGAGE ARTISAN PAGE--------------------------------------
const engageBtn = document.querySelectorAll('.btn-request');
const artisanTel = document.querySelector('.contact-number');

function engageArtisan(data, sv){
  engageSendBtn.dataset.msgArtisan = data.id;
  let ChatID = `${data.id}-${customerID}`;
  console.log(customerID)
  loadChat(ChatID,data.id);

  artisanTel.textContent = data.telephone;
  engageBtn.forEach((btn, index)=>{
    btn.addEventListener('click', (e)=>{
      console.log(btn.textContent);
  
      homeContent.forEach((hContent, index) => {
        hContent.classList.remove('active');
      });
  
      if(index == 0){
        imageContainer.innerHTML = "";
        messageTextArea.value = "";
        homeContent[3].classList.add('active');
      }
      else{
        homeContent[5].classList.add('active');
        bookArtisan(data, sv);
      }  
    });
  });
}
engageSendBtn.addEventListener('click',(e)=>{
  if(document.getElementById('messageInputField').value == ""){
    alert('Cannot send empty message');
  }
  else{
    messageArtisan(engageSendBtn.dataset.msgArtisan);
  }
});


/*---------------------------------BOOKING ARTISAN-------------------------*/
//SIDE NOTE THIS CODE IS NOT DONE BOOKARTISAN()
const userFullName = document.getElementById('fullNameBook');
const userLocationBook = document.getElementById('customerLocBook');
const paymentSelect = document.getElementById("paymentSelect");

const userStartTime = document.getElementById('startTime');
const userEndTime = document.getElementById('endTime');
const customerWokingDays = document.querySelector('.CustArtDays');

const comfrmTime = document.querySelector('.custTime');

let choiceType = "Instant";

document.querySelectorAll('input[name="requestType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    choiceType = radio.value;
  });
});

function bookArtisan(data, sv){
  const artisanNameComfirm = document.querySelector('.ArtisanName');
  const artisanLocationComfirm = document.querySelector('.Artisanlocation');

  document.getElementById('serviceTypeBook').value = sv;
  document.querySelector('.ServiceTypeBooking').textContent = sv;

  document.getElementById('confirmAction').dataset.bookArtisanId = data.id; 

  userLocationBook.value = document.getElementById("locationInput").value;

  //GET ARTISAN DETAILS
  artisanNameComfirm.textContent = data.name;
  artisanLocationComfirm.textContent = data.location;

  paymentSelect.addEventListener("change", () => {
    document.querySelector('.custPayMed').textContent = paymentSelect.value;
  });
}


function popupBox(){
  document.getElementById("popup").style.display = "block";
  document.getElementById("overlay").style.display = "block";

  document.querySelector('.CusName').textContent = userFullName.value;
  document.querySelector('.Cuslocation').textContent = userLocationBook.value;


  if(choiceType == "Instant"){
    comfrmTime.textContent = "This Moment";
    customerWokingDays.textContent = "Today";
  }
  else{
    comfrmTime.textContent =  `${convertTime(userStartTime.value)} - ${convertTime(userEndTime.value)}`;
    customerWokingDays.textContent = selectedDates;
  }


  console.log(choiceType);
  console.log(comfrmTime.textContent);
}

//CREATE A CONVERT TIME FUNCTION INSTEAD
function convertTime(timeValue){
  let [hours, minutes] = timeValue.split(":");
  let period = +hours >= 12 ? "PM" : "AM";
  hours = (+hours % 12) || 12; // Convert 0 to 12 for midnight case

  let convertTime = `${hours}:${minutes} ${period}`;

  return convertTime;
  
}
document.addEventListener('DOMContentLoaded', function() {
  const instantRadio = document.getElementById('instantRadio');
  const scheduledRadio = document.getElementById('scheduledRadio');
  const scheduledBlock = document.getElementById('scheduledBlock');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  instantRadio.addEventListener('change', function() {
    if (this.checked) {
      scheduledBlock.style.display = 'none';
    }
  });

  scheduledRadio.addEventListener('change', function() {
    if (this.checked) {
      scheduledBlock.style.display = 'block';
    }
  });

  startDateInput.addEventListener('change', checkAndApplyRange);
  endDateInput.addEventListener('change', checkAndApplyRange);
});

document.getElementById('prevMonth').addEventListener('click', (e)=>{
  prevMonth();
});
document.getElementById('nextMonth').addEventListener('click', (e)=>{
  nextMonth();
});
document.getElementById('selectCurrentMonth').addEventListener('click', (e)=>{
  selectCurrentMonth();
});


let currentDate = new Date();
let selectedDates = [];
const todayGhana = new Date(); 
todayGhana.setHours(0, 0, 0, 0);

function renderCalendar() {
  const daysContainer = document.getElementById("days");
  const monthYear = document.getElementById("monthYear");
  daysContainer.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  monthYear.textContent = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  for (let i = 0; i < firstDay; i++) {
    daysContainer.innerHTML += "<div></div>";
  }

  for (let day = 1; day <= lastDate; day++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("day");
    dayElement.textContent = day;

    const fullDate = new Date(year, month, day);
    const fullDateString = fullDate.toDateString();

    if (fullDate < todayGhana) {
      dayElement.classList.add("past");
      dayElement.style.cursor = "default";
    } 
    else {
      if (selectedDates.includes(fullDateString)) {
        dayElement.classList.add("selected");
      }

      dayElement.onclick = () => {
        if (!dayElement.classList.contains("past")) {
          if (selectedDates.includes(fullDateString)) {
            selectedDates = selectedDates.filter(date => date !== fullDateString);
            dayElement.classList.remove("selected");
          } 
          else {
            selectedDates.push(fullDateString);
            dayElement.classList.add("selected");
          }
          updateSelectedDatesFromCalendar(); // Update input fields based on calendar selection
          renderCalendar(); // Re-render to update visual selection
        }
      };
    }
    daysContainer.appendChild(dayElement);
  }
}
function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}
function applyDateRange() { 
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const startDateValue = startDateInput.value;
  const endDateValue = endDateInput.value;

  if (startDateValue && endDateValue) {
      const startDate = new Date(startDateValue);
      const endDate = new Date(endDateValue);

      if (startDate > endDate) {
          alert("Start date cannot be after the end date.");
          endDateInput.value = ''; // Clear the end date
          return;
      }
      if (startDate < todayGhana || endDate < todayGhana) {
          alert("Cannot select dates in the past.");
          return;
      }

      selectedDates = []; // Clear existing selections
      let currentDateInRange = new Date(startDate);

      while (currentDateInRange <= endDate) {
          const dateString = currentDateInRange.toDateString();
          if (!selectedDates.includes(dateString)) {
              selectedDates.push(dateString);
          }
          currentDateInRange.setDate(currentDateInRange.getDate() + 1);
      }
      renderCalendar();
      updateSelectedDatesFromCalendar(); // Update input fields after range application
  } else {
      console.log("Start or end date is empty.");
  }
}
function checkAndApplyRange() {
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  if (startDateInput.value && endDateInput.value) {
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      if (endDate > startDate) {
          applyDateRange();
      } else if (startDate > endDate) {
          alert("Start date cannot be after the end date.");
          endDateInput.value = ''; // Clear the end date
      }
  }
}
function selectCurrentMonth() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const newSelectedDates = [];

  for (let i = 0; i < lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i + 1);
      if (date >= todayGhana) {
          const dateString = date.toDateString();
          if (!selectedDates.includes(dateString) && !newSelectedDates.includes(dateString)) {
              newSelectedDates.push(dateString);
          }
      }
  }
  selectedDates = [...selectedDates, ...newSelectedDates];
  renderCalendar();
  updateSelectedDatesFromCalendar(); // Update input fields after selecting current month
}
function updateSelectedDatesFromCalendar() {
  if (selectedDates.length > 0) {
      selectedDates.sort((a, b) => new Date(a) - new Date(b)); // Sort dates chronologically
      document.getElementById('startDate').valueAsDate = new Date(selectedDates[0]);
      document.getElementById('endDate').valueAsDate = new Date(selectedDates[selectedDates.length - 1]);
  } else {
      document.getElementById('startDate').value = '';
      document.getElementById('endDate').value = '';
  }
}
renderCalendar();

//BUTTONS IN BOOKING ARTISAN
const bookArtisanbtn = document.querySelectorAll('.bookArtisanbtn');
bookArtisanbtn.forEach((btnBook, index) =>{
  btnBook.addEventListener('click', (e)=>{
    if(index == 0){
      homeContent.forEach((hContent) => {
        hContent.classList.remove('active');
      });

      imageContainer.innerHTML = "";
      messageTextArea.value = "";
      homeContent[3].classList.add('active');
    }
    else{
      if(choiceType == "Scheduled"){
        if(selectedDates.length != 0 && userEndTime.value && userStartTime.value){
          popupBox();
        }
        else{
          alert("FILL EMPTY SECTIONS; DATES OR TIME")
        }
      }
      else{
        popupBox();
      }
    }  
  });
});

//BUTTONS SHOWN IN COMFIRMATION ALERT
document.getElementById('closePopup').addEventListener('click', (e)=>{
  document.getElementById("popup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
})
document.getElementById('confirmAction').addEventListener('click', (e)=>{
  const artisanId = document.getElementById('confirmAction').dataset.bookArtisanId;
  sendRequestToArtisan(artisanId);
});

//----------------------------OBTIAN THE CURRENT LOCATION OF THE CUSTOMER-------------------------------          
function getUserLocation(filteredArtisanDB,sCard) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Reverse geocoding failed.");
            }
            return response.json();
          })
          .then((data) => {
            document.getElementById("locationInput").value = data.display_name || "Unknown Location";
            sortTableByDistance({ lat, lon },filteredArtisanDB,sCard);
          })
          .catch((error) => {
            console.error("Reverse geocoding error:", error);
            alert("Could not determine your location. Please try again.");
          });
      },
      (error) => {
        alert("Location access denied.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

function displayTable(data,sCard){
  artisanTable.innerHTML = '';
  console.log(data)
  let stars = "";
  data.forEach((eg, index) =>{
    const rateImg = "../icons/artisan-fill.svg";
    let ratings = Math.floor(eg.totalStars/ eg.rateCount);
    const r = document.createElement("tr");
    
    let ratingHTML = `<span>`;
    for (let i = 0; i < ratings; i++) {
      ratingHTML += `<img src="${rateImg}" alt="Rating" width="15px">`;
    }
    ratingHTML += `</span>`;
    stars = ratings > 0 ? ratingHTML : "N/A" 
  
    r.innerHTML = `
    <td>${eg.name}</td>
    <td>${eg.location}</td>
    <td>${stars}</td>
    `;
    artisanTable.appendChild(r);
  });

  document.querySelectorAll('#resultsList tbody tr').forEach((row, index) =>{
    row.addEventListener('click', (e)=>{
      if(document.getElementById("locationInput").value){
//--------------------------------------------------INSPECT PAGE---------------------------------------
        inspectPage(data[index], stars,sCard);
//-------------------------------------------------------------DISPLAY THE CONTENT----------------
        homeContent.forEach((hContent, index) => {
          hContent.classList.remove('active');
        });
        homeContent[4].classList.add('active');   
      }
      else{
        alert('Enter Job Location');
      }
    })
  })
}

//---------------------------------SEARCH THE LOCATION ENTERED BY USER---------------------------------
function searchLocation(filteredArtisanDB,sCard) {
  let location = document.getElementById("locationInput").value.trim();
  if (!location) {
    alert("Please enter a location.");
    return;
  }

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}&countrycodes=GH&limit=1`)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        let userCoords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        sortTableByDistance(userCoords, filteredArtisanDB,sCard);
      } else {
        alert("Location not found in Ghana.");
      }
    })
    .catch(() => alert("An error occurred while searching for the location."));
}

//-------------------------------OBTAIN THE COORDINATES OF LOCATION-----------------------        
function getArtisanCoordinates(artisan) {
  return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${artisan.location}&countrycodes=GH&limit=1`)
      .then(response => response.json())
      .then(data => {
          if (data.length > 0) {
              return { ...artisan, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
          }
          return null;
      })
      .catch(() => null);
}

//----------------------------RE ARRANGE THE TABLE AFTER INPUT LOCATION------------------------
async function sortTableByDistance(user, filteredArtisanDB,sCard) {
  let artisansWithCoords = await Promise.all(filteredArtisanDB.map(getArtisanCoordinates));
  artisansWithCoords = artisansWithCoords.filter(artisan => artisan !== null);

  let sortedData = artisansWithCoords.map(artisan => ({
      ...artisan,
      distance: calculateDistance(user.lat, user.lon, artisan.lat, artisan.lon)
  })).sort((a, b) => a.distance - b.distance);
  
  displayTable(sortedData,sCard);
}

//--------------------------DETERMINE WHICH LOCATION IS CLOSEST-------------------------        
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
} 

//---------------------------SEARCH BAR------------------------
const searchBox = document.getElementById("searchBox");
const Searchdropdown = document.getElementById("searchDropdown");

searchBox.addEventListener("input", function () {
  let query = searchBox.value.toLowerCase().trim();
  Searchdropdown.innerHTML = "";
  Searchdropdown.style.display = "none";

  if (query) {
    let matches = allSkills.filter(skill => skill.toLowerCase().includes(query));

    if (matches.length > 0) {
      matches.forEach(skill => {
        let div = document.createElement("div");
        div.textContent = skill;
        div.onclick = function () {
          searchBox.value = skill;
          Searchdropdown.style.display = "none";

          listArtisan(skill);

          homeTabs.forEach(hTabs => {
            hTabs.classList.remove('active');
          });
          homeTabs[1].classList.add('active');

          homeContent.forEach(hContent => {
            hContent.classList.remove('active');
          });
          homeContent[3].classList.add('active');

          mainContent.forEach(sideTabContent => {
            sideTabContent.classList.remove('active');
          });
          mainContent[1].classList.add('active');

          sideTabs.forEach(tabs => {
            tabs.classList.remove('active');
          });
          sideTabs[1].classList.add('active');
          searchBox.value = "";
        };
        Searchdropdown.appendChild(div);
      });
      Searchdropdown.style.display = "block";
    } else {
      let noMatch = document.createElement("div");
      noMatch.textContent = "Service not found";
      noMatch.classList.add("not-found");
      Searchdropdown.appendChild(noMatch);
      Searchdropdown.style.display = "block";
    }
  }
});


searchBox.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    let query = searchBox.value.toLowerCase().trim();
    let exactMatch = allSkills.find(skill => skill.toLowerCase() === query);

    if (exactMatch) {
      searchBox.value = exactMatch;
      Searchdropdown.style.display = "none";

      listArtisan(exactMatch);

      homeTabs.forEach(hTabs => {
        hTabs.classList.remove('active');
      });
      homeTabs[1].classList.add('active');

      homeContent.forEach(hContent => {
        hContent.classList.remove('active');
      });
      homeContent[3].classList.add('active');

      mainContent.forEach(sideTabContent => {
        sideTabContent.classList.remove('active');
      });
      mainContent[1].classList.add('active');

      sideTabs.forEach(tabs => {
        tabs.classList.remove('active');
      });
      sideTabs[1].classList.add('active');
      searchBox.value = "";
    }
  }
});

document.addEventListener("click", function (event) {
  if (
    !event.target.closest("#searchBox") &&
    !event.target.closest("#searchDropdown")
  ) {
    Searchdropdown.style.display = "none";
  }
});


//-------------------------------ARTISAN SECTION TAB-----------------

const tableBody = document.querySelector("#artisan tbody"); 

async function countServiceCyclesForArtisan(artisanId, service) {
  const user = auth.currentUser;
  if (!user) return 0;

  const q = query(
    collection(db, "Requests"),
    where("customerId", "==", user.uid),
    where("artisanId", "==", artisanId),
    where("service", "==", service) // 👈 make sure your DB has this field!
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

async function myFav(data) {
  const favMap = {}; // key: artisanId

  // Check if data.favourites exists and is an array
  if (!Array.isArray(data.favourites)) {
    return;
  }

  for (const datum of data.favourites) {
    const artisanId = datum.id;
    const service = datum.service;

    if (!favMap[artisanId]) {
      const userData = await getUserDetails(artisanId);
      favMap[artisanId] = {
        Name: `${userData.firstName} ${userData.lastName}`,
        Services: {}, // key: service, value: cycle count
      };
    }

    // Count how many times this artisan was called for this specific service
    const cycleCount = await countServiceCyclesForArtisan(artisanId, service);

    favMap[artisanId].Services[service] = cycleCount;
  }

  // Transform into array for table display
  const favDB = Object.values(favMap).map(artisan => {
    const services = Object.keys(artisan.Services);
    const cycles = Object.values(artisan.Services);
    return {
      Name: artisan.Name,
      Cycles: cycles.join(" || "),
      Services: services.join(" || ")
    };
  });

  // Render table
  favDB.forEach(artisan => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${artisan.Name}</td>
      <td>${artisan.Cycles}</td>
      <td>${artisan.Services}</td>
    `;
    tableBody.appendChild(row);
  });
}



//-------------------------------------------RECENT SECTION TAB-------------------------------------------------------
async function loadRecents(customerId) {
  const artisanRequestsRef = collection(db, "Requests");

  try {
    const q = query(
      artisanRequestsRef,
      where("customerId", "==", customerId),
      where("jobStatus", "in", ["completed"]),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No completed requests found for this customer.");
      return;
    }

    createRecentRows(querySnapshot);

  } catch (error) {
    console.error("Error loading accepted requests:", error);
    alert("Failed to load accepted requests.");
  }
}

function createRecentRows(Rdata){
  const tableBody = document.querySelector("#recents tbody");
  tableBody.innerHTML = ""; // Clear previous rows

  const docIds = [];
  const requests = [];
  const pendingStat = [];
  const accpPend = [];
  
  Rdata.forEach((doc) => {
    requests.push(doc.data());
    docIds.push(doc.id);
  });

  requests.forEach((data, index) => {
    // Create a new row
    const row = document.createElement("tr");
    row.classList.add('recents');

    const timestamp = data.timestamp;
    const date = timestamp.toDate();
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit', 
      year: 'numeric'
    });

    // Populate cells
    row.innerHTML = `
    <td>${formattedDate}</td>
    <td>${data.artisanName}</td>
    <td>${data.service}</td>
    `;
    // Append row to table body
    tableBody.appendChild(row);
  });
}

//----------------------------------------------------SETTINS SECTION TAB-----------------------------------
const darkmodeIcon = document.querySelector('.dark-mode-icon');
const body = document.body;

if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark-mode");
}
function applyTheme(theme) {
  
  if (theme === "dark") {
    body.classList.add("dark-mode");
    darkmodeIcon.classList.replace('fa-moon','fa-sun')
  } else {
    body.classList.remove("dark-mode");
    darkmodeIcon.classList.replace('fa-sun','fa-moon')
  }
  localStorage.setItem("theme", theme);

}
darkmodeIcon.addEventListener("click", () => {
  const newTheme = body.classList.contains("dark-mode") ? "light" : "dark";
  applyTheme(newTheme);
});
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

//----------------------------------------------WALLET TAB------------------------------
const wallet = [
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" },
  { name: "Mr. Batman", cycles: 2, work: "Plumber", number: "05596" },
  { name: "Mr. Beast", cycles: 1, work: "Mechanic", number: "23545" },
  { name: "Mrs. Spintex", cycles: 10, work: "Home Care-taker", number: "8520" }
];

// Get the table body
const wBody = document.querySelector("#transactions tbody");

// Generate table rows dynamically
wallet.forEach(transact => {
  const row = document.createElement("tr");

  row.innerHTML = `
      <td>${transact.name}</td>
      <td>${transact.cycles}</td>
      <td>${transact.work}</td>
      <td>${transact.number}</td>
  `;

  wBody.appendChild(row);
});

//---------------------------------------SETTINGS----------------------------------------- 

//UPLPOAD PROFILE PICTURE
const fileInput = document.getElementById('fileInput');
const previewImg = document.getElementById('previewImg'); 

fileInput.addEventListener('change', async function(event) {
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
            if (userRole === "customer") { // Allow both roles to update
              await updateDoc(userRef, { profilePicture: imageUrl });

              //Show the new image immediately
              previewImg.src = imageUrl;
              profileImg.src = imageUrl;
              previewImg.style.display = "block";
              profileImg.style.filter = "invert(0%)";

              console.log("Profile picture updated successfully!");
            } else {
              console.warn(`User with role '${userRole}' is not allowed to update profile picture.`);
              // Optionally display an error message to the user
            }
          } else {
            console.error("Could not retrieve user data.");
          }
        } else {
          console.error("User is not logged in.");
        }
      } else {
        console.error("Failed to upload image:", data.error);
      }
    } catch (error) {
      console.error("Error uploading to ImgBB:", error);
    }
  }
});
const chgPwdBtn = document.getElementById('changePwd');
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



  if(NewPwd.value.length < 6){
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

/**---------------------------SETTINGS TAB---------------------*/
const setTabs = document.querySelectorAll('.settingTab');
const setContent =document.querySelectorAll('.settContent');


setTabs.forEach((sTabs, index) =>{
  sTabs.addEventListener('click', (e)=>{
    setTabs.forEach(sTabs =>{
      sTabs.classList.remove('active');
    })
    setTabs[index].classList.add('active');

    setContent.forEach(sContent =>{
      sContent.classList.remove('active');
    })
    setContent[index].classList.add('active');
  });
});




chgPwdBtn.addEventListener('click', (e)=>{
  if(!chgPwdBlock.classList.contains('active')){
    chgPwdBlock.classList.add('active');
    chgPwdBlock.style.width = "30%";
    chgPwdBlock.style.height = "80%";
  }
  else{
    chgPwdBlock.classList.remove('active');
    chgPwdBlock.style.width = "0%";
    chgPwdBlock.style.height = "80%";
    OldPwd.value = "";
    NewPwd.value = "";
    
  }
});




//NOT FULLY COMPLETE LOGGING OUT FUNCTION
document.querySelector('.logout-btn').addEventListener('click', (e)=>{
  logOut();
});
function logOut() {
  if (confirm("Are you sure you want to log out?")) {
    auth.signOut().then(() => {
      alert("You have been logged out.");
      window.location.href = "../../login/login.html"; // Redirect after logout
    }).catch((error) => {
      console.error("Logout Error:", error);
      alert("An error occurred while logging out.");
    });
  }
}




