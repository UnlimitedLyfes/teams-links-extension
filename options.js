const scheduleForm = document.getElementById("schedule_form");
const scheduleTemplate = document.getElementById("schedule_unit_template");
const entriesSection = document.getElementById("entries_section");
const addButton = document.getElementById("add_schedule");
const gracePeriodInput = document.getElementById("gracePeriodInput");
const importButton = document.getElementById("import");
const exportButton = document.getElementById("export");
const saveStatus = document.getElementById("saveStatus");
const emptyScheduleMessage = document.getElementById("emptyScheduleMessage");

let entryId = 0;
let saveTimer;

chrome.storage.sync.get(["links", "gracePeriod_m"], (result) => {
    const links = result.links ?? [];

    if (links.length === 0) {
        updateEmptyState();
    } else {
        links.forEach((subject) => {
            entriesSection.appendChild(generateScheduleClone(subject));
        });
        updateEmptyState();
    }

    gracePeriodInput.value = result.gracePeriod_m ?? 10;
    setStatus("Ready");
});

addButton.addEventListener("click", () => {
    entriesSection.appendChild(generateScheduleClone());
    updateEmptyState();
    setDirty();
});

gracePeriodInput.addEventListener("change", () => {
    const value = Number(gracePeriodInput.value);
    if (value < 0 || Number.isNaN(value)) {
        gracePeriodInput.value = 0;
    }

    chrome.storage.sync.set({ gracePeriod_m: gracePeriodInput.value }, () => {
        setStatus("Saved");
    });
});

importButton.addEventListener("change", () => {
    const file = importButton.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedSchedule = JSON.parse(event.target.result);
            if (!Array.isArray(importedSchedule.links)) {
                throw new Error("Missing links array");
            }

            chrome.storage.sync.set(importedSchedule, () => {
                location.reload();
            });
        } catch (error) {
            setStatus("Import failed", "error");
        }
    };

    reader.readAsText(file);
});

exportButton.addEventListener("click", () => {
    chrome.storage.sync.get(["links", "gracePeriod_m"], (result) => {
        const jsonString = JSON.stringify({
            links: result.links ?? [],
            gracePeriod_m: result.gracePeriod_m ?? 10,
        }, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "meeting-links-schedule.json";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    });
});

scheduleForm.addEventListener("input", (event) => {
    setDirty();

    if (event.target.name === "name") {
        const unit = event.target.closest(".schedule_unit");
        const title = unit.querySelector("h3");
        title.innerText = event.target.value.trim() || "Meeting";
    }
});

scheduleForm.addEventListener("focusin", (event) => {
    if (event.target.type === "time" && event.target.value === "") {
        event.target.value = "00:00";
    }
});

scheduleForm.addEventListener("change", () => {
    entriesSection.querySelectorAll(".schedule_unit.has-error").forEach((unit) => {
        unit.classList.remove("has-error");
    });
    setDirty();
});

scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const schedule = collectSchedule();
    if (!schedule) return;

    chrome.storage.sync.set({ links: schedule }, () => {
        setStatus("Saved");
    });
});

function generateScheduleClone(subject = {}) {
    const clone = scheduleTemplate.content.cloneNode(true);
    const mainDiv = clone.querySelector(".schedule_unit");
    mainDiv.id = `s_${entryId}`;

    const nameInput = mainDiv.querySelector('[name="name"]');
    const linkInput = mainDiv.querySelector('[name="link"]');
    const startInput = mainDiv.querySelector('[name="timeStart"]');
    const endInput = mainDiv.querySelector('[name="timeEnd"]');
    const title = mainDiv.querySelector("h3");

    nameInput.value = subject.name ?? "";
    linkInput.value = subject.link ?? "";

    const [startTime = "", endTime = ""] = (subject.time ?? "").split("-");
    startInput.value = startTime;
    endInput.value = endTime;
    title.innerText = subject.name || "Meeting";

    const activeDays = formatDaysToBooleanArray(subject.days ?? "");
    const dayInputs = mainDiv.querySelectorAll('input[name="day"]:not(.day-delimiter)');
    activeDays.forEach((isOn, index) => {
        dayInputs[index].checked = isOn;
    });

    const removeButton = mainDiv.querySelector(".schedule_unit_x");
    removeButton.addEventListener("click", () => {
        mainDiv.remove();
        updateEmptyState();
        setDirty();
    });

    entryId++;
    return clone;
}

function collectSchedule() {
    const units = [...entriesSection.querySelectorAll(".schedule_unit")];
    const schedule = [];

    for (const unit of units) {
        const nameInput = unit.querySelector('[name="name"]');
        const linkInput = unit.querySelector('[name="link"]');
        const startInput = unit.querySelector('[name="timeStart"]');
        const endInput = unit.querySelector('[name="timeEnd"]');
        const checkedDays = [...unit.querySelectorAll('input[name="day"]:checked')]
            .filter((input) => input.value !== ",")
            .map((input) => input.value);

        clearCustomValidity(unit);

        if (!nameInput.checkValidity() || !linkInput.checkValidity() || !startInput.checkValidity() || !endInput.checkValidity()) {
            setStatus("Complete required fields", "error");
            scheduleForm.reportValidity();
            return false;
        }

        if (checkedDays.length === 0) {
            setUnitError(unit, "Choose at least one day.");
            return false;
        }

        if (startInput.value >= endInput.value) {
            endInput.setCustomValidity("End time must be later than start time.");
            setStatus("Check meeting times", "error");
            scheduleForm.reportValidity();
            return false;
        }

        schedule.push({
            name: nameInput.value.trim(),
            days: checkedDays.join(""),
            time: `${startInput.value}-${endInput.value}`,
            link: linkInput.value.trim(),
        });
    }

    return schedule;
}

function updateEmptyState() {
    emptyScheduleMessage.hidden = entriesSection.children.length > 0;
}

function formatDaysToBooleanArray(dayString) {
    const days = ["M", "T", "W", "Th", "F", "Sa", "Su"];
    const boolArray = [false, false, false, false, false, false, false];
    const daysArray = dayString.split(/(?=[A-Z])/).filter(Boolean);

    daysArray.forEach((day) => {
        const index = days.indexOf(day);
        if (index >= 0) {
            boolArray[index] = true;
        }
    });

    return boolArray;
}

function setUnitError(unit, message) {
    unit.classList.add("has-error");
    setStatus(message, "error");
}

function clearCustomValidity(unit) {
    unit.classList.remove("has-error");
    unit.querySelectorAll("input").forEach((input) => {
        input.setCustomValidity("");
    });
}

function setDirty() {
    setStatus("Unsaved changes", "dirty");
}

function setStatus(message, state = "default") {
    clearTimeout(saveTimer);
    saveStatus.innerText = message;
    saveStatus.classList.toggle("is-dirty", state === "dirty");
    saveStatus.classList.toggle("is-error", state === "error");

    if (message === "Saved") {
        saveTimer = setTimeout(() => setStatus("Ready"), 1800);
    }
}
