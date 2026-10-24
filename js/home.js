/**
 * home.js
 * Home page: latest activity feed (from TaskStore) and the weather widget (Open-Meteo API).
 */
(function () {
    "use strict";

    /* Latest activity */

    const activityList = document.getElementById("activity-list");
    const activityEmpty = document.getElementById("activity-empty");
    const MAX_ITEMS = 6;

    // Icon, colour and wording per activity type
    const ACTIVITY_STYLES = {
        added: { icon: "bi-plus-circle", colour: "text-success", verb: "Added" },
        edited: { icon: "bi-pencil", colour: "text-secondary", verb: "Edited" },
        completed: { icon: "bi-check-circle", colour: "text-success", verb: "Completed" },
        moved: { icon: "bi-arrow-left-right", colour: "text-info", verb: "Moved" },
        deleted: { icon: "bi-trash", colour: "text-danger", verb: "Deleted" }
    };

    /**
     * "5 min ago", "3 h ago", "yesterday"...
     */
    function timeAgo(isoString) {
        const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
        if (seconds < 60) {
            return "just now";
        }
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return minutes + " min ago";
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return hours + " h ago";
        }
        const days = Math.floor(hours / 24);
        return days === 1 ? "yesterday" : days + " days ago";
    }

    /**
     * Returns the HTML for one activity entry.
     */
    function buildActivityItem(entry) {
        const style = ACTIVITY_STYLES[entry.type] || ACTIVITY_STYLES.edited;
        const verb =
            entry.type === "moved"
                ? "Moved to " + (TaskStore.STATUS_LABELS[entry.detail] || "another column") + ":"
                : style.verb;

        return `<li class="list-group-item d-flex align-items-start gap-3 px-0">
      <i class="bi ${style.icon} ${style.colour} fs-5" aria-hidden="true"></i>
      <div>
        <span class="fw-semibold">${verb}</span> ${TaskStore.escapeHtml(entry.title)}
        <div class="small text-body-secondary">
          <time datetime="${entry.time}">${timeAgo(entry.time)}</time>
        </div>
      </div>
    </li>`;
    }

    /**
     * Shows the most recent entries, or an empty message.
     */
    function renderActivity() {
        const entries = TaskStore.getActivity().slice(0, MAX_ITEMS);
        activityList.innerHTML = entries.map(buildActivityItem).join("");
        activityEmpty.classList.toggle("d-none", entries.length > 0);
    }

    /* ---------- Weather (Open-Meteo API, free, no key) ---------- */

    const citySelect = document.getElementById("weather-city");
    const weatherOutput = document.getElementById("weather-output");

    // Euroleague host cities and their coordinates
    const CITIES = [
        { name: "Athens", lat: 37.98, lon: 23.73 },
        { name: "Belgrade", lat: 44.79, lon: 20.45 },
        { name: "Istanbul", lat: 41.01, lon: 28.98 },
        { name: "Madrid", lat: 40.42, lon: -3.7 },
        { name: "Barcelona", lat: 41.39, lon: 2.17 },
        { name: "Kaunas", lat: 54.9, lon: 23.89 },
        { name: "Milan", lat: 45.46, lon: 9.19 },
        { name: "Munich", lat: 48.14, lon: 11.58 }
    ];

    /**
     * Turns an Open-Meteo weather code (WMO standard) into text and an icon.
     */
    function describeWeather(code) {
        if (code === 0) {
            return { text: "Clear sky", icon: "bi-sun" };
        }
        if (code <= 2) {
            return { text: "Partly cloudy", icon: "bi-cloud-sun" };
        }
        if (code === 3) {
            return { text: "Overcast", icon: "bi-cloud" };
        }
        if (code <= 48) {
            return { text: "Fog", icon: "bi-cloud-fog" };
        }
        if (code <= 57) {
            return { text: "Drizzle", icon: "bi-cloud-drizzle" };
        }
        if (code <= 67) {
            return { text: "Rain", icon: "bi-cloud-rain" };
        }
        if (code <= 77) {
            return { text: "Snow", icon: "bi-cloud-snow" };
        }
        if (code <= 82) {
            return { text: "Rain showers", icon: "bi-cloud-rain-heavy" };
        }
        if (code <= 86) {
            return { text: "Snow showers", icon: "bi-cloud-snow" };
        }
        return { text: "Thunderstorm", icon: "bi-cloud-lightning-rain" };
    }

    /**
     * Fills the city dropdown from the CITIES list.
     */
    function fillCitySelect() {
        citySelect.innerHTML = CITIES.map(function (city, index) {
            return `<option value="${index}">${city.name}</option>`;
        }).join("");
    }

    /**
     * Shows the current weather returned by the API.
     */
    function renderWeather(cityName, current) {
        const weather = describeWeather(current.weather_code);

        weatherOutput.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <i class="bi ${weather.icon} display-5 text-orange" aria-hidden="true"></i>
        <div>
          <p class="display-6 fw-semibold mb-0">${Math.round(current.temperature_2m)}°C</p>
          <p class="mb-0">${weather.text} in ${cityName}</p>
        </div>
      </div>
      <p class="small text-body-secondary mt-2 mb-0">
        Humidity ${current.relative_humidity_2m}% · Wind ${Math.round(current.wind_speed_10m)} km/h
      </p>`;
    }

    // Counts requests so only the latest one is shown if the user switches cities quickly
    let latestRequest = 0;

    /**
     * Requests the current weather for the selected city and displays it.
     * The previous result stays visible (faded) while loading, so the layout doesn't jump.
     */
    async function loadWeather() {
        const requestId = ++latestRequest;
        const city = CITIES[citySelect.value];

        weatherOutput.classList.add("opacity-50");
        weatherOutput.setAttribute("aria-busy", "true");

        const url =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" +
            city.lat +
            "&longitude=" +
            city.lon +
            "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
            "&timezone=auto";

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            const data = await response.json();
            if (requestId === latestRequest) {
                renderWeather(city.name, data.current);
            }
        } catch (error) {
            if (requestId === latestRequest) {
                weatherOutput.innerHTML =
                    '<p class="text-danger mb-0">Weather is unavailable right now. Please try again later.</p>';
            }
            console.warn("CourtList: weather request failed", error);
        } finally {
            if (requestId === latestRequest) {
                weatherOutput.classList.remove("opacity-50");
                weatherOutput.removeAttribute("aria-busy");
            }
        }
    }

    // Start
    renderActivity();
    fillCitySelect();
    citySelect.addEventListener("change", loadWeather);
    loadWeather();
})();
