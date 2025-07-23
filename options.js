const schedule_form = document.getElementById('schedule_form');
console.log(schedule_form);

// Put current options in
let entry_id = 0;
const entries_section = document.getElementById('entries_section');
const schedule_template = document.getElementById('schedule_unit_template')
getScheduleJson('schedule.json').then(schedule => {
    schedule["links"].forEach(subject => {
        const clone = generateScheduleClone();
        const mainDiv = clone.querySelector('.schedule_unit');

        mainDiv.querySelector('[name="name"]').setAttribute('value', subject["name"]);
        mainDiv.querySelector('[name="link"]').setAttribute('value', subject["link"]);

        subject['time'] = subject['time'].split('-');
        mainDiv.querySelector('[name="timeStart"]').setAttribute('value', subject["time"][0]);
        mainDiv.querySelector('[name="timeEnd"]').setAttribute('value', subject["time"][1]);

        const boolDays = formatDaysToBooleanArray(subject["days"]);
        const dayInputs = mainDiv.querySelectorAll('[name^="day"]');
        boolDays.forEach((isOn, index) => {
            if(isOn){
                dayInputs[index].checked = true;
            }
        })

        entries_section.appendChild(clone);
    });
    entry_id;
})

//adding options
const addButton = document.querySelector('#add_schedule');
addButton.addEventListener("click", () => {
    const clone = generateScheduleClone();
    entries_section.appendChild(clone);
})

//saving autosave portion

//importing json

//exporting json

//submitting
schedule_form.addEventListener('submit', (event) => {
    event.preventDefault(); // Stop the default form submission
    const formData = new FormData(schedule_form);
    newFormData = formDataToObjectWithArrays(formData);;
    const newSched = [];
    
    //Format day array with delimeter "," (the hidden type input in the html)
    newFormData['day'] = formatDaysToJsonFriendly(newFormData['day'])

    //input into newSched Array
    newFormData['name'].forEach((name, index) => {
        newSched.push({
          name: name,
          days: newFormData["day"][index],
          time: `${newFormData["timeStart"][index]}-${newFormData["timeEnd"][index]}`,
          link: newFormData["link"][index],
        });
    })

    console.log(newSched);
    
    
    const schedJSON = { links: newSched };
    //const jsonString = JSON.stringify(schedJSON);
    chrome.storage.sync.set(schedJSON, () => {
        console.log("saved");
    })

    chrome.storage.sync.get(["links"], result => {
        console.log(result.links);
    })
})





// - functions -
async function getScheduleJson(file){
    const response = await fetch(chrome.runtime.getURL(file));
    const schedule = await response.json();
    return schedule;
}

function formatDaysToBooleanArray(dayString) {
    const days = ["M", "T", "W", "Th", "F", "Sa", "Su"];
    const boolArray = [false, false, false, false, false, false, false];
    const daysArray = dayString.split(/(?=[A-Z])/);
    daysArray.forEach(day => {
        index = days.indexOf(day);
        boolArray[index] = true;
    })
    return boolArray;
}

function generateScheduleClone(){
    const clone = schedule_template.content.cloneNode(true);
    const mainDiv = clone.querySelector(".schedule_unit");
    mainDiv.id = `s_${entry_id}`;

    // //id the days
    // const daysArray = clone.querySelectorAll('.day');
    // daysArray.forEach(day => {
    //     day.name = `day_${entry_id}`;
    // })

    // add the remove button's functionality
    const removeButton = clone.querySelector(".schedule_unit_x");
    removeButton.addEventListener("click", () => {
    console.log("remove clicked");
    removeButton.parentNode.remove();
    });

    entry_id++;
    return clone;
}

function formDataToObjectWithArrays(formData) {
  const obj = {};
  for (const [key, value] of formData.entries()) {
    if (obj[key]) {
      obj[key].push(value);
    } else {
      obj[key] = [value];
    }
  }
  return obj;
}

function formatDaysToJsonFriendly(daysArray){
    const newDays = [""];
    let index = 0;
    daysArray.forEach((day) => {
      if (day != ",") newDays[index] += day;
      else {
        index++;
        newDays[index] = "";
      }
    });
    newDays.pop();
    return newDays;
}