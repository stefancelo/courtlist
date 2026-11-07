# CourtList

**Organize. Operate. Own the court.**

CourtList is a task management web app for Euroleague Basketball game operations staff: referee assignments, arena
checks, media deadlines and team travel, tracked in one place.

-   **Live site:** https://stefancelo.github.io/courtlist/
-   **Repository:** https://github.com/stefancelo/courtlist
-   **Author:** Stefan Lazarevic ID:274242, ITC 4214 Internet Programming, DEREE – The American College of Greece

## Contents

1. [The task system](#1-the-task-system)
2. [Pages](#2-pages)
3. [Technology and project structure](#3-technology-and-project-structure)
4. [Coding decisions](#4-coding-decisions)
5. [Version control](#5-version-control)
6. [Lighthouse audit](#6-lighthouse-audit)
7. [Personal reflections](#7-personal-reflections)
8. [Credits](#8-credits)

## 1. The task system

A Basketball game night depends on dozens of small jobs spread across several people: officials to confirm, press passes
to approve, LED boards to test, highlights to publish, hotels to book for the next away game. CourtList gives the
operations team one shared list of these jobs.

Each task has a **name, description, due date, priority** (High, Medium, Low) and a **status** (To do, In progress,
Completed). Staff can:

-   add, edit, complete and delete tasks on the **Tasks** page
-   search, filter by status or priority, and sort by due date or name
-   move tasks between To do, In progress and Completed on a **Kanban board**
-   see the workload in **charts** by status and priority
-   follow every change in a **latest activity** feed on the home page
-   create a preparation task for any game of the next round from the **Gameweek** page

All pages work on the same data, so a change in one place (for example dragging a card on the Kanban board) is
immediately reflected everywhere else: the tasks table, the counters, the charts and the activity feed.

On the first visit, eight example tasks are loaded so that the table, charts and board are not empty. Their due dates
are calculated relative to the current day, so the examples never all become overdue.

## 2. Pages

| Page      | File             | Contents                                                                                     |
| --------- | ---------------- | -------------------------------------------------------------------------------------------- |
| Home      | `index.html`     | Welcome section with features overview, latest activity, matchday weather (API)              |
| Tasks     | `tasks.html`     | Add/edit form, tasks table, summary counters, search, filters, sorting                       |
| Analytics | `analytics.html` | Bar chart by status, doughnut chart by priority, Kanban board                                |
| Gameweek  | `gameweek.html`  | Page of choice: countdown to tip-off, fixtures with "prep task" buttons, matchday checklists |
| About     | `about.html`     | Purpose and features, team cards, development process carousel                               |
| Contact   | `contact.html`   | Validated contact form with confirmation pop-up, map, social links                           |

All pages share the same sticky header (logo, title, navigation collapsing into a menu, dark mode toggle) and footer
(logo, copyright, email, social links).

## 3. Technology and project structure

-   **HTML5, CSS3, Bootstrap 5.3** (grid, components, built-in colour modes for dark mode)
-   **Vanilla JavaScript** for all DOM manipulation, using `querySelector` and `addEventListener`.
-   **localStorage** for persistent data
-   **Chart.js 4** for the charts
-   **Open-Meteo API** for live weather
-   **Bootstrap Icons**, **Google Fonts** (Inter, Barlow Condensed), **Google Maps** embed

```
courtlist/
├── index.html, tasks.html, analytics.html, gameweek.html, about.html, contact.html
├── css/style.css        Brand colours, typography, component styling, dark mode adjustments
├── js/storage.js        TaskStore: the only code that reads and writes task data
├── js/layout.js         Shared header, footer, dark mode, skip link (used by every page)
├── js/tasks.js          Tasks page
├── js/home.js           Latest activity and weather
├── js/analytics.js      Charts
├── js/kanban.js         Kanban board
├── js/gameweek.js       Gameweek page
├── js/about.js          Team cards and carousel
├── js/contact.js        Contact form
├── img/                 Logos, favicon, court lines (SVG)
└── docs/lighthouse/     Audit screenshots
```

Every page script is wrapped in an IIFE (`(function () { ... })();`) so its variables stay private. The only deliberate
global is `TaskStore`, exposed by `storage.js` using the module pattern.

## 4. Coding decisions

### 4.1 Shared foundations

**One storage module (`storage.js`).** The tasks table, Kanban board, charts, activity feed and gameweek page all need
the same data. Instead of each page reading localStorage itself, every page goes through `TaskStore` (`getTasks`,
`addTask`, `updateTask`, `deleteTask`, `getActivity`). Internal helpers (`read`, `write`, `logActivity`) are private.
This removes duplicated logic and guarantees that every change is saved and logged the same way.

-   Data is stored as JSON text (`JSON.stringify` / `JSON.parse`). Reading is wrapped in `try/catch` with a fallback
    value, so corrupt data or a blocked localStorage cannot crash the page.
-   Each task gets a unique id from the current time plus a random part, so edit and delete always target the right task
    even if two tasks share a name.
-   Dates are stored as `"YYYY-MM-DD"` text built from the local date. Because of this format, comparing two dates as
    text gives the correct chronological order.
-   Shared display helpers (status labels, priority badge colours, date formatting, HTML escaping) live in `storage.js`
    so they are written once.
-   Every save fires a custom event, `courtlist:taskschange`. The charts and the Kanban board listen to it and redraw,
    without the files knowing about each other.

**One layout file (`layout.js`).** The navbar and footer are generated from data lists (`NAV_LINKS`, `SOCIAL_LINKS`) and
injected into every page, so the markup exists once. The current page's link is highlighted from `window.location`. The
empty header container reserves the navbar's height in CSS and is itself sticky, which prevents layout shift and keeps
the navbar visible while scrolling.

**Dark mode.** Bootstrap 5.3 switches all its colours when the `<html>` element has `data-bs-theme="dark"`. The toggle
sets this attribute, swaps both logos, updates the button icon and label, and saves the choice in localStorage. On the
first visit the site follows the operating system's preference (`prefers-color-scheme`). A `courtlist:themechange` event
lets the charts redraw with matching colours.

### 4.2 Tasks page

**Data model**

```js
{
    id, title, description, dueDate, priority, status, createdAt;
}
// status: "todo" | "in-progress" | "completed"
```

Three statuses are needed for the Kanban board. On the tasks page, "pending" means everything that is not completed.

**One rendering pipeline.** Every change (add, edit, complete, delete, typing in the search box, changing a filter)
calls a single function, `renderTasks()`:

storage → filter (search, status, priority) → sort → render table, mobile list and counters.

Redrawing everything instead of updating single rows keeps the view always in sync with storage and makes filters
combine correctly. With the number of tasks this app handles, there is no noticeable performance cost. `filter()`
returns a new array, so sorting never changes the order saved in storage. The summary counters always count all tasks,
not just the visible ones, because they describe the workload, not the current view.

**Form and validation.** The form uses built-in HTML rules (`required`, `maxlength`, `type="date"`) plus custom rules
applied with `setCustomValidity()`:

-   task name of at least 3 characters after trimming (so a name of only spaces is rejected)
-   a description that is not empty
-   a due date that is not in the past

The form has `novalidate`, so errors are shown with Bootstrap's styled messages (`was-validated`) instead of browser
pop-ups. Fields are re-checked as the user types, so an error disappears as soon as it is fixed.

**Edit mode reuses the form.** Instead of a second form, the add form switches into edit mode: it is filled with the
task's values, the heading and button text change, and a Cancel button appears. The variable `editingTask` decides
whether submitting adds or updates. This keeps one set of fields and one set of validation rules. Edge case: editing an
overdue task (for example to fix a typo) would be blocked by the "not in the past" rule, so the task's original date is
allowed while editing, and the date picker's minimum is lowered to it. Moving a task to a different past date is still
blocked.

**Event delegation.** The complete, edit and delete buttons carry `data-action` and `data-id` attributes. One click
listener on the container of both views finds the clicked button with `closest()`. Because rows are rebuilt on every
render, listeners attached to individual buttons would be lost; the container is never replaced, so its listener keeps
working.

**Search, filters, sorting.** The live search listens to the `input` event (every keystroke) and matches the title or
description case-insensitively. Status and priority filters and the sort menu listen to `change`. A result line
("Showing 3 of 9 tasks") is an `aria-live` region, so screen readers announce the result of a search.

**Mobile view.** On phones a six-column table forces horizontal scrolling. Below 768 px the table is hidden and the same
tasks are shown as a card list (Bootstrap display utilities `d-none d-md-block` / `d-md-none`). The description is
placed in a Bootstrap collapse panel opened by a "Description" button, so nothing is hidden permanently. The action
buttons come from one function, `buildActions()`, used by both views.

**Security.** Task names and descriptions are user input and are inserted with template strings and `innerHTML`. Every
piece of user text passes through `escapeHtml()`, so input such as `<img src=x onerror=alert(1)>` is displayed as text
instead of being executed (prevents cross-site scripting).

### 4.3 Latest activity section

**Logging happens inside the storage module.** `addTask`, `updateTask` and `deleteTask` each write an entry
`{ type, title, detail, time }` to a separate localStorage key. Because logging is inside these functions, no page can
change a task without it being logged: a task added from the gameweek page or moved on the Kanban board appears in the
feed automatically.

-   Entry types: added, edited, completed, moved (with the new status), deleted. A status change is logged separately
    from a normal edit.
-   New entries are added to the front (`unshift`) and the log is capped at 20 entries.
-   The home page shows the 6 most recent entries. Icons, colours and wording come from a lookup object
    (`ACTIVITY_STYLES`) instead of a chain of `if` statements.
-   Times are shown relative ("5 min ago", "yesterday") by a `timeAgo()` helper, inside a `<time datetime="...">`
    element that keeps the exact timestamp.
-   Task titles are escaped before display. An empty state with a link to the tasks page is shown when there is no
    activity yet.

**API integration: matchday weather (Open-Meteo).** The home page shows the current weather for a selectable Euroleague
Basketball host city. Open-Meteo was chosen because it is free, needs no API key and allows requests from the browser.

-   The request uses `fetch` with `async` / `await`. `response.ok` is checked explicitly, because `fetch` only fails on
    network errors, not on server errors.
-   Errors are caught and replaced with a friendly message, so a failed request never leaves the widget stuck on
    "Loading".
-   Weather codes (WMO standard) are translated into text and an icon.
-   Two problems found during testing: switching city made the page jump, because the "Loading" message was shorter than
    the result. The fix keeps the previous result visible (faded) while loading and reserves a minimum height. Second,
    fast switching between cities could show an older result last, because responses can arrive in any order. Each
    request now gets a number, and only the latest one may update the display.

### 4.4 Gameweek page (page of choice)

The gameweek page prepares the team for the next round. It has the same header and footer as every other page and three
new components:

1. **Countdown to tip-off.** Fixture dates are calculated from the current day (`nextWeekday()`), so the countdown never
   runs out. `setInterval` updates it every second; the remaining time is split into days, hours, minutes and seconds by
   repeated division. The element has `role="timer"`, which screen readers do not announce every second.
2. **Fixtures with prep tasks and a toast.** Each game has a "Prep task" button that creates a high-priority task due on
   match day through `TaskStore.addTask()`. This connects the page to the rest of the app: the task appears in the tasks
   table, on the Kanban board, in the charts and in the activity feed without extra code. Duplicates are prevented with
   `.some()`. A Bootstrap toast confirms the action. On phones the fixtures are shown as cards with the arena in a
   collapsible panel.
3. **Matchday checklists accordion.** One Bootstrap accordion item per arena with five checkboxes. Ticks are saved in
   localStorage under their own key (they are page settings, not tasks). A progress badge (for example 3/5, green at
   5/5) is updated directly instead of redrawing the accordion, so the open panel does not collapse on every tick.

The fixture list, checklist items and countdown units are data arrays rendered with `map()`, so no markup is repeated.

### 4.5 Analytics and Kanban

**Charts.** Chart.js draws a bar chart by status and a doughnut chart by priority. One helper, `countBy()`, produces the
counts for both. Chart colours are read from Bootstrap's CSS variables, so they match the badges and follow dark mode.
Each canvas has `role="img"` and an `aria-label` containing the actual numbers, because screen readers cannot read a
canvas.

**Kanban board.** Three columns built from the same task data. Cards move with native HTML5 drag and drop (`dragstart`,
`dragover`, `drop`, `dragend`) and also with arrow buttons, because drag and drop does not work with a keyboard and is
unreliable on touch screens. Moving a card calls `TaskStore.updateTask(id, { status })`; the change event then redraws
the board and the charts.

### 4.6 Accessibility and responsive design

-   Semantic landmarks (`<nav>`, `<main>`, `<section>`, `<footer>`), correct heading order, `lang` attribute, unique
    title and meta description per page
-   Labels on every form control, `alt` text on images (empty for decorative ones), `aria-label` on icon-only buttons,
    `title` on the map iframe
-   "Skip to main content" link for keyboard users
-   Colour contrast checked in both themes; the brand orange is darker in light mode so text meets WCAG contrast
-   Hover animations are disabled for users who turn off motion in their operating system (`prefers-reduced-motion`)
-   Bootstrap grid and display utilities for layouts that adapt at 576, 768 and 992 px; tested at 375, 768 and 1280 px

## 5. Version control

The project was developed on GitHub from the first day with small commits and descriptive messages in the form
`what changed` (change/addition/fix). Refactor commits (for example moving
shared helpers into `storage.js`) show the structure improving alongside new features. GitHub Pages deploys the site
automatically on every push.

## 6. Lighthouse audit

Audits were run in Chrome Lighthouse on the live GitHub Pages site, in an incognito window (so extensions do not affect
the result), in mobile mode, on the three most representative pages: home, tasks (main feature page) and analytics
(heaviest page, loads Chart.js).

| Page      | Before (Perf / Access. / Best pr. / SEO) | After                |
| --------- | ---------------------------------------- | -------------------- |
| Home      | 97 / 96 / 96 / 100                       | 97 / 100 / 100 / 100 |
| Tasks     | 96 / 100 / 100 / 100                     | 98 / 100 / 100 / 100 |
| Analytics | 94 / 100 / 100 / 100                     | 95 / 100 / 100 / 100 |

**Before**

![Home before](docs/lighthouse/before(home).png) ![Tasks before](docs/lighthouse/Before(tasks).png)
![Analytics before](docs/lighthouse/Before(analytics).png)

**After**

![Home after](docs/lighthouse/after(home).png) ![Tasks after](docs/lighthouse/after(tasks).png) 
![Analytics after](docs/lighthouse/after(analytics).png)

### Findings and fixes

| Finding                                     | Cause                                                                                                                                | Fix                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Accessibility: insufficient contrast (home) | The audit ran in dark mode. Bootstrap keeps its grey outline button colour the same in dark mode, which is too dark on the navy hero | Lighter grey for outline buttons in dark mode only (one CSS rule, fixes every such button on the site) |
| Best practices: console error (home)        | The hero logo pointed to a file name that did not exist (404)                                                                        | Corrected the file name                                                                                |
| Performance: layout shift 0.081 (home)      | `layout.js` inserts the navbar after the page starts drawing, pushing the content down                                               | Reserved the navbar's height in CSS before it is inserted; after: [your CLS value]                     |
| Performance: render-blocking requests       | CSS files from the CDN load before the page can draw                                                                                 | `preconnect` hint so the browser connects to the CDN earlier                                           |
| Not flagged, but fixed                      | Orange text was below the contrast minimum in light mode                                                                             | Darker brand orange in light mode                                                                      |

### Reflection

Accessibility, best practices and SEO reached 100 on all audited pages. The tasks and analytics pages already scored 100
before the fixes, because labels, alt text, heading order and meta descriptions were included while building the pages,
not added afterwards. The audit was still useful: it found a broken image path that was invisible in normal use and a
contrast problem that only exists in dark mode, which I had not tested.

Some findings could not be fixed from my code: unused CSS comes from loading the full Bootstrap file (the cost of using
a framework), cache lifetimes are set by GitHub Pages, and the icon font's loading behaviour is controlled by the CDN.
Analytics has the lowest performance score because it loads Chart.js, but it is still in the green range. Performance
scores also vary by a few points between runs because of network conditions, so small differences should not be
over-interpreted. Adding Google Fonts after the audit is a deliberate trade-off: two small extra requests in exchange
for a clearly better design.

## 7. Personal reflections

- When i started this project, all I had built before were basic static html pages, but I had never worked with Javascript
where several pages share the same data. Therefore, my first decision was putting all task storage in one file `storage.js`.
At the beginning, it felt really overwhelming working on this project, but as time went on I got more and more used to it.
One thing that was effective was that the kanban board, activity feed, and gameweek page all worked with the same tasks
almost without any new code, because adding, moving, deleting a task goes through the same functions.
- The biggest problems came with the mobile view, accomodating every feature to work well on mobile as well as Desktop.
Furthermore, fixing problems like the navbar not being sticky and staying on your screen as you scroll, the weather widget
causing screen flickers upon each city change, navbar changing heights randomly. Fixing these taught me to look out for
issues at all times and to stress test my site properly.
- Testing the site on real devices made me change the design more than I initially expected. Lighthouse found an issue
with the icon image path and contrast problem which only existed in dark mode, which I hadn't noticed until then.
On the phone view, the tasks and fixtures table on gameweek needed sideways scrolling to complete actions, so I replaced
them with card views that include dropdown function for the long parts (description, arena information), so that all
the information fits on the screen. The hardest part to finish was tasks, because of the detail, length, and complexity of 
the `tasks.js`file.
- Using Git from the first day of starting the project was new for me, but actually really enjoyable. I really found it
fascinating how Git works and what it does, as well as taken back at how cool it is to use it. I learned a lot by using
it, and it also showed me how much easier it is when the work is spread out than doing it all at once.
- Overall the experience was satisfying and taught me a lot. I was especially surprised when one line of code broke
almost half of my pages, learning that one line has that much effect on the whole system was borderline
fascinating to experience. I especially enjoyed styling the site, whether it was adding gradient background on the hero
with a court outline, changing the font family, or making the site prettier. When I saw the look I made on the home page,
I felt a feeling of satisfaction. Finally, after being overwhelmed at the beginning because of my past difficulties 
with coding,the whole project went smoothly and I actually started understanding how some aspects of coding work and 
what they do. I wouldn't say I am entirely familiar with it but I am definitely a step above than what I used to be.

## 8. Credits

-   [Bootstrap 5.3](https://getbootstrap.com/) and [Bootstrap Icons](https://icons.getbootstrap.com/) (MIT licence)
-   [Chart.js](https://www.chartjs.org/) (MIT licence)
-   Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0)
-   Fonts: [Inter](https://fonts.google.com/specimen/Inter) and
    [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) via Google Fonts
-   Map: Google Maps embed
-   Logo and court illustration created for this project. Fixtures and team members are fictional sample data; CourtList
    is not affiliated with Euroleague Basketball.
