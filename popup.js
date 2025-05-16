getScheduleJson('schedule.json').then(schedule => {
    formatDaysToArray(schedule);
    formatTime(schedule);
    console.log(schedule);

    const current = new Date();
    const daysOfTheWeek = ["N/A", "M", "T", "W", "Th", "F", "S"]
    const currentDay = daysOfTheWeek[current.getDay()]
    const currentTime = new Date(`January 1, 1970 ${current.getHours()}:${current.getMinutes()}`)

    const currentSubject = getCurrentSubject(schedule, currentDay, currentTime)
    if(currentSubject){
        console.log(currentSubject)
        document.querySelector(".current").innerText = currentSubject.name;
        document.querySelector(".linkbutton").href = currentSubject.link;
    }
    else{
        console.log("No subject")
    }
})

// ------------ functions
async function getScheduleJson(file){
    const response = await fetch(chrome.runtime.getURL(file));
    const schedule = await response.json();
    return schedule;
}

function formatDaysToArray(schedule){
    schedule["links"].forEach((subject) => {
        // Split the "days" string into array of days
        subject["days"] = subject["days"].split(/(?=[A-Z])/); // Use positive lookahead to split on uppercase letters without removing them
    });
}


// Format Time to [[start, end], [start, end], using formatTimeToArray and turn them into type Date
function formatTime(schedule){
    formatTimeToArray(schedule);
    schedule["links"].forEach((subject) => {
        subject["time"] = subject["time"].map((timeRange) => {
            return timeRange.map((time) => {
                return new Date(`January 1, 1970 ${time}`)
            })
        })
    })
    
}

function formatTimeToArray(schedule){
    schedule["links"].forEach((subject) => {
        // Split the "time" string into array of times
        subject["time"] = subject["time"].split(" ");
    });

    // Split the timerange into array [start, end] 
    schedule["links"].forEach((subject) => {
        subject["time"] = subject["time"].map((timeRange) => timeRange.split("-"))
    })
}

function getCurrentSubject(schedule, targetDay, targetTime){
    let returnValue = false;
    schedule["links"].forEach((subject) => {
        indexPossible = subject["days"].findIndex(day => day == targetDay)
        if(indexPossible != -1 
            && subject["time"][indexPossible][0].getTime() < targetTime.getTime()
            && subject["time"][indexPossible][1].getTime() > targetTime.getTime())
        { returnValue = subject; }
    })
    return returnValue;
}