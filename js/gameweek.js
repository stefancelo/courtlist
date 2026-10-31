/**
 * gameweek.js
 * Gameweek page (page of choice) with three components:
 * 1. Countdown to the next tip-off
 * 2. Fixtures table that creates prep tasks through TaskStore, confirmed with a toast
 * 3. Accordion of matchday checklists per arena, saved in localStorage
 */
(function () {
    "use strict";

    /* ---------- Data ---------- */

    const CHECKLIST_KEY = "courtlist-checklists";

    // The same checklist is used for every arena
    const CHECKLIST_ITEMS = [
        "Referee crew confirmed",
        "LED boards and shot clock tested",
        "Media accreditation approved",
        "Anti-doping room ready",
        "Broadcast feed tested"
    ];

    // Countdown units, largest first, with their length in milliseconds
    const UNITS = [
        { id: "days", label: "Days", ms: 86400000 },
        { id: "hours", label: "Hours", ms: 3600000 },
        { id: "minutes", label: "Minutes", ms: 60000 },
        { id: "seconds", label: "Seconds", ms: 1000 }
    ];

    /**
     * Returns the next given weekday (0 = Sunday ... 4 = Thursday) at a time, always in the future.
     */
    function nextWeekday(weekday, hours, minutes) {
        const date = new Date();
        const daysAhead = (weekday - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + daysAhead);
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    // Sample fixtures for the next round, sorted by tip-off time
    const FIXTURES = [
        {
            id: "pao-par",
            home: "Panathinaikos",
            away: "Partizan",
            arena: "OAKA, Athens",
            tipOff: nextWeekday(4, 21, 15)
        },
        {
            id: "oly-rma",
            home: "Olympiacos",
            away: "Real Madrid",
            arena: "Peace and Friendship Stadium, Piraeus",
            tipOff: nextWeekday(4, 20, 15)
        },
        {
            id: "fen-bar",
            home: "Fenerbahçe",
            away: "Barcelona",
            arena: "Ülker Sports Arena, Istanbul",
            tipOff: nextWeekday(4, 19, 45)
        },
        {
            id: "zal-czv",
            home: "Žalgiris",
            away: "Crvena zvezda",
            arena: "Žalgirio Arena, Kaunas",
            tipOff: nextWeekday(5, 19, 0)
        },
        {
            id: "mil-bay",
            home: "Olimpia Milano",
            away: "Bayern Munich",
            arena: "Unipol Forum, Milan",
            tipOff: nextWeekday(5, 20, 30)
        },
        {
            id: "efs-mac",
            home: "Anadolu Efes",
            away: "Maccabi Tel Aviv",
            arena: "Sinan Erdem Dome, Istanbul",
            tipOff: nextWeekday(5, 21, 0)
        }
    ].sort(function (a, b) {
        return a.tipOff - b.tipOff;
    });

    /**
     * Date -> "Thu 5 Nov, 19:45"
     */
    function formatTipOff(date) {
        return date.toLocaleString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    /* ---------- Component 1: countdown ---------- */

    const countdownEl = document.getElementById("countdown");
    const nextGameEl = document.getElementById("next-game");
    const nextGame = FIXTURES[0];
    let timerId = null;

    /**
     * Builds the four countdown boxes and the game description once.
     */
    function buildCountdown() {
        nextGameEl.textContent = nextGame.home + " vs " + nextGame.away + " · " + formatTipOff(nextGame.tipOff);
        countdownEl.innerHTML = UNITS.map(function (unit) {
            return `<div class="countdown-box">
        <span id="cd-${unit.id}" class="countdown-number">00</span>
        <span class="countdown-label">${unit.label}</span>
      </div>`;
        }).join("");
    }

    /**
     * Splits the time left into days, hours, minutes and seconds and shows them.
     */
    function updateCountdown() {
        let remaining = nextGame.tipOff - Date.now();

        if (remaining <= 0) {
            clearInterval(timerId);
            countdownEl.innerHTML = '<p class="h5 mb-0">Tip-off! The round is under way.</p>';
            return;
        }

        UNITS.forEach(function (unit) {
            const value = Math.floor(remaining / unit.ms);
            remaining -= value * unit.ms;
            document.getElementById("cd-" + unit.id).textContent = String(value).padStart(2, "0");
        });
    }

    /* ---------- Component 2: fixtures and prep tasks ---------- */

    const fixturesBody = document.getElementById("fixtures-body");
    const toastMessage = document.getElementById("toast-message");
    const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById("gameweek-toast"));

    /**
     * Returns the HTML for one fixture row.
     */
    function buildFixtureRow(fixture) {
        const game = fixture.home + " vs " + fixture.away;
        return `<tr>
      <td class="fw-semibold">${game}</td>
      <td class="small">${fixture.arena}</td>
      <td class="small text-nowrap">${formatTipOff(fixture.tipOff)}</td>
      <td class="text-end">
        <button type="button" class="btn btn-sm btn-outline-secondary text-nowrap" data-fixture="${fixture.id}"
                aria-label="Create a preparation task for ${game}">
          <i class="bi bi-plus-lg" aria-hidden="true"></i> Prep task
        </button>
      </td>
    </tr>`;
    }

    /**
     * Shows a short message in the toast.
     */
    function showToast(message) {
        toastMessage.textContent = message;
        toast.show();
    }

    /**
     * Adds a high-priority prep task for a game, due on match day, unless one already exists.
     */
    function createPrepTask(fixture) {
        const title = "Matchday prep: " + fixture.home + " vs " + fixture.away;
        const alreadyExists = TaskStore.getTasks().some(function (task) {
            return task.title === title;
        });

        if (alreadyExists) {
            showToast("This game already has a prep task in your list.");
            return;
        }

        TaskStore.addTask({
            title: title,
            description: "Arena checks, staffing and media setup at " + fixture.arena + ".",
            dueDate: TaskStore.toDateString(fixture.tipOff),
            priority: "high"
        });
        showToast('Added "' + title + '" to your tasks.');
    }

    /* ---------- Component 3: checklists accordion ---------- */

    const checklistsEl = document.getElementById("checklists");

    /**
     * Reads the saved ticks: { "pao-par": [true, false, ...], ... }
     */
    function readChecklists() {
        try {
            return JSON.parse(localStorage.getItem(CHECKLIST_KEY)) || {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Saves the ticks.
     */
    function saveChecklists(state) {
        try {
            localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn("CourtList: could not save checklists", error);
        }
    }

    const checklistState = readChecklists();

    /**
     * Number of ticked items for one arena.
     */
    function countDone(fixtureId) {
        return (checklistState[fixtureId] || []).filter(Boolean).length;
    }

    /**
     * Returns the HTML for one accordion item (one arena's checklist). The first one starts open.
     */
    function buildChecklist(fixture, index) {
        const ticks = checklistState[fixture.id] || [];
        const panelId = "checklist-" + fixture.id;
        const isOpen = index === 0;
        const done = countDone(fixture.id);
        const total = CHECKLIST_ITEMS.length;

        const items = CHECKLIST_ITEMS.map(function (item, itemIndex) {
            const inputId = panelId + "-" + itemIndex;
            return `<div class="form-check mb-1">
        <input class="form-check-input" type="checkbox" id="${inputId}"
               data-checklist="${fixture.id}" data-item="${itemIndex}" ${ticks[itemIndex] ? "checked" : ""}>
        <label class="form-check-label" for="${inputId}">${item}</label>
      </div>`;
        }).join("");

        return `<div class="accordion-item">
      <h3 class="accordion-header">
        <button class="accordion-button${isOpen ? "" : " collapsed"}" type="button"
                data-bs-toggle="collapse" data-bs-target="#${panelId}"
                aria-expanded="${isOpen}" aria-controls="${panelId}">
          <span class="me-auto">${fixture.arena}</span>
          <span class="badge ${done === total ? "text-bg-success" : "text-bg-secondary"} me-3"
                data-progress="${fixture.id}">${done}/${total}</span>
        </button>
      </h3>
      <div id="${panelId}" class="accordion-collapse collapse${isOpen ? " show" : ""}" data-bs-parent="#checklists">
        <div class="accordion-body">
          <p class="small text-body-secondary mb-2">${fixture.home} vs ${fixture.away} · ${formatTipOff(fixture.tipOff)}</p>
          ${items}
        </div>
      </div>
    </div>`;
    }

    /**
     * Updates one arena's progress badge without redrawing the accordion.
     */
    function updateProgress(fixtureId) {
        const badge = checklistsEl.querySelector('[data-progress="' + fixtureId + '"]');
        const done = countDone(fixtureId);
        const total = CHECKLIST_ITEMS.length;
        badge.textContent = done + "/" + total;
        badge.classList.toggle("text-bg-success", done === total);
        badge.classList.toggle("text-bg-secondary", done !== total);
    }

    /* ---------- Event listeners ---------- */

    // One listener for all "Prep task" buttons
    fixturesBody.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-fixture]");
        if (!button) {
            return;
        }
        const fixture = FIXTURES.find(function (item) {
            return item.id === button.dataset.fixture;
        });
        createPrepTask(fixture);
    });

    // One listener for all checkboxes
    checklistsEl.addEventListener("change", function (event) {
        const checkbox = event.target.closest("input[data-checklist]");
        if (!checkbox) {
            return;
        }
        const fixtureId = checkbox.dataset.checklist;
        checklistState[fixtureId] = checklistState[fixtureId] || [];
        checklistState[fixtureId][Number(checkbox.dataset.item)] = checkbox.checked;
        saveChecklists(checklistState);
        updateProgress(fixtureId);
    });

    /* ---------- Start ---------- */

    buildCountdown();
    updateCountdown();
    timerId = setInterval(updateCountdown, 1000);

    fixturesBody.innerHTML = FIXTURES.map(buildFixtureRow).join("");
    checklistsEl.innerHTML = FIXTURES.map(buildChecklist).join("");
})();
