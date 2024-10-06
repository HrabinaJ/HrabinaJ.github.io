import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDoc,
  getDocs,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
let currentUser = null;

//Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyCniNCmdL6FknIcdFWIGObhZSjMMHWvp2g",
  authDomain: "calendar-38623.firebaseapp.com",
  projectId: "calendar-38623",
  storageBucket: "calendar-38623.appspot.com",
  messagingSenderId: "957770619465",
  appId: "1:957770619465:web:08d5705dfab800055cfd98",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

//Calendar setup
let currentMonth = document.querySelector(".current-month");
let calendarDays = document.querySelector(".calendar-days");
let today = new Date();
let date = new Date();

currentMonth.textContent = date.toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});
today.setHours(0, 0, 0, 0);


//Functions

function renderCalendar() {
  const prevLastDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    0
  ).getDate();
  const totalMonthDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();
  const startWeekDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    0
  ).getDay();

  calendarDays.innerHTML = "";

  let totalCalendarDay = 42;
  for (let i = 0; i < totalCalendarDay; i++) {
    let day = i - startWeekDay + 1;
    const dayDiv = document.createElement("div");
    if (i <= startWeekDay - 1) {
      // adding previous month days
      dayDiv.className = "padding-day";

      dayDiv.innerText = `${prevLastDay - i}`;
      calendarDays.appendChild(dayDiv);

    } else if (i <= startWeekDay + totalMonthDay - 1) {
      // adding this month days
      date.setDate(day);
      date.setHours(0, 0, 0, 0);     
      dayDiv.className = "month-day";
       if(date.getTime() === today.getTime()){dayDiv.classList.add("current-day")};

      const dayText = document.createElement('p');
      dayText.innerText = ` ${day}`;
      dayText.className = "day-text";
      dayDiv.appendChild(dayText);

      const indicator = document.createElement('div');
      indicator.className="indicator";
      dayDiv.appendChild(indicator);

      dayDiv.addEventListener("click", () => toggleAvailability(dayDiv, day));
      calendarDays.appendChild(dayDiv);
    } else {
      // adding next month days
      dayDiv.className = "padding-day";

      dayDiv.innerText = `${day - totalMonthDay}`;

      calendarDays.appendChild(dayDiv);
    }
  }
  loadUserAvailability();
}


document.querySelectorAll(".month-btn").forEach(function (element) {
  element.addEventListener("click", function () {
    date = new Date(currentMonth.textContent);
    date.setMonth(
      date.getMonth() + (element.classList.contains("prev") ? -1 : 1)
    );
    currentMonth.textContent = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    renderCalendar();
  });
});

document.getElementById("today").addEventListener("click",function () {
  date = new Date();

  currentMonth.textContent = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  renderCalendar();
});


// Sign in anonymously
signInAnonymously(auth)
  .then(() => {
    console.log("Signed in anonymously");
  })
  .catch((error) => {
    console.error("Error signing in:", error);
  });

export async function login() {
  const username = document.getElementById("username").value;
  console.log("Login button clicked"); // This should appear in the browser console when clicked
  const usersCollectionRef = collection(db, 'users'); // Reference to 'users' collection
  const querySnapshot = await getDocs(usersCollectionRef); // Get all user documents
  const allUsers = [];
  for (const element of querySnapshot.docs) {
    const userId = element.id;
    allUsers.push(userId);
  }
  console.log(allUsers);
  const check = (allUsers.indexOf(username) > -1);
  console.log(check);
  if (check) {
    currentUser = username;
    renderCalendar();
    document.getElementById("login-container").style.display = "none";

    document.getElementsByClassName("calendar-container")[0].style.display = "block";
  } else {
    alert("Please enter a valid username");
  }
}

function toggleAvailability(dayDiv, day) {
  const indicator = dayDiv.getElementsByClassName("indicator");
  if (indicator[0].classList.contains("iavailable")) {
    indicator[0].classList.remove("iavailable");
    indicator[0].classList.add("inot-available");
    saveAvailability(day, false);
  } else {
    indicator[0].classList.remove("inot-available");
    indicator[0].classList.add("iavailable");
    saveAvailability(day, true);
  }
}

async function saveAvailability(day, isAvailable) {
  try {
    const userCollection = collection(db, "users"); // Get the 'users' collection
    const userDoc = doc(userCollection, currentUser); // Reference to the current user's document
    const userYear = collection(userDoc, `${date.getFullYear()}`);
    const userMonth = doc(userYear, `${date.toLocaleString('en-us', { month: 'long' })}`);
    // Save availability data
    await setDoc(
      userMonth,
      {
        availability: { [day]: isAvailable },
      },
      { merge: true }
    ); // Merge to avoid overwriting other fields
    console.log("Availability saved successfully!");
  } catch (error) {
    console.error("Error saving availability:", error);
  }
}

async function loadUserAvailability() {
  try {
    const usersCollectionRef = collection(db, 'users'); // Reference to 'users' collection
    const querySnapshot = await getDocs(usersCollectionRef); // Get all user documents
    const allUsersAvailability = [];
    let personalAvailability = null;
    // Loop through all users
    for (const element of querySnapshot.docs) {
        const userId = element.id; // Get user ID

        // Fetch user's availability for the specified year and month
        const userDoc = doc(usersCollectionRef, userId);
        const userYear = collection(userDoc, `${date.getFullYear()}`);
        const userMonth = doc(userYear, `${date.toLocaleString('en-us', { month: 'long' })}`);
        const userMonthDoc = await getDoc(userMonth);

        if (userMonthDoc.exists()) {
            const userAvailability = userMonthDoc.data().availability;
            allUsersAvailability.push(userAvailability);
            if(userId===currentUser){
              personalAvailability = userAvailability;
            }
        } else {
            console.log(`No availability data for user ${userId} in ${date.getFullYear()}-${date.toLocaleString('en-us', { month: 'long' })}`);
        }

        
    }

    // Process the availability data to check for each day
    if(personalAvailability != null){displayAvailability(personalAvailability);}
    
    processAvailability(allUsersAvailability);
} catch (error) {
    console.error('Error loading all users availability:', error);
}
}

function processAvailability(allUsersAvailability) {
  const daysInMonth = 31; // Adjust based on the current month
  const allDays = {};

  // Initialize allDays object to store availability counts and states
  for (let i = 1; i <= daysInMonth; i++) {
      const day = i; // Adjust date format as needed
      allDays[day] = {
          totalAvailable: 0, // Number of users available
          totalUnavailable: 0, // Number of users explicitly unavailable
          totalNoRecord: 0, // Number of users with no record
          allUsersAvailable: true, // If all users with records are available
          atLeastOneUnavailable: false // If at least one user is unavailable
      };
  }

  // Aggregate availability data for each day
  allUsersAvailability.forEach((userAvailability) => {
      for (let day in allDays) {
          if (userAvailability[day] === true) {
              allDays[day].totalAvailable++;
          } else if (userAvailability[day] === false) {
              allDays[day].totalUnavailable++;
              allDays[day].atLeastOneUnavailable = true; // Mark that at least one user is unavailable
              allDays[day].allUsersAvailable = false; // If any user is unavailable, not all are available
          } else {
              allDays[day].totalNoRecord++; // No record for this user for this day
          }
      }
  });

  // Call the function to update the UI
  displayAggregatedAvailability(allDays);
}

function displayAggregatedAvailability(allDays) {
  const calendarContainer = document.getElementById('calendar-days');
  const dayDivs = calendarContainer.getElementsByClassName('month-day');

  // Loop through each day in the calendar
  for (let i = 0; i < dayDivs.length; i++) {
      const day = i + 1; // Day number (1-based index)
      const dayData = allDays[day];

      // Set background color based on availability status
      if (dayData.atLeastOneUnavailable) {
        dayDivs[i].classList.remove("available"); // Not available
        dayDivs[i].classList.add("not-available");
      } else if (dayData.totalAvailable > 0 && dayData.totalUnavailable === 0) {
        dayDivs[i].classList.remove("not-available"); // Available
        dayDivs[i].classList.add("available");
      }

      // Display the number of users available for the day
      const availabilityInfo = document.createElement('p');
      availabilityInfo.className = "availability-info";
      availabilityInfo.innerText = ` (${dayData.totalAvailable} / 6)`;
      dayDivs[i].appendChild(availabilityInfo);
  }
}

function displayAvailability(availability) {
  const calendarContainer = document.getElementById("calendar-days");
  const dayDivs = calendarContainer.getElementsByClassName("month-day");

  // Loop through the days in the calendar
  for (let i = 0; i < dayDivs.length; i++) {
    const day = i + 1; // Day number (1-based index)
    const isAvailable = availability[day]; // Check availability (modify the date format as needed)
  
    const indicator = dayDivs[i].getElementsByClassName("indicator");
    // Change background color based on availability
    if (isAvailable === true) {

      indicator[0].classList.remove("inot-available"); // Available
      indicator[0].classList.add("iavailable");
    } else if (isAvailable === false) {
      indicator[0].classList.remove("iavailable"); // Not available
      indicator[0].classList.add("inot-available");
    }
  }
}

document.getElementById("login-btn").addEventListener("click", login);
