/**
 * layout.js
 * Builds the shared header (skip link, navbar, dark mode toggle) and footer once,
 * and injects them into every page. Each HTML page has an empty <div id="site-header">
 * and <div id="site-footer">; this file fills them.
 * Wrapped in an IIFE so none of its variables become global.
 */
(function () {
    "use strict";

    // All navbar pages in one list. To add or rename a page, change it here only.
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
        { href: "https://x.com", icon: "bi-twitter-x", label: "X" },
        { href: "https://instagram.com/esbekal", icon: "bi-instagram", label: "Instagram" },
        { href: "https://github.com/stefancelo/courtlist", icon: "bi-github", label: "GitHub" }
    ];

    // localStorage key for the user's theme choice
    const THEME_KEY = "courtlist-theme";

    // Logo image for each theme (navy lines for light mode, white lines for dark mode)
    const LOGOS = {
        light: "img/logolight.png",
        dark: "img/logodark.png"
    };

    /**
     * Returns the file name of the current page, e.g. "tasks.html".
     * An empty name means the site root, which serves index.html.
     */
    function getCurrentPage() {
        const fileName = window.location.pathname.split("/").pop();
        return fileName === "" ? "index.html" : fileName;
    }

    /**
     * Builds the <li> items for the navbar and marks the current page as active
     * (Bootstrap's "active" class plus aria-current for screen readers).
     */
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

    /**
     * Returns the header HTML: a skip link for keyboard users, then the navbar with
     * logo, page links (collapsing into a hamburger menu below 992px) and the theme toggle.
     */
    function buildHeader() {
        return `
        <a href="#main-content" class="skip-link visually-hidden-focusable btn btn-orange position-absolute top-0 start-0 m-2">Skip to main content</a>
        <nav class="navbar navbar-expand-lg sticky-top border-bottom site-navbar" aria-label="Main navigation">
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
     * Builds the social media icon links. Used in the footer and on the contact page.
     * Icons have no text, so each link gets an aria-label for screen readers.
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
     * Returns the footer HTML: logo and tagline, contact email, social links and copyright.
     * The copyright year is always the current year.
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

    /**
     * Returns the theme to start with: the saved choice if there is one,
     * otherwise the visitor's operating system setting.
     */
    function getInitialTheme() {
        let saved = null;
        try {
            saved = localStorage.getItem(THEME_KEY);
        } catch (error) {
            // localStorage can be blocked (e.g. some private modes); fall back to the OS setting
        }

        if (saved === "light" || saved === "dark") {
            return saved;
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    /**
     * Applies a theme everywhere: Bootstrap colours (data-bs-theme on <html>),
     * both logos, the toggle button's icon and label, and tells other scripts about it.
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-bs-theme", theme);

        // Swap every logo (navbar and footer) to the version that suits this theme
        document.querySelectorAll(".site-logo").forEach(function (logo) {
            logo.src = LOGOS[theme];
        });

        // The button shows what clicking will switch to: a sun in dark mode, a moon in light mode
        const toggle = document.querySelector("#theme-toggle");
        const nextTheme = theme === "dark" ? "light" : "dark";
        toggle.innerHTML =
            theme === "dark"
                ? '<i class="bi bi-sun" aria-hidden="true"></i>'
                : '<i class="bi bi-moon-stars" aria-hidden="true"></i>';
        toggle.setAttribute("aria-label", "Switch to " + nextTheme + " mode");

        // Let page scripts (e.g. the charts) react to the theme change
        document.dispatchEvent(new CustomEvent("courtlist:themechange", { detail: { theme: theme } }));
    }

    /**
     * Applies the starting theme, then switches and saves the theme on every click of the toggle.
     */
    function initThemeToggle() {
        let currentTheme = getInitialTheme();
        applyTheme(currentTheme);

        document.querySelector("#theme-toggle").addEventListener("click", function () {
            currentTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(currentTheme);
            try {
                localStorage.setItem(THEME_KEY, currentTheme);
            } catch (error) {
                // Saving failed (storage blocked); the theme still changes for this page
            }
        });
    }

    /* ---------- Start: inject the shared layout, then set up dark mode ---------- */

    document.querySelector("#site-header").innerHTML = buildHeader();
    document.querySelector("#site-footer").innerHTML = buildFooter();

    // Pages with a social links box (the contact page) get the same links as the footer
    const contactSocial = document.querySelector("#contact-social");
    if (contactSocial) {
        contactSocial.innerHTML = buildSocialLinks();
    }

    // Must run after the header is injected, because the toggle button and logos are inside it
    initThemeToggle();
})();
