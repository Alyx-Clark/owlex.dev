const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_DAYS = 365.2425;
const STORAGE_KEY = "owlex_how_many_more_v1";

const unitLabels = {
    months: { singular: "month", perYear: 12 },
    weeks: { singular: "week", perYear: YEAR_DAYS / 7 },
    days: { singular: "day", perYear: YEAR_DAYS },
    hours: { singular: "hour", perYear: YEAR_DAYS * 24 }
};

const defaults = {
    lifeExpectancy: 85,
    unit: "weeks",
    people: [
        { name: "Mom", age: 60, expectancy: 85, cadenceValue: 1, cadenceUnit: "weeks" },
        { name: "Dad", age: 62, expectancy: 85, cadenceValue: 1, cadenceUnit: "weeks" }
    ]
};

const els = {
    birthdate: document.getElementById("birthdate"),
    lifeExpectancy: document.getElementById("life-expectancy"),
    unit: document.getElementById("unit"),
    chart: document.getElementById("life-chart"),
    title: document.getElementById("chart-title"),
    age: document.getElementById("age-stat"),
    months: document.getElementById("months-stat"),
    weeks: document.getElementById("weeks-stat"),
    days: document.getElementById("days-stat"),
    hours: document.getElementById("hours-stat"),
    peopleList: document.getElementById("people-list"),
    addPerson: document.getElementById("add-person")
};

let state = loadState();

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return {
            birthdate: saved?.birthdate || defaultBirthdate(),
            lifeExpectancy: saved?.lifeExpectancy || defaults.lifeExpectancy,
            unit: saved?.unit || defaults.unit,
            people: Array.isArray(saved?.people) && saved.people.length ? saved.people : defaults.people
        };
    } catch {
        return {
            birthdate: defaultBirthdate(),
            lifeExpectancy: defaults.lifeExpectancy,
            unit: defaults.unit,
            people: defaults.people
        };
    }
}

function defaultBirthdate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 30);
    return date.toISOString().slice(0, 10);
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function format(value) {
    return Math.max(0, Math.floor(value)).toLocaleString();
}

function plural(value, word) {
    return `${format(value)} ${word}${Math.floor(value) === 1 ? "" : "s"}`;
}

function getLifeMetrics() {
    const now = new Date();
    const birth = new Date(`${state.birthdate}T00:00:00`);
    const lifespanDays = Math.max(1, state.lifeExpectancy * YEAR_DAYS);
    const livedDays = Math.max(0, (now - birth) / DAY_MS);
    const leftDays = Math.max(0, lifespanDays - livedDays);
    return {
        ageYears: livedDays / YEAR_DAYS,
        livedDays,
        lifespanDays,
        leftDays,
        leftMonths: leftDays / (YEAR_DAYS / 12),
        leftWeeks: leftDays / 7,
        leftHours: leftDays * 24
    };
}

function unitTotals(metrics) {
    const unit = state.unit;
    if (unit === "months") {
        return {
            total: Math.ceil(state.lifeExpectancy * 12),
            used: Math.floor(metrics.livedDays / (YEAR_DAYS / 12))
        };
    }
    if (unit === "weeks") {
        return {
            total: Math.ceil(metrics.lifespanDays / 7),
            used: Math.floor(metrics.livedDays / 7)
        };
    }
    if (unit === "hours") {
        return {
            total: Math.ceil(metrics.lifespanDays * 24),
            used: Math.floor(metrics.livedDays * 24)
        };
    }
    return {
        total: Math.ceil(metrics.lifespanDays),
        used: Math.floor(metrics.livedDays)
    };
}

function drawChart(metrics) {
    const canvas = els.chart;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const { total, used } = unitTotals(metrics);
    const safeTotal = Math.max(1, total);
    const gap = state.unit === "hours" ? 1 : 2;
    const columns = Math.ceil(Math.sqrt(safeTotal * (rect.width / rect.height)));
    const rows = Math.ceil(safeTotal / columns);
    const cell = Math.max(1, Math.floor(Math.min((rect.width - gap * (columns - 1)) / columns, (rect.height - gap * (rows - 1)) / rows)));
    const chartWidth = columns * cell + (columns - 1) * gap;
    const chartHeight = rows * cell + (rows - 1) * gap;
    const startX = Math.max(0, (rect.width - chartWidth) / 2);
    const startY = Math.max(0, (rect.height - chartHeight) / 2);

    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    for (let index = 0; index < safeTotal; index += 1) {
        const x = startX + (index % columns) * (cell + gap);
        const y = startY + Math.floor(index / columns) * (cell + gap);
        ctx.fillStyle = index < used ? "#1e293b" : "#86efac";
        ctx.fillRect(x, y, cell, cell);
    }

    if (used < safeTotal) {
        const x = startX + (used % columns) * (cell + gap);
        const y = startY + Math.floor(used / columns) * (cell + gap);
        ctx.strokeStyle = "#006d3e";
        ctx.lineWidth = Math.max(1, Math.min(3, cell / 2));
        ctx.strokeRect(x, y, cell, cell);
    }
}

function cadenceDays(person) {
    const value = Math.max(0.01, number(person.cadenceValue, 1));
    const multipliers = {
        days: 1,
        weeks: 7,
        months: YEAR_DAYS / 12,
        years: YEAR_DAYS
    };
    return value * (multipliers[person.cadenceUnit] || 7);
}

function visitsLeft(person) {
    const yearsLeft = Math.max(0, number(person.expectancy, 85) - number(person.age, 0));
    return Math.floor((yearsLeft * YEAR_DAYS) / cadenceDays(person));
}

function updateStateFromInputs() {
    state.birthdate = els.birthdate.value || defaultBirthdate();
    state.lifeExpectancy = Math.max(1, Math.min(130, number(els.lifeExpectancy.value, defaults.lifeExpectancy)));
    state.unit = els.unit.value;
    saveState();
    render();
}

function renderStats(metrics) {
    els.title.textContent = `Life in ${state.unit}`;
    els.age.textContent = metrics.ageYears.toFixed(1);
    els.months.textContent = format(metrics.leftMonths);
    els.weeks.textContent = format(metrics.leftWeeks);
    els.days.textContent = format(metrics.leftDays);
    els.hours.textContent = format(metrics.leftHours);
}

function renderPeople() {
    els.peopleList.innerHTML = "";
    state.people.forEach((person, index) => {
        const card = document.createElement("article");
        card.className = "person";
        card.innerHTML = `
            <div class="person-grid">
                <label>
                    <span>Name</span>
                    <input data-field="name" value="${escapeHtml(person.name)}">
                </label>
                <label>
                    <span>Current age</span>
                    <input data-field="age" type="number" min="0" max="130" step="1" value="${person.age}">
                </label>
                <label>
                    <span>Expected age</span>
                    <input data-field="expectancy" type="number" min="1" max="130" step="1" value="${person.expectancy}">
                </label>
                <label>
                    <span>See every</span>
                    <input data-field="cadenceValue" type="number" min="0.01" step="0.25" value="${person.cadenceValue}">
                </label>
                <label>
                    <span>Cadence</span>
                    <select data-field="cadenceUnit">
                        ${["days", "weeks", "months", "years"].map(unit => `<option value="${unit}"${person.cadenceUnit === unit ? " selected" : ""}>${unit}</option>`).join("")}
                    </select>
                </label>
                <div class="person-result">
                    <span>Estimated visits left</span>
                    <strong>${plural(visitsLeft(person), "visit")}</strong>
                </div>
            </div>
            <div class="person-actions">
                <button class="remove-person" type="button">Remove</button>
            </div>
        `;

        card.querySelectorAll("[data-field]").forEach(input => {
            input.addEventListener("input", event => {
                const field = event.target.dataset.field;
                state.people[index][field] = ["age", "expectancy", "cadenceValue"].includes(field)
                    ? number(event.target.value, defaults.people[0][field] || 1)
                    : event.target.value;
                saveState();
                card.querySelector(".person-result strong").textContent = plural(visitsLeft(state.people[index]), "visit");
            });
        });

        card.querySelector(".remove-person").addEventListener("click", () => {
            state.people.splice(index, 1);
            if (!state.people.length) {
                state.people.push({ name: "Someone", age: 60, expectancy: 85, cadenceValue: 1, cadenceUnit: "weeks" });
            }
            saveState();
            renderPeople();
        });

        els.peopleList.append(card);
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function render() {
    const metrics = getLifeMetrics();
    renderStats(metrics);
    drawChart(metrics);
}

function init() {
    els.birthdate.value = state.birthdate;
    els.lifeExpectancy.value = state.lifeExpectancy;
    els.unit.value = state.unit;

    [els.birthdate, els.lifeExpectancy, els.unit].forEach(input => {
        input.addEventListener("input", updateStateFromInputs);
    });

    els.addPerson.addEventListener("click", () => {
        state.people.push({ name: "Someone", age: 60, expectancy: 85, cadenceValue: 1, cadenceUnit: "weeks" });
        saveState();
        renderPeople();
    });

    window.addEventListener("resize", () => render());
    renderPeople();
    render();
}

init();
