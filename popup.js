chrome.storage.sync.get(["links", "gracePeriod_m"], (result) => {
  const gracePeriod_m = result.gracePeriod_m ?? 10;
  const gracePeriod_ms = gracePeriod_m * 60000;
  const schedule = { links: result.links ?? [] };
  formatDaysToArray(schedule);
  formatTime(schedule, gracePeriod_ms);

  const current = new Date();
  const daysOfTheWeek = ["Su", "M", "T", "W", "Th", "F", "Sa"];
  const currentDay = daysOfTheWeek[current.getDay()];
  const currentTime = new Date(
    `January 1, 1970 ${current.getHours()}:${current.getMinutes()}`
  );

  const currentSubject = getCurrentSubject(schedule, currentDay, currentTime);

  // Modify the frontend
  const currentLabel = document.querySelector(".current");
  const timeLabel = document.querySelector(".meeting-time");
  const linkButton = document.querySelector(".linkbutton");

  if (currentSubject) {
    currentLabel.innerText = currentSubject.name;
    timeLabel.innerText = currentSubject.timeText;
    linkButton.href = currentSubject.link;
    linkButton.classList.remove("is-disabled");
    linkButton.removeAttribute("aria-disabled");
  } else {
    currentLabel.innerText = "No meeting now";
    timeLabel.innerText = "Your next saved meeting will appear here.";
    linkButton.removeAttribute("href");
    linkButton.classList.add("is-disabled");
    linkButton.setAttribute("aria-disabled", "true");
  }
});

//open options page using button
const optionsButton = document.querySelector('#optionsButton');
optionsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
})


// ------------ functions
async function getScheduleJson(file) {
  const response = await fetch(chrome.runtime.getURL(file));
  const schedule = await response.json();
  return schedule;
}

function formatDaysToArray(schedule) {
  schedule["links"].forEach((subject) => {
    // Split the "days" string into array of days
    subject["days"] = subject["days"].split(/(?=[A-Z])/); // Use positive lookahead to split on uppercase letters without removing them
  });
}

// Format Time to [[start, end], [start, end], using formatTimeToArray and turn them into type Date
function formatTime(schedule, gracePeriod_ms) {
  formatTimeToArray(schedule);
  schedule["links"].forEach((subject) => {
    subject.timeText = subject["time"][0].join(" - ");
    subject["time"] = subject["time"].map((timeRange) => {
      return timeRange.map((time, index) => {
        if (index == 0) {
          const date = new Date(`January 1, 1970 ${time}`);
          return new Date(date.getTime() - gracePeriod_ms);
        } else return new Date(`January 1, 1970 ${time}`);
      });
    });
  });
}

function formatTimeToArray(schedule) {
  schedule["links"].forEach((subject) => {
    // Split the "time" string into array of times
    subject["time"] = subject["time"].split(" ");
  });

  // Split the timerange into array [start, end]
  schedule["links"].forEach((subject) => {
    subject["time"] = subject["time"].map((timeRange) => timeRange.split("-"));
  });
}

function getCurrentSubject(schedule, targetDay, targetTime) {
  let returnValue = false;
  schedule["links"].forEach((subject) => {
    const indexPossible = subject["days"].findIndex((day) => day == targetDay);
    if (
      indexPossible != -1 &&
      subject["time"][0][0].getTime() < targetTime.getTime() &&
      subject["time"][0][1].getTime() > targetTime.getTime()
    ) {
      returnValue = subject;
    }
  });
  return returnValue;
}
