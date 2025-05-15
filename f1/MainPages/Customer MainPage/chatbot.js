import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase Configuration
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
const db = getFirestore(app);

export {db};

//  Gemini AI Setup
const genAI = new GoogleGenerativeAI("AIzaSyBS8ovW4KGZGlfonDRcfn69fQ_FAyNBv24");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let conversationHistory = [];

async function getAvailableServices() {
        const services = [];
        const usersRef = collection(db, "Users");
        const q = query(usersRef, where("role", "==", "artisan"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const serviceArray = doc.data().serviceProvided;
            services.push(...serviceArray.map(s => s.toLowerCase()));
        });
        return services;
}
async function getAIResponse(userQuery) {
    const availableServices = await getAvailableServices();

    const greetingRegex = /^(hi|hey|hello|good morning|good afternoon|good evening|greetings?)$/i;
    const thankYouRegex = /^(thank you|thanks|appreciate it)$/i;
    const nameRegex = /^(what is your name|who are you)$/i;

    if (greetingRegex.test(userQuery.trim())) {
        return "Hello! I am Orb, How can I be of assistance today?";
    }

    if (thankYouRegex.test(userQuery.trim())) {
        return "You're welcome! If you have any further questions, feel free to ask.";
    }

    if (nameRegex.test(userQuery.trim())) {
        return "My name is Orb.";
    }

    let serviceListText = availableServices.length > 0
        ? availableServices.map(service => `- ${service.toUpperCase()}`).join("\n")
        : "No artisans are currently available in our database.";

    // Include conversation history in the prompt
    const historyText = conversationHistory.map(entry => `${entry.sender}: ${entry.text}`).join("\n");

    const customPrompt = `
    ${historyText}

    In Ghana, these are the artisan services we currently have in our database:
    ${serviceListText}

    If a user asks to "build a house", and "MASON" and "CARPENTER" are in available services, respond with "For building a house, we recommend a MASON and CARPENTER. We currently have a MASON available.".
    If a user asks to "fix a car engine", and "MECHANIC" is in available services, respond with "For fixing a car engine, we recommend a MECHANIC. We currently have a MECHANIC available.".
    If a user asks to "fix the lights in my car", and "ELECTRICAL" is in available services, respond with "For fixing the lights in your car, we recommend an AUTO ELECTRICIAN. We currently have ELECTRICAL services available.".
    If a user asks to "do wood works", and "CARPENTRY (REPAIRS, INSTALLATIONS)" is in available services, respond with "We recommend a CARPENTER for your request. We currently have CARPENTRY services available that include repairs and installations.".
    If a user asks for "plumbing issues", and "PLUMBING" is in available services, respond with "We recommend a PLUMBER for your request. We currently have PLUMBING services available.".
    If a user asks for "electrical wiring", and "ELECTRICAL" is in available services, respond with "We recommend an ELECTRICIAN for your request. We currently have ELECTRICAL services available.".
    If a user asks for a service that is **available**, and the database entry has a clear corresponding profession (e.g., PLUMBING -> PLUMBER, ELECTRICAL -> ELECTRICIAN, CARPENTRY -> CARPENTER, MASON -> MASON, MECHANIC -> MECHANIC), respond with "We recommend a [converted service name, in uppercase] for your request. We currently have [database service name, in uppercase] services available.".
    If a user asks for a service that is **available**, but the database entry needs a more specific professional term (like "ELECTRICAL" for car lights needing an "AUTO ELECTRICIAN"), use the specific example format as shown above.
    If there are alternative services that can address the request, include "Alternatively, a [converted service name, in uppercase] can also help.". Ensure the primary recommendation is the most suitable.
    If the user's query indicates a medical issue, respond with "This sounds like a medical issue. Please consult a healthcare professional.".
    If a user asks for a service that is **not available**, extract the service name from the user's query and respond with "We do not have an [extracted service name] available. You might try searching online.". If there are available services that can help, list their converted names.
    Analyze the user query. If the query requires multiple services, list the required services from the available services list, using the converted names (e.g., MASON and CARPENTER).
    If the user input is not a coherent question or request, respond with "This input appears to be nonsensical. Could you please rephrase your request?".
    If a user describes a problem with an appliance, provide possible solutions based on the type of appliance even if the appliance repair service is not listed. For example, if a user describes a washing machine problem, suggest checking for authorized service centers, local appliance repair services, or contacting a PLUMBER or ELECTRICIAN.
    Answer the user’s question in a maximum of 2 sentences: "${userQuery}"
`;

    const result = await model.generateContent(customPrompt);
    let responseText = await result.response.text();

    conversationHistory.push({ sender: "user", text: userQuery });
    conversationHistory.push({ sender: "ai", text: responseText });

    const uppercaseServices = availableServices.map(service => service.toUpperCase());
    uppercaseServices.forEach(service => {
        const regex = new RegExp(service.toLowerCase(), 'gi');
        responseText = responseText.replace(regex, service);
    });
    
    return responseText;
}


// Function to Add Messages to Chat Box
function addMessageToChatBox(text, sender) {
    const chatBox = document.getElementById("chatBox");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    if (sender === "user") {
        messageDiv.classList.add("user-message");
    } else {
        messageDiv.classList.add("ai-message");
    }

    messageDiv.innerText = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Event Listener for Sending Message and Placeholder Messages
document.addEventListener("DOMContentLoaded", function () {
    const sendButton = document.getElementById("sendButton");
    const userInput = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");

    // Add placeholder messages
    const placeholderMessages = [
        { sender: 'ai', text: 'Hello! I am Orb, your artisan assistant. How can I help you today?' },
        { sender: 'user', text: 'My television is glitching who can help with that.' },
        { sender: 'ai', text: 'We do not have a television repair service available. You might try searching online or contacting an electrician.' },
    ];

    placeholderMessages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', message.sender === 'ai' ? 'ai-message' : 'user-message');
        messageDiv.textContent = message.text;
        chatBox.appendChild(messageDiv);
    });

    let placeholdersCleared = false; // Flag to track if placeholders have been cleared

    // Function to clear placeholders
    function clearPlaceholders() {
        if (!placeholdersCleared) {
            chatBox.innerHTML = ''; // Clear chat box
            placeholdersCleared = true;
        }
    }

    // Event listener for user input
    userInput.addEventListener("input", clearPlaceholders);

    // Function to send the message
    async function sendMessage() {
        const userQuery = userInput.value.trim();
        if (!userQuery) {
            alert("Please enter a question!");
            return;
        }

        addMessageToChatBox(userQuery, "user");
        userInput.value = "";

        addMessageToChatBox("Thinking...", "ai");

        const response = await getAIResponse(userQuery);
        document.querySelector(".ai-message:last-child").innerText = response;
    }

    // Click event for send button
    sendButton.addEventListener("click", sendMessage);

    // Keydown event for Enter key
    userInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
});