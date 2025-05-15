import { auth } from "./firebase.js";
import { Catalog } from "../Customer MainPage/categories.js";
import { getPaymentCount, updatePaymentCount } from "../Customer MainPage/categories.js";

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
    sideTabs[index].classList.add('active');

    if(index == 3){
      document.querySelector('.notificationCount').textContent = 0; // new count
      document.querySelector('.notificationCount').style.display = 'none';
    }
    if(index == 4){
      document.getElementById("engageMsgCount").style.display = "none";
      const msgRowBox =  document.querySelectorAll('.msgBoxRow');
      msgRowBox.forEach((box, index) =>{
        box.classList.remove('active');
      })
      msgRowBox[0].classList.add('active');
    }
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
  mainContent[3].classList.add('active');

  //SELECT TABS
  sideTabs.forEach(tabs =>{
    tabs.classList.remove('active');
  })
  sideTabs[3].classList.add('active');
});



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


//-------------------------------------------WALLET TAB------------------------
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

const wBody = document.querySelector("#transactions tbody");

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


const chgPwdBtn = document.getElementById('changePwd');
const chgPwdBlock = document.querySelector('.passwordBlock');
const OldPwd = document.getElementById('OldPwd');
const NewPwd = document.getElementById('NewPwd');

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


//ADDING PAYMENT METHOD
const paymentSelect = document.getElementById('payment-method');
const savePayMtd = document.querySelector('.savePaymentBtn');
const container = document.querySelector('.PaymentBlk');

paymentSelect.addEventListener('change', () => {
  const selected = paymentSelect.options[paymentSelect.selectedIndex].text;
  
  if(getPaymentCount() < 4){
    let paymentCount = getPaymentCount();
    if (selected.toLowerCase() !== 'cash') {
      // Create main wrapper
      const serviceBlk = document.createElement('div');
      serviceBlk.className = 'Paymentopts';
      savePayMtd.style.display = "block";

      // Create inner block
      serviceBlk.innerHTML = `
          <label class="orbitron-discover">${selected}
            <input type="text">
          </label>
          <button class="delPaymentBtn">Delete</button>
      `;

      // Append to container
      container.appendChild(serviceBlk);

      // Add delete functionality
      serviceBlk.querySelector('.delPaymentBtn').addEventListener('click', () => {
        container.removeChild(serviceBlk);
        paymentCount--;
        updatePaymentCount(paymentCount);
        console.log(getPaymentCount());
      });
      paymentCount++;
      updatePaymentCount(paymentCount);
      console.log(getPaymentCount());
    }
  }
  else{
    alert('You have Reached the Maximum limit');
  }
});




// LIST ALL SERVICE SKILL TO BE SELECTED
let allSkills = Catalog.flatMap(category => category.skills);
const itemsPerPage = 30;
let currentPage = 0;

const dropdownService = document.querySelector(".dropdown");
const ServiceProvided = document.getElementById("ServiceProvided");
const dropdownContent = document.getElementById("dropdownContent");
const containerService = document.getElementById("items-container");
const serviceSearch = document.getElementById("search");
const navPrev = document.getElementById("navPrev");
const navNext = document.getElementById("navNext");

function renderItems(filteredItems = allSkills) {
  containerService.innerHTML = "";
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const visibleItems = filteredItems.slice(start, end);

  visibleItems.forEach(item => {
  const div = document.createElement("div");
    div.textContent = item;
    div.style.padding = "5px";
    div.style.cursor = "pointer";
    
    div.addEventListener("click", () => {
      ServiceProvided.textContent = item;
      dropdownService.classList.remove("show");
    });
    containerService.appendChild(div);
  });

  navPrev.disabled = currentPage === 0;
  navNext.disabled = end >= filteredItems.length;
}

function updatePage(increment) {
  currentPage += increment;
  renderItems();
}

serviceSearch.addEventListener("input", () => {
  const query = serviceSearch.value.toLowerCase();
  const filteredItems = allSkills.filter(item => item.toLowerCase().includes(query));
  currentPage = 0;
  renderItems(filteredItems);
});

navPrev.addEventListener("click", () => updatePage(-1));
navNext.addEventListener("click", () => updatePage(1));
ServiceProvided.addEventListener("click", () => dropdownService.classList.toggle("show"));
document.addEventListener("click", (event) => {
if (!dropdownService.contains(event.target)) {
dropdownService.classList.remove("show");
}
});

renderItems();