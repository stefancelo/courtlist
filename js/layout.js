(function () {
  "use strict";

  const NAV_LINKS = [
    { href: "index.html",     label: "Home" },
    { href: "tasks.html",     label: "Tasks" },
    { href: "analytics.html", label: "Analytics" },
    { href: "gameweek.html",  label: "Gameweek" },
    { href: "about.html",     label: "About" },
    { href: "contact.html",   label: "Contact" }
  ];

  function getCurrentPage() {
    const fileName = window.location.pathname.split("/").pop();
    return fileName === "" ? "index.html" : fileName;
  }

  function buildNavLinks() {
    const currentPage = getCurrentPage();

    return NAV_LINKS.map(function (link) {
      const isActive = link.href === currentPage;
      const activeClass = isActive ? " active" : "";
      const ariaCurrent = isActive ? ' aria-current="page"' : "";

      return `<li class="nav-item">
        <a class="nav-link${activeClass}" href="${link.href}"${ariaCurrent}>${link.label}</a>
      </li>`;
    }).join("");
  }
  function buildHeader() {
    return `
      <nav class="navbar navbar-expand-lg sticky-top border-bottom bg-body" aria-label="Main navigation">
        <div class="container">
          <a class="navbar-brand d-flex align-items-center gap-2" href="index.html">
            <img id="site-logo" src="img/logolight.png" alt="CourtList logo" width="40" height="40">
            <span class="fw-bold">Court<span class="text-orange">List</span></span>
          </a>

          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
                  aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="mainNav">
            <ul class="navbar-nav ms-auto">
              ${buildNavLinks()}
            </ul>
            <button id="theme-toggle" class="btn btn-outline-secondary ms-lg-3 mt-2 mt-lg-0" type="button"
                    aria-label="Switch to dark mode">Dark Mode</button>
          </div>
        </div>
      </nav>`;
  }

  document.getElementById("site-header").innerHTML = buildHeader();
})();