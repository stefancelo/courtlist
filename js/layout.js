(function () {
    "use strict";

    const NAV_LINKS = [
        { href: "index.html", label: "Home" },
        { href: "tasks.html", label: "Tasks" },
        { href: "analytics.html", label: "Analytics" },
        { href: "gameweek.html", label: "Gameweek" },
        { href: "about.html", label: "About" },
        { href: "contact.html", label: "Contact" }
    ];

    // Social media profiles shown in the footer
    const SOCIAL_LINKS = [
        { href: "https://x.com/MiskoRaznatovic", icon: "bi-twitter-x", label: "X" },
        { href: "https://instagram.com/esbekal", icon: "bi-instagram", label: "Instagram" },
        { href: "https://github.com/stefancelo/courtlist", icon: "bi-github", label: "GitHub" }
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
            <img class="site-logo" src="img/logolight.png" alt="CourtList logo" width="40" height="40">
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

    /**
     * Builds the social media icon links for the footer.
     */
    function buildSocialLinks() {
        return SOCIAL_LINKS.map(function (link) {
            return `<a href="${link.href}" class="link-body-emphasis fs-5" target="_blank" rel="noopener"
                 aria-label="CourtList on ${link.label}">
                <i class="bi ${link.icon}" aria-hidden="true"></i>
              </a>`;
        }).join("");
    }

    /**
     * Returns the full footer HTML. The copyright year updates automatically.
     */
    function buildFooter() {
        const year = new Date().getFullYear();

        return `
      <footer class="border-top bg-body-tertiary mt-5 py-4">
        <div class="container">
          <div class="row gy-3 align-items-center">

            <div class="col-md-4 text-center text-md-start">
              <a href="index.html" class="d-inline-flex align-items-center gap-2 text-decoration-none text-body">
                <img class="site-logo" src="img/logolight.png" alt="CourtList logo" width="32" height="32">
                <span class="fw-bold">Court<span class="text-orange">List</span></span>
              </a>
              <p class="small text-body-secondary mb-0 mt-1">Organize / Operate / Own the court</p>
            </div>

            <div class="col-md-4 text-center">
              <a href="mailto:sbl@courtlist.com" class="link-body-emphasis">
                <i class="bi bi-envelope me-1" aria-hidden="true"></i>sbl@courtlist.com
              </a>
            </div>

            <div class="col-md-4 text-center text-md-end">
              <div class="d-inline-flex gap-3">${buildSocialLinks()}</div>
            </div>

          </div>
          <p class="text-center small text-body-secondary mt-4 mb-0">&copy; ${year} CourtList. All rights reserved.</p>
        </div>
      </footer>`;
    }
    document.getElementById("site-header").innerHTML = buildHeader();
    document.getElementById("site-footer").innerHTML = buildFooter();
})();
