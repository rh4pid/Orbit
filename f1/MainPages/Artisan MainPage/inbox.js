import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  limit,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Firebase configuration
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

let firstTD = "";

const latestMessages = new Map();

function createChatRow(customerID, lastMessageText) {
  const tbody = document.getElementById("engageCusTbody");

  const existingRow = Array.from(tbody.querySelectorAll("tr")).find(row => {
    return row.querySelector("td")?.textContent === customerID;
  });

  if (existingRow) {
    const lastMsgCell = existingRow.querySelectorAll("td")[1];
    lastMsgCell.textContent = lastMessageText;
    return;
  }

  const row = document.createElement("tr");

  const participantCell = document.createElement("td");
  participantCell.textContent = customerID;

  const lastMessageCell = document.createElement("td");
  lastMessageCell.textContent = lastMessageText;

  row.appendChild(participantCell);
  row.appendChild(lastMessageCell);

  tbody.appendChild(row);
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const artisanID = user.uid;
    console.log("Logged-in Artisan ID:", artisanID);
    updateEngageMessageCount()

    const participantChatsQuery = query(
      collection(db, "Chats"),
      where("participants", "array-contains", artisanID)
    );

    onSnapshot(participantChatsQuery, (snapshot) => {
      snapshot.forEach(async (chatDoc) => {
        const chatID = chatDoc.id;
        const participants = chatDoc.data().participants;
        const customerID = participants.find(p => p !== artisanID);

        // Query the latest message from the customer in the messages subcollection
        const messagesRef = collection(db, "Chats", chatID, "messages");
        const q = query(messagesRef, where("senderID", "==", customerID), orderBy("timestamp", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        let lastMessageText = "";
        if (!querySnapshot.empty) {
          const lastMsgDoc = querySnapshot.docs[0].data();
          lastMessageText = lastMsgDoc.message?.text || '';
        }

        // Only display the text field from the message
        createChatRow(customerID, lastMessageText);
      });
    });
  }
});
async function updateEngageMessageCount() {
  const user = auth.currentUser;
  if (!user) return;

  const userID = user.uid;
  const chatsQuery = query(collection(db, "Chats"), where("participants", "array-contains", userID));

  let totalUnread = 0;
  let chatCount = 0;

  try {
    const chatSnapshots = await getDocs(chatsQuery);
    chatCount = chatSnapshots.size;

    for (const chatDoc of chatSnapshots.docs) {
      const chatID = chatDoc.id;
      const messagesRef = collection(db, "Chats", chatID, "messages");
      const unseenQuery = query(
        messagesRef,
        where("seen", "==", false),
        where("senderID", "!=", userID)
      );

      const unseenMessages = await getDocs(unseenQuery);
      totalUnread += unseenMessages.size;
    }

    // Update both counts
    if(chatCount > 0){
      document.getElementById("engageMsgCount").style.display = "block";
      document.getElementById("engageMsgCount").textContent = chatCount;
    }
    
  } catch (err) {
    console.error("❌ Error counting unread messages or chats:", err);
  }
}


const tbody = document.getElementById("engageCusTbody");
const msgRowBox = document.querySelectorAll('.msgBoxRow');

tbody.addEventListener("click", (e) => {
  const clickedRow = e.target.closest("tr");
  if (!clickedRow) return;

  msgRowBox.forEach((box) => box.classList.remove("active"));
  msgRowBox[1].classList.add("active");

  firstTD = clickedRow.querySelector("td").textContent;
  console.log("Other participant ID (firstTD):", firstTD);

  const user = auth.currentUser;
  if (user) {
    const chatID1 = `${user.uid}-${firstTD}`;
    const chatID2 = `${firstTD}-${user.uid}`;

    const chatDoc1 = doc(db, "Chats", chatID1);
    const chatDoc2 = doc(db, "Chats", chatID2);

    getDoc(chatDoc1).then((docSnap) => {
      if (docSnap.exists()) {
        loadChat(chatID1, user.uid);
      } else {
        getDoc(chatDoc2).then((docSnap2) => {
          if (docSnap2.exists()) {
            loadChat(chatID2, user.uid);
          }
        });
      }
    });
  }
});

function loadChat(chatID, artisanID) {
  const chatBox = document.getElementById("chatBox");
  const messagesRef = collection(db, "Chats", chatID, "messages");
  const q = query(messagesRef, orderBy("timestamp"));

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";
    snapshot.forEach((docSnap) => renderMessage(docSnap, artisanID));
  });
}

function renderMessage(docSnap, currentUserID) {
  const data = docSnap.data();
  const { senderID, message } = data;
  const { text = "", visuals = [] } = message;

  const msgDiv = document.createElement("div");
  msgDiv.classList.add(senderID === currentUserID ? "artisan-message" : "cus-message", "message");

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

  const chatBox = document.getElementById("chatBox");
  chatBox.appendChild(msgDiv);
}

async function sendMessage(chatID, senderID, text, visuals) {
  const messagesRef = collection(db, "Chats", chatID, "messages");
  
  // Add the message to the 'messages' subcollection as before
  await addDoc(messagesRef, {
    senderID,
    message: { text, visuals },
    timestamp: serverTimestamp()
  });

  // Now, update the latest message in the 'Chats' document
  const chatDocRef = doc(db, "Chats", chatID);

}


const inboxSend = document.getElementById('sendButton');
const userInput = document.getElementById('userInput');

inboxSend.addEventListener('click', async () => {
  const text = userInput.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  const senderID = user.uid;
  const visuals = [];  // Add visuals if needed

  const chatID1 = `${senderID}-${firstTD}`;
  const chatID2 = `${firstTD}-${senderID}`;

  let selectedChatID = "";
  const docSnap = await getDoc(doc(db, "Chats", chatID1));
  if (docSnap.exists()) {
    selectedChatID = chatID1;
  } else {
    const docSnap2 = await getDoc(doc(db, "Chats", chatID2));
    if (docSnap2.exists()) {
      selectedChatID = chatID2;
    }
  }

  if (!selectedChatID) {
    selectedChatID = chatID1; // fallback
  }

  // Send message and update the Chats document with the latest message
  await sendMessage(selectedChatID, senderID, text, visuals);

  userInput.value = "";
  loadChat(selectedChatID, senderID);
});
