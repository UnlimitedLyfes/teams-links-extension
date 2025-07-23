getScheduleJson('schedule.json').then(schedule => {
    formatDaysToArray(schedule);
    formatTime(schedule);
    console.log(schedule);

    const current = new Date();
    const daysOfTheWeek = ["N/A", "M", "T", "W", "Th", "F", "S"]
    const currentDay = daysOfTheWeek[current.getDay()]
    const currentTime = new Date(`January 1, 1970 ${current.getHours()}:${current.getMinutes()}`)

    const currentSubject = getCurrentSubject(schedule, currentDay, currentTime)
    
    // Modify the frontend
    if(currentSubject){
        console.log(currentSubject)
        document.querySelector(".current").innerText = currentSubject.name;
        document.querySelector(".linkbutton").href = currentSubject.link;
    }
    else{
        document.querySelector(".current").innerText = "No Subject"
        document.querySelector(".linkbutton").href = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGFlMHpnM2xpaHc3anZtMGszeG40Z2duZ3ljejR0amR0dTEyZjg3YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wWgv8zPKP6Cw6brKfX/giphy.gif";
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
            return timeRange.map((time, index) => { 
                if(index == 0){ // To have 10 minutes allowance before subjects
                    const date = new Date(`January 1, 1970 ${time}`)
                    return new Date(date.getTime() - 600000) // 600000 ms is 10 minutes 
                }
                else
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
        indexPossible = subject["days"].findIndex(day => day == targetDay) // Find Index so that the day lines up with the time
        if (
          indexPossible != -1 &&
          subject["time"][0][0].getTime() < targetTime.getTime() && //originally [indexPossible][0] and [indexPossible][1] but i got rid 
          subject["time"][0][1].getTime() > targetTime.getTime()    //of having two times on two different days in one entry.
        ) {
          returnValue = subject;
        }
    })
    return returnValue;
}