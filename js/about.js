/**
 * about.js
 * About page: builds the team cards and the development process carousel from two lists,
 * so the card and slide markup is written once.
 */
(function () {
  "use strict";

  // Team members shown in the grid (replace the first entry with your own name)
  const TEAM = [
    { name: "Stefan Lazarevic", role: "Developer & Founder", bio: "Built the CourtList interface." },
    { name: "Dante Exum", role: "Operations Manager", bio: "Defines matchday workflows and decides what the board tracks." },
    { name: "Ilija Srdanovic", role: "Planning Manager", bio: "Coordinates officials and makes sure crews are confirmed on time." },
    { name: "Kostas Sloukas", role: "Media Coordinator", bio: "Runs accreditation, highlights and broadcast graphics deadlines." }
  ];

  // Steps of the development process shown in the carousel
  const MILESTONES = [
    { icon: "bi-lightbulb", title: "1. Planning", text: "Chose the Euroleague operations theme, the task data model and Bootstrap 5.3 for its built-in dark mode." },
    { icon: "bi-layout-text-window", title: "2. Shared layout", text: "One layout.js file injects the navbar, footer and dark mode toggle into every page, so nothing is repeated." },
    { icon: "bi-database", title: "3. Storage module", text: "TaskStore wraps localStorage: every page reads and changes tasks through it, and every change is logged." },
    { icon: "bi-list-check", title: "4. Tasks page", text: "Add, edit, complete and delete tasks, with validation, live search, filters and sorting." },
    { icon: "bi-kanban", title: "5. Analytics and Kanban", text: "Chart.js charts and a drag-and-drop board that update instantly through a shared change event." }
  ];

  /**
   * "Your Name" -> "YN"
   */
  function getInitials(name) {
    return name.split(" ").map(function (part) {
      return part.charAt(0);
    }).join("").slice(0, 2).toUpperCase();
  }

  /**
   * Returns the HTML for one team member card.
   */
  function buildMemberCard(member) {
    return `<div class="col-sm-6 col-lg-3">
      <article class="card h-100 text-center">
        <div class="card-body">
          <div class="avatar mx-auto mb-3" aria-hidden="true">${getInitials(member.name)}</div>
          <h3 class="h6 mb-1">${member.name}</h3>
          <p class="small fw-semibold text-body-secondary mb-2">${member.role}</p>
          <p class="small text-body-secondary mb-0">${member.bio}</p>
        </div>
      </article>
    </div>`;
  }

  /**
   * Returns the HTML for one carousel slide. The first slide must be "active".
   */
  function buildSlide(step, index) {
    return `<div class="carousel-item${index === 0 ? " active" : ""}">
      <div class="process-slide text-center">
        <i class="bi ${step.icon} display-5" aria-hidden="true"></i>
        <h3 class="h5 mt-3">${step.title}</h3>
        <p class="mb-0 mx-auto">${step.text}</p>
      </div>
    </div>`;
  }

  /**
   * Returns the HTML for one carousel indicator (the small dashes at the bottom).
   */
  function buildIndicator(step, index) {
    const isFirst = index === 0;
    return `<button type="button" data-bs-target="#process-carousel" data-bs-slide-to="${index}"
              ${isFirst ? 'class="active" aria-current="true"' : ""} aria-label="Step ${index + 1}"></button>`;
  }

  document.getElementById("team-grid").innerHTML = TEAM.map(buildMemberCard).join("");
  document.getElementById("carousel-slides").innerHTML = MILESTONES.map(buildSlide).join("");
  document.getElementById("carousel-indicators").innerHTML = MILESTONES.map(buildIndicator).join("");
})();