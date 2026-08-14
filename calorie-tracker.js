/* ========================================
   CALORIE TRACKER
   script.js
======================================== */

const STORAGE_KEY = "calorieTrackerData";

let appData = loadData();


/* ========================================
   DOM ELEMENTS
======================================== */

const foodForm =
  document.getElementById("foodForm");

const foodNameInput =
  document.getElementById("foodName");

const caloriesInput =
  document.getElementById("calories");

const mealInput =
  document.getElementById("meal");

const workoutForm =
  document.getElementById("workoutForm");

const workoutNameInput =
  document.getElementById("workoutName");

const workoutCaloriesInput =
  document.getElementById("workoutCalories");

const workoutDurationInput =
  document.getElementById("workoutDuration");

const foodList =
  document.getElementById("foodList");

const workoutList =
  document.getElementById("workoutList");

const historyList =
  document.getElementById("historyList");

const consumedCalories =
  document.getElementById("consumedCalories");

const workoutCalories =
  document.getElementById("workoutCalories");

const netCalories =
  document.getElementById("netCalories");

const dailyGoal =
  document.getElementById("dailyGoal");

const remainingCalories =
  document.getElementById("remainingCalories");

const remainingLabel =
  document.getElementById("remainingLabel");

const yesterdayCalories = document.getElementById('yesterdayCalories');
const weeklyAvg = document.getElementById('weeklyAvg');

const goalButton =
  document.getElementById("goalButton");

const progressCircle =
  document.getElementById("progressCircle");

const clearTodayButton =
  document.getElementById("clearTodayButton");

const clearHistoryButton =
  document.getElementById("clearHistoryButton");

const exportBackupButton = document.getElementById('exportBackup');
const importBackupButton = document.getElementById('importBackup');
const backupFileInput = document.getElementById('backupFileInput');

const foodDateInput = document.getElementById('foodDate');
const workoutDateInput = document.getElementById('workoutDate');

const todayDate =
  document.getElementById("todayDate");

const toast =
  document.getElementById("toast");

const chartRange =
  document.getElementById("chartRange");

const chartCanvas =
  document.getElementById("calorieChart");

const pageTabs =
  document.querySelectorAll(".page-tab");

function switchFormPage(targetId) {
  const targetTab =
    document.querySelector(
      `.page-tab[data-target="${targetId}"]`
    );

  if (!targetTab) {
    return;
  }

  const group = targetTab.dataset.group;

  if (group) {
    const groupTabs =
      document.querySelectorAll(
        `.page-tab[data-group="${group}"]`
      );

    groupTabs.forEach(tab => {
      tab.classList.toggle(
        "active",
        tab.dataset.target === targetId
      );
    });

    const groupSections =
      document.querySelectorAll(
        `.page-section[data-group="${group}"], .today-page-section[data-group="${group}"]`
      );

    groupSections.forEach(section => {
      section.classList.toggle(
        "active",
        section.id === targetId
      );
    });
  }
}


/* ========================================
   INITIALIZE
======================================== */

initialize();


function initialize() {

  displayTodayDate();

  // set default date inputs to today if present
  const todayKey = getTodayKey();
  if (foodDateInput) foodDateInput.value = todayKey;
  if (workoutDateInput) workoutDateInput.value = todayKey;

  // backup buttons
  if (exportBackupButton) exportBackupButton.addEventListener('click', exportBackup);
  if (importBackupButton) importBackupButton.addEventListener('click', () => backupFileInput && backupFileInput.click());
  if (backupFileInput) backupFileInput.addEventListener('change', handleBackupFile);

  render();

  pageTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      switchFormPage(tab.dataset.target);
    });
  });

  switchFormPage("foodPage");

}


// Register service worker for PWA install (best-effort, only on secure origins)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => console.log('Service worker registered.', reg))
      .catch((err) => console.warn('Service worker registration failed:', err));
  });
} else {
  console.log('Service worker not registered: not a secure origin or service workers unsupported.');
}


/* ========================================
   STORAGE
======================================== */

function loadData() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);


    if (!saved) {

      return {
        goal: 1650,
        days: {}
      };

    }


    const parsed =
      JSON.parse(saved);


    return {

      /*
        Existing users will keep their
        existing goal.

        New users get 1650.
      */

      goal:
        Number(parsed.goal) > 0
          ? Number(parsed.goal)
          : 1650,

      days:
        parsed.days &&
        typeof parsed.days === "object"
          ? parsed.days
          : {}

    };

  } catch (error) {

    console.error(
      "Error loading localStorage:",
      error
    );


    return {
      goal: 1650,
      days: {}
    };

  }

}


function saveData() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(appData)
    );

  } catch (error) {

    console.error(
      "Error saving data:",
      error
    );

    showToast(
      "Could not save data"
    );

  }

}


/* ========================================
   DATE FUNCTIONS
======================================== */

function getTodayKey() {

  const date =
    new Date();


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

}


function getDateKey(date) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

}


function getDateDaysAgo(daysAgo) {

  const date =
    new Date();

  date.setHours(
    12,
    0,
    0,
    0
  );

  date.setDate(
    date.getDate() - daysAgo
  );

  return date;

}


function displayTodayDate() {

  todayDate.textContent =
    new Intl.DateTimeFormat(
      undefined,
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    ).format(new Date());

}


function formatHistoryDate(dateString) {

  const today =
    getTodayKey();


  if (dateString === today) {
    return "Today";
  }


  const date =
    new Date(
      `${dateString}T12:00:00`
    );


  return new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  ).format(date);

}


/* ========================================
   NUMBER FORMAT
======================================== */

function formatNumber(number) {

  return new Intl.NumberFormat()
    .format(number);

}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


/* ========================================
   DATA HELPERS
======================================== */

function getTodayData() {

  const today =
    getTodayKey();


  if (!appData.days[today]) {

    appData.days[today] = {
      food: [],
      workouts: []
    };

  }


  /*
    Compatibility with the older version
    of the app.
  */

  if (
    Array.isArray(
      appData.days[today]
    )
  ) {

    appData.days[today] = {
      food:
        appData.days[today],

      workouts: []
    };

  }


  if (
    !Array.isArray(
      appData.days[today].food
    )
  ) {

    appData.days[today].food = [];

  }


  if (
    !Array.isArray(
      appData.days[today].workouts
    )
  ) {

    appData.days[today].workouts = [];

  }


  return appData.days[today];

}


function getDayData(dateKey) {

  const data =
    appData.days[dateKey];


  if (!data) {

    return {
      food: [],
      workouts: []
    };

  }


  /*
    Support old data format.
  */

  if (Array.isArray(data)) {

    return {
      food: data,
      workouts: []
    };

  }


  return {

    food:
      Array.isArray(data.food)
        ? data.food
        : [],

    workouts:
      Array.isArray(data.workouts)
        ? data.workouts
        : []

  };

}


function getFoodTotal(dateKey) {

  return getDayData(dateKey)
    .food
    .reduce(
      (total, item) =>
        total + Number(item.calories || 0),
      0
    );

}


function getWorkoutTotal(dateKey) {

  return getDayData(dateKey)
    .workouts
    .reduce(
      (total, item) =>
        total + Number(item.calories || 0),
      0
    );

}


function getNetCalories(dateKey) {

  return (
    getFoodTotal(dateKey) -
    getWorkoutTotal(dateKey)
  );

}


/* ========================================
   MAIN RENDER
======================================== */

function render() {

  renderSummary();

  renderFoodList();

  renderWorkoutList();

  renderHistory();

  drawChart();

}


/* ========================================
   SUMMARY
======================================== */

function renderSummary() {

  const today =
    getTodayKey();


  const food =
    getFoodTotal(today);


  const workout =
    getWorkoutTotal(today);


  const net =
    food - workout;


  const goal =
    appData.goal;


  /*
    The workout calories are subtracted
    from the food calories.

    Example:

    Food     = 2000
    Workout  = 400
    Net      = 1600

    Goal     = 1650

    Remaining = 50
  */

  const difference =
    goal - net;


  /*
    Progress uses NET calories.
  */

  const progress =
    Math.min(
      Math.max(net / goal, 0),
      1
    );


  consumedCalories.textContent =
    `${formatNumber(food)} kcal`;


  workoutCalories.textContent =
    `${formatNumber(workout)} kcal`;


  netCalories.textContent =
    `${formatNumber(net)} kcal`;


  dailyGoal.textContent =
    `${formatNumber(goal)} kcal`;


  goalButton.textContent =
    `Goal: ${formatNumber(goal)} kcal`;

  // Yesterday net calories (show arrow comparing TODAY vs YESTERDAY)
  if (yesterdayCalories) {
    const yDate = getDateKey(getDateDaysAgo(1));
    const yNet = getNetCalories(yDate);
    // render number and placeholder trend span
    yesterdayCalories.innerHTML = `${formatNumber(yNet)} kcal <span id="yesterdayTrend" class="trend"></span>`;
    const yTrendEl = document.getElementById('yesterdayTrend');
    if (yTrendEl) {
      const todayNet = net; // computed above
      if (todayNet < yNet) {
        yTrendEl.textContent = '▼';
        yTrendEl.classList.remove('bad');
        yTrendEl.classList.add('good');
      } else if (todayNet > yNet) {
        yTrendEl.textContent = '▲';
        yTrendEl.classList.remove('good');
        yTrendEl.classList.add('bad');
      } else {
        yTrendEl.textContent = '';
        yTrendEl.classList.remove('good', 'bad');
      }
    }
  }

  // Weekly 7-day average (compare current 7-day avg vs previous 7-day avg)
  if (weeklyAvg) {
    const dates14 = getDailyChartDates(14); // oldest -> newest
    const prevWeek = dates14.slice(0,7);
    const curWeek = dates14.slice(7);
    const sum = arr => arr.reduce((s,d)=> s + getNetCalories(d), 0);
    const prevAvg = sum(prevWeek) / 7;
    const curAvg = sum(curWeek) / 7;
    weeklyAvg.innerHTML = `${formatNumber(Math.round(curAvg))} kcal <span id="weeklyTrend" class="trend"></span>`;
    const wTrendEl = document.getElementById('weeklyTrend');
    if (wTrendEl) {
      if (curAvg < prevAvg) {
        wTrendEl.textContent = '▼';
        wTrendEl.classList.remove('bad');
        wTrendEl.classList.add('good');
      } else if (curAvg > prevAvg) {
        wTrendEl.textContent = '▲';
        wTrendEl.classList.remove('good');
        wTrendEl.classList.add('bad');
      } else {
        wTrendEl.textContent = '';
        wTrendEl.classList.remove('good', 'bad');
      }
    }
  }


  remainingCalories.textContent =
    formatNumber(
      Math.abs(difference)
    );


  if (difference >= 0) {

    remainingLabel.textContent =
      "remaining";

    remainingCalories.style.color =
      "#17211b";

  } else {

    remainingLabel.textContent =
      "over goal";

    remainingCalories.style.color =
      "#ef4444";

  }


  progressCircle.style.setProperty(
    "--progress",
    `${progress * 360}deg`
  );

  // Color the progress arc with a single color that shifts green->yellow->red based on progress
  try {
    const capped = Math.max(0, Math.min(progress, 1));
    const progressDeg = capped * 360;

    const hexToRgb = (hex) => {
      const h = hex.replace('#','');
      return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
    };

    const rgbToHex = (r,g,b) => {
      const toHex = (v) => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const mix = (c1, c2, t) => [c1[0] + (c2[0]-c1[0])*t, c1[1] + (c2[1]-c1[1])*t, c1[2] + (c2[2]-c1[2])*t];

    const green = hexToRgb('#22c55e');
    const yellow = hexToRgb('#facc15');
    const red = hexToRgb('#ef4444');

    let colorRgb;
    if (capped <= 0.5) {
      const t = capped / 0.5;
      colorRgb = mix(green, yellow, t);
    } else {
      const t = (capped - 0.5) / 0.5;
      colorRgb = mix(yellow, red, t);
    }

    const colorHex = rgbToHex(colorRgb[0], colorRgb[1], colorRgb[2]);

    // single-color arc from 0 -> progressDeg, rest is track
    progressCircle.style.background = `conic-gradient(${colorHex} 0deg, ${colorHex} ${progressDeg}deg, #e7eee9 ${progressDeg}deg)`;
  } catch (e) {
    console.error('Progress circle color update failed', e);
  }

}


/* ========================================
   ADD FOOD
======================================== */

foodForm.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();


    const name =
      foodNameInput.value.trim();


    const calories =
      Number(
        caloriesInput.value
      );


    const meal =
      mealInput.value;


    if (!name) {

      showToast(
        "Please enter a food name"
      );

      foodNameInput.focus();

      return;

    }


    if (
      !Number.isFinite(calories) ||
      calories < 0
    ) {

      showToast(
        "Please enter valid calories"
      );

      caloriesInput.focus();

      return;

    }


    const dateKey = (foodDateInput && foodDateInput.value) ? foodDateInput.value : getTodayKey();

    if (!appData.days[dateKey]) {
      appData.days[dateKey] = { food: [], workouts: [] };
    }

    const day = appData.days[dateKey];

    day.food.push({

      id:
        createId(),

      name:
        name,

      calories:
        Math.round(calories),

      meal:
        meal || "Snack",

      createdAt:
        Date.now()

    });


    saveData();

    foodForm.reset();
    // reset date back to today
    if (foodDateInput) foodDateInput.value = getTodayKey();

    render();


    showToast(
      "Food added successfully"
    );


    foodNameInput.focus();

  }
);


/* ========================================
   ADD WORKOUT
======================================== */

workoutForm.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();


    const name =
      workoutNameInput.value.trim();


    const calories =
      Number(
        workoutCaloriesInput.value
      );


    const duration =
      Number(
        workoutDurationInput.value
      ) || 0;


    if (!name) {

      showToast(
        "Please enter a workout name"
      );

      workoutNameInput.focus();

      return;

    }


    if (
      !Number.isFinite(calories) ||
      calories < 0
    ) {

      showToast(
        "Please enter valid workout calories"
      );

      workoutCaloriesInput.focus();

      return;

    }


    const dateKey = (workoutDateInput && workoutDateInput.value) ? workoutDateInput.value : getTodayKey();

    if (!appData.days[dateKey]) {
      appData.days[dateKey] = { food: [], workouts: [] };
    }

    const day = appData.days[dateKey];

    day.workouts.push({

      id:
        createId(),

      name:
        name,

      calories:
        Math.round(calories),

      duration:
        Math.round(duration),

      createdAt:
        Date.now()

    });


    saveData();

    workoutForm.reset();
    if (workoutDateInput) workoutDateInput.value = getTodayKey();

    render();


    showToast(
      "Workout added successfully"
    );


    workoutNameInput.focus();

  }
);


/* ========================================
   CREATE ID
======================================== */

function createId() {

  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2)
  );

}


/* ========================================
   RENDER FOOD
======================================== */

function renderFoodList() {

  const entries =
    getTodayData().food;


  if (entries.length === 0) {

    foodList.innerHTML = `
      <div class="empty">
        No food added today yet.
      </div>
    `;

    return;

  }


  foodList.innerHTML =
    [...entries]
      .reverse()
      .map(
        item => `

          <div class="food-item">

            <div>

              <div class="food-name">
                ${escapeHTML(item.name)}
              </div>

              <div class="food-meal">
                ${escapeHTML(item.meal || "Snack")}
              </div>

            </div>


            <div class="food-right">

              <div class="food-calories">
                ${formatNumber(item.calories)} kcal
              </div>


              <button
                type="button"
                class="delete-button"
                data-food-id="${escapeHTML(item.id)}"
                aria-label="Delete food"
              >
                ×
              </button>

            </div>

          </div>

        `
      )
      .join("");


  foodList
    .querySelectorAll(
      "[data-food-id]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        function() {

          deleteFood(
            this.dataset.foodId
          );

        }
      );

    });

}


/* ========================================
   DELETE FOOD
======================================== */

function deleteFood(id) {

  const today =
    getTodayKey();


  const day =
    getTodayData();


  day.food =
    day.food.filter(
      item => item.id !== id
    );


  saveData();

  render();


  showToast(
    "Food entry deleted"
  );

}


/* ========================================
   RENDER WORKOUTS
======================================== */

function renderWorkoutList() {

  const entries =
    getTodayData().workouts;


  if (entries.length === 0) {

    workoutList.innerHTML = `
      <div class="empty">
        No workouts added today yet.
      </div>
    `;

    return;

  }


  workoutList.innerHTML =
    [...entries]
      .reverse()
      .map(
        item => {

          const durationText =
            item.duration > 0
              ? `${item.duration} min`
              : "Workout";


          return `

            <div class="workout-item">

              <div>

                <div class="workout-name">
                  ${escapeHTML(item.name)}
                </div>

                <div class="workout-duration">
                  ${durationText}
                </div>

              </div>


              <div class="workout-right">

                <div class="workout-calories">
                  -${formatNumber(item.calories)} kcal
                </div>


                <button
                  type="button"
                  class="delete-button"
                  data-workout-id="${escapeHTML(item.id)}"
                  aria-label="Delete workout"
                >
                  ×
                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");


  workoutList
    .querySelectorAll(
      "[data-workout-id]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        function() {

          deleteWorkout(
            this.dataset.workoutId
          );

        }
      );

    });

}


/* ========================================
   DELETE WORKOUT
======================================== */

function deleteWorkout(id) {

  const day =
    getTodayData();


  day.workouts =
    day.workouts.filter(
      item => item.id !== id
    );


  saveData();

  render();


  showToast(
    "Workout deleted"
  );

}


/* ========================================
   CHANGE GOAL
======================================== */

goalButton.addEventListener(
  "click",
  function() {

    const newGoal =
      prompt(
        "Enter your daily calorie goal:",
        appData.goal
      );


    if (newGoal === null) {
      return;
    }


    const goal =
      Number(newGoal);


    if (
      !Number.isFinite(goal) ||
      goal <= 0
    ) {

      showToast(
        "Please enter a valid calorie goal"
      );

      return;

    }


    appData.goal =
      Math.round(goal);


    saveData();

    render();


    showToast(
      "Daily goal updated"
    );

  }
);


/* ========================================
   CLEAR TODAY
======================================== */

clearTodayButton.addEventListener(
  "click",
  function() {

    const today =
      getTodayKey();


    if (
      !appData.days[today]
    ) {

      showToast(
        "Nothing to clear"
      );

      return;

    }


    const confirmed =
      confirm(
        "Delete all food and workout entries for today?"
      );


    if (!confirmed) {
      return;
    }


    delete appData.days[today];


    saveData();

    render();


    showToast(
      "Today's entries cleared"
    );

  }
);


/* ========================================
   CLEAR HISTORY
======================================== */

clearHistoryButton.addEventListener(
  "click",
  function() {

    const dates =
      Object.keys(
        appData.days
      );


    if (dates.length === 0) {

      showToast(
        "History is already empty"
      );

      return;

    }


    const confirmed =
      confirm(
        "Delete all calorie history? This cannot be undone."
      );


    if (!confirmed) {
      return;
    }


    appData.days = {};


    saveData();

    render();


    showToast(
      "Calorie history cleared"
    );

  }
);


/* ========================================
   HISTORY
======================================== */

function renderHistory() {

  const dates =
    Object.keys(
      appData.days
    )
      .sort()
      .reverse()
      .slice(0, 14);


  if (dates.length === 0) {

    historyList.innerHTML = `
      <div class="empty">
        Your calorie history will appear here.
      </div>
    `;

    return;

  }


  historyList.innerHTML =
    dates
      .map(
        date => {

          const food =
            getFoodTotal(date);


          const workout =
            getWorkoutTotal(date);


          const net =
            food - workout;


          const difference =
            appData.goal - net;


          let status;


          if (difference >= 0) {

            status =
              `${formatNumber(difference)} kcal under goal`;

          } else {

            status =
              `${formatNumber(
                Math.abs(difference)
              )} kcal over goal`;

          }


          return `

            <div class="history-row">

              <div class="history-date">
                ${formatHistoryDate(date)}
              </div>

              <div class="history-calories">
                Net: ${formatNumber(net)} kcal
              </div>

              <div class="history-status">
                Food ${formatNumber(food)} ·
                Workout ${formatNumber(workout)} ·
                ${status}
              </div>

            </div>

          `;

        }
      )
      .join("");

}


/* ========================================
   CHART RANGE
======================================== */

chartRange.addEventListener(
  "change",
  function() {

    drawChart();

  }
);


/* ========================================
   DATE HELPERS FOR CHART
======================================== */

function getChartDateKey(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


/* ========================================
   DAILY DATES
======================================== */

function getDailyChartDates(days) {

  const dates = [];

  for (
    let i = days - 1;
    i >= 0;
    i--
  ) {

    const date =
      new Date();

    date.setHours(
      12,
      0,
      0,
      0
    );

    date.setDate(
      date.getDate() - i
    );

    dates.push(
      getChartDateKey(date)
    );

  }

  return dates;

}


/* ========================================
   GET START OF WEEK
======================================== */

function getStartOfWeek(date) {

  const result =
    new Date(date);

  result.setHours(
    12,
    0,
    0,
    0
  );


  /*
    Monday = first day of week
  */

  const day =
    result.getDay();


  const difference =
    day === 0
      ? -6
      : 1 - day;


  result.setDate(
    result.getDate() + difference
  );


  return result;

}


/* ========================================
   GET WEEKLY DATA
======================================== */

function getWeeklyChartData(numberOfWeeks) {

  const weeks = [];


  const currentWeek =
    getStartOfWeek(
      new Date()
    );


  /*
    Build oldest -> newest
  */

  for (
    let i = numberOfWeeks - 1;
    i >= 0;
    i--
  ) {

    const start =
      new Date(currentWeek);


    start.setDate(
      start.getDate() -
      (i * 7)
    );


    const end =
      new Date(start);


    end.setDate(
      end.getDate() + 6
    );


    let food = 0;
    let workout = 0;


    /*
      Add every day in the week
    */

    for (
      let day = 0;
      day < 7;
      day++
    ) {

      const current =
        new Date(start);


      current.setDate(
        current.getDate() + day
      );


      const dateKey =
        getChartDateKey(current);


      food +=
        getFoodTotal(dateKey);


      workout +=
        getWorkoutTotal(dateKey);

    }


    weeks.push({

      label:
        formatWeekLabel(
          start,
          end
        ),

      food:
        food,

      workout:
        workout,

      net:
        food - workout,

      goal:
        appData.goal * 7

    });

  }


  return weeks;

}


/* ========================================
   WEEK LABEL
======================================== */

function formatWeekLabel(
  start,
  end
) {

  const startText =
    new Intl.DateTimeFormat(
      undefined,
      {
        month: "short",
        day: "numeric"
      }
    ).format(start);


  const endText =
    new Intl.DateTimeFormat(
      undefined,
      {
        month: "short",
        day: "numeric"
      }
    ).format(end);


  return `${startText} - ${endText}`;

}


/* ========================================
   GET START OF MONTH
======================================== */

function getStartOfMonth(date) {

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    12
  );

}


/* ========================================
   GET MONTHLY DATA
======================================== */

function getMonthlyChartData(
  numberOfMonths
) {

  const months = [];


  const currentMonth =
    getStartOfMonth(
      new Date()
    );


  /*
    Build oldest -> newest
  */

  for (
    let i = numberOfMonths - 1;
    i >= 0;
    i--
  ) {

    const monthStart =
      new Date(
        currentMonth
      );


    monthStart.setMonth(
      monthStart.getMonth() - i
    );


    const year =
      monthStart.getFullYear();


    const month =
      monthStart.getMonth();


    /*
      Last day of month
    */

    const lastDay =
      new Date(
        year,
        month + 1,
        0,
        12
      ).getDate();


    let food = 0;
    let workout = 0;


    /*
      Add every day in month
    */

    for (
      let day = 1;
      day <= lastDay;
      day++
    ) {

      const date =
        new Date(
          year,
          month,
          day,
          12
        );


      const dateKey =
        getChartDateKey(date);


      food +=
        getFoodTotal(dateKey);


      workout +=
        getWorkoutTotal(dateKey);

    }


    months.push({

      label:
        new Intl.DateTimeFormat(
          undefined,
          {
            month: "short",
            year: "2-digit"
          }
        ).format(monthStart),

      food:
        food,

      workout:
        workout,

      net:
        food - workout,

      /*
        Number of days in month
      */

      goal:
        appData.goal * lastDay

    });

  }


  return months;

}


/* ========================================
   DAILY CHART DATA
======================================== */

function getDailyChartData(days) {

  const dates =
    getDailyChartDates(days);


  return dates.map(
    date => ({

      label:
        formatShortDate(date),

      food:
        getFoodTotal(date),

      workout:
        getWorkoutTotal(date),

      net:
        getNetCalories(date),

      goal:
        appData.goal

    })
  );

}


/* ========================================
   SHORT DATE
======================================== */

function formatShortDate(
  dateString
) {

  const date =
    new Date(
      `${dateString}T12:00:00`
    );


  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  ).format(date);

}


/* ========================================
   DRAW CHART
======================================== */

function drawChart() {

  const canvas =
    chartCanvas;


  const wrapper =
    canvas.parentElement;


  const width =
    wrapper.clientWidth;


  const height =
    wrapper.clientHeight;


  if (
    width <= 0 ||
    height <= 0
  ) {

    return;

  }


  const dpr =
    window.devicePixelRatio || 1;


  canvas.width =
    width * dpr;


  canvas.height =
    height * dpr;


  canvas.style.width =
    `${width}px`;


  canvas.style.height =
    `${height}px`;


  const ctx =
    canvas.getContext("2d");


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const selectedRange =
    chartRange.value;


  let data;


  /*
    ------------------------------
    DAILY
    ------------------------------
  */

  if (
    selectedRange === "7days"
  ) {

    data =
      getDailyChartData(7);

  }


  /*
    ------------------------------
    LAST 4 WEEKS
    ------------------------------
  */

  else if (
    selectedRange === "4weeks"
  ) {

    data =
      getDailyChartData(28);

  }


  /*
    ------------------------------
    LAST 30 DAYS
    ------------------------------
  */

  else if (
    selectedRange === "30days"
  ) {

    data =
      getDailyChartData(30);

  }


  /*
    ------------------------------
    LAST 7 WEEKS
    ------------------------------
  */

  else if (
    selectedRange === "7weeks"
  ) {

    data =
      getWeeklyChartData(7);

  }


  /*
    ------------------------------
    LAST 7 MONTHS
    ------------------------------
  */

  else if (
    selectedRange === "7months"
  ) {

    data =
      getMonthlyChartData(7);

  }


  if (!data || data.length === 0) {
    return;
  }


  const foodData =
    data.map(
      item => item.food
    );


  const workoutData =
    data.map(
      item => item.workout
    );


  const netData =
    data.map(
      item => item.net
    );


  const goalData =
    data.map(
      item => item.goal
    );


  const allValues = [

    ...foodData,

    ...workoutData,

    ...netData,

    ...goalData,

    0

  ];


  const maxValue =
    Math.max(
      ...allValues
    );


  /*
    Add 15% space above
    the largest value.
  */

  const chartMax =
    Math.max(
      100,
      Math.ceil(
        (maxValue * 1.15) / 100
      ) * 100
    );


  const padding = {

    top: 25,

    right: 25,

    bottom: 48,

    left: 55

  };


  const chartWidth =
    width -
    padding.left -
    padding.right;


  const chartHeight =
    height -
    padding.top -
    padding.bottom;


  /*
    Grid
  */

  drawGrid(
    ctx,
    padding,
    chartWidth,
    chartHeight,
    chartMax
  );


  /*
    Goal
  */

  drawLine(
    ctx,
    goalData,
    "#9ca3af",
    1.5,
    padding,
    chartWidth,
    chartHeight,
    chartMax,
    true
  );


  /*
    Food
  */

  drawLine(
    ctx,
    foodData,
    "#3b82f6",
    2.5,
    padding,
    chartWidth,
    chartHeight,
    chartMax,
    false
  );


  /*
    Workout
  */

  drawLine(
    ctx,
    workoutData,
    "#f97316",
    2.5,
    padding,
    chartWidth,
    chartHeight,
    chartMax,
    false
  );


  /*
    Net
  */

  drawLine(
    ctx,
    netData,
    "#8b5cf6",
    3,
    padding,
    chartWidth,
    chartHeight,
    chartMax,
    false
  );


  /*
    X axis
  */

  drawXAxisLabels(
    ctx,
    data,
    padding,
    chartWidth,
    chartHeight
  );

}


/* ========================================
   GRID
======================================== */

function drawGrid(
  ctx,
  padding,
  chartWidth,
  chartHeight,
  chartMax
) {

  const gridLines = 5;


  ctx.font =
    "11px Arial";


  ctx.textAlign =
    "right";


  ctx.textBaseline =
    "middle";


  for (
    let i = 0;
    i <= gridLines;
    i++
  ) {

    const ratio =
      i / gridLines;


    const y =
      padding.top +
      chartHeight -
      ratio * chartHeight;


    const value =
      Math.round(
        ratio * chartMax
      );


    ctx.beginPath();

    ctx.moveTo(
      padding.left,
      y
    );

    ctx.lineTo(
      padding.left +
      chartWidth,
      y
    );


    ctx.strokeStyle =
      "#edf1ee";

    ctx.lineWidth =
      1;

    ctx.stroke();


    ctx.fillStyle =
      "#7b857f";


    ctx.fillText(
      formatNumber(value),
      padding.left - 9,
      y
    );

  }

}


/* ========================================
   DRAW LINE
======================================== */

function drawLine(
  ctx,
  data,
  color,
  lineWidth,
  padding,
  chartWidth,
  chartHeight,
  chartMax,
  dashed
) {

  if (
    data.length === 0
  ) {

    return;

  }


  const step =
    data.length === 1
      ? chartWidth
      : chartWidth /
        (data.length - 1);


  const points =
    data.map(
      (value, index) => {

        const x =
          padding.left +
          index * step;


        const y =
          padding.top +
          chartHeight -
          (
            value /
            chartMax
          ) *
          chartHeight;


        return {
          x,
          y
        };

      }
    );


  ctx.beginPath();


  points.forEach(
    (point, index) => {

      if (index === 0) {

        ctx.moveTo(
          point.x,
          point.y
        );

      } else {

        ctx.lineTo(
          point.x,
          point.y
        );

      }

    }
  );


  ctx.strokeStyle =
    color;

  ctx.lineWidth =
    lineWidth;

  ctx.lineCap =
    "round";

  ctx.lineJoin =
    "round";


  if (dashed) {

    ctx.setLineDash(
      [6, 5]
    );

  } else {

    ctx.setLineDash([]);

  }


  ctx.stroke();


  ctx.setLineDash([]);


  /*
    Don't draw dots for
    the goal line.
  */

  if (dashed) {
    return;
  }


  points.forEach(
    point => {

      ctx.beginPath();


      ctx.arc(
        point.x,
        point.y,
        3.5,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        "#ffffff";

      ctx.fill();


      ctx.strokeStyle =
        color;

      ctx.lineWidth =
        2;

      ctx.stroke();

    }
  );

}


/* ========================================
   X AXIS LABELS
======================================== */

function drawXAxisLabels(
  ctx,
  data,
  padding,
  chartWidth,
  chartHeight
) {

  const count =
    data.length;


  /*
    Decide how many labels
    should be displayed.
  */

  let labelEvery = 1;


  if (count > 14) {

    labelEvery = 4;

  }


  if (count <= 7) {

    labelEvery = 1;

  }


  const step =
    count === 1
      ? chartWidth
      : chartWidth /
        (count - 1);


  ctx.font =
    "11px Arial";

  ctx.fillStyle =
    "#7b857f";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "top";


  data.forEach(
    (item, index) => {

      /*
        Always show the final label.
      */

      if (
        index % labelEvery !== 0 &&
        index !== count - 1
      ) {

        return;

      }


      const x =
        padding.left +
        index * step;


      ctx.fillText(
        item.label,
        x,
        padding.top +
        chartHeight +
        13
      );

    }
  );

}


/* ========================================
   BACKUP / RESTORE
======================================== */

function exportBackup() {
  try {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = `calorie-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup exported');
  } catch (err) {
    console.error(err);
    showToast('Backup export failed');
  }
}

function handleBackupFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(String(e.target.result));
      const ok = confirm('Restore backup? This will replace current data.');
      if (!ok) return;
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid backup');
      appData = parsed;
      saveData();
      render();
      showToast('Backup restored');
    } catch (err) {
      console.error(err);
      showToast('Invalid backup file');
    }
  };
  reader.readAsText(file);
  // clear input so same file can be selected again
  event.target.value = '';
}