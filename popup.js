getScheduleJson('schedule.json').then(schedule => {
    console.log(schedule);
    formatDaysToArray(schedule);
    console.log(schedule);

    const current = new Date();
    const currentDay = current.getDay();

    schedule["links"]

})



async function getScheduleJson(file){
    const response = await fetch(chrome.runtime.getURL(file));
    const schedule = await response.json();
    return schedule;
}

function formatDaysToArray(schedule){
    schedule["links"].forEach((item) => {
        // Split the "days" string into an array of days
        item["days"] = item["days"].split(/(?=[A-Z])/); // Use positive lookahead to split on uppercase letters without removing them
    });
}