/**
 * storage.js
 * The only file that reads and writes task data in localStorage.
 * All pages use it through the TaskStore object, so the tasks table,
 * Kanban board, charts and activity feed always share the same data.
 */
const TaskStore = (function () {
  "use strict";

  // localStorage keys and limits
  const TASKS_KEY = "courtlist-tasks";
  const ACTIVITY_KEY = "courtlist-activity";
  const MAX_ACTIVITY = 20;

  // Display names for each status, shared by every page
  const STATUS_LABELS = {
    todo: "To do",
    "in-progress": "In progress",
    completed: "Completed"
  };

  // Bootstrap badge colour per priority, shared by every page
  const PRIORITY_BADGES = {
    high: "text-bg-danger",
    medium: "text-bg-warning",
    low: "text-bg-success"
  };

  /* ---------- Low-level helpers (private) ---------- */

  /**
   * Reads and parses a value from localStorage.
   * Returns the fallback if the key is missing, the data is corrupt,
   * or localStorage is blocked.
   */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  /**
   * Converts a value to JSON text and saves it in localStorage.
   */
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("CourtList: could not save to localStorage", error);
    }
  }

  /**
   * Saves the task list and tells any depending page that tasks changed.
   */
  function saveTasks(tasks) {
    write(TASKS_KEY, tasks);
    document.dispatchEvent(new CustomEvent("courtlist:taskschange"));
  }

  /**
   * Creates a unique id from the current time plus a random part.
   */
  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /**
   * Formats a Date as "YYYY-MM-DD" in local time (the format of <input type="date">).
   */
  function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  /**
   * Returns the date a number of days from today, e.g. 3 or -1.
   */
  function daysFromToday(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toDateString(date);
  }

  /**
   * Example tasks shown on the very first visit, so the table,
   * charts and Kanban board are not empty.
   */
  function getSeedTasks() {
    const now = new Date().toISOString();
    const examples = [
      {
        title: "Confirm referee assignments for Round 8",
        description: "Send the final crew list to all home clubs.",
        dueDate: daysFromToday(2),
        priority: "high",
        status: "todo"
      },
      {
        title: "Media accreditation list for Athens game",
        description: "Collect and approve press requests for the home game.",
        dueDate: daysFromToday(1),
        priority: "high",
        status: "in-progress"
      },
      {
        title: "Arena LED board check",
        description: "Test courtside LED boards and the shot clock display.",
        dueDate: daysFromToday(4),
        priority: "medium",
        status: "todo"
      },
      {
        title: "Publish Round 7 highlights package",
        description: "Edit and upload the top 10 plays video.",
        dueDate: daysFromToday(-1),
        priority: "medium",
        status: "completed"
      },
      {
        title: "Update standings graphics",
        description: "Refresh broadcast graphics after the latest results.",
        dueDate: daysFromToday(3),
        priority: "low",
        status: "todo"
      },
      {
        title: "Book team hotel for away trip",
        description: "Reserve rooms for players and staff for the Belgrade game.",
        dueDate: daysFromToday(6),
        priority: "medium",
        status: "in-progress"
      },
      {
        title: "Anti-doping control room setup",
        description: "Prepare the testing room and confirm the officer's arrival.",
        dueDate: daysFromToday(2),
        priority: "high",
        status: "todo"
      },
      {
        title: "Send ticketing report to league office",
        description: "Attendance and sales figures for the last home game.",
        dueDate: daysFromToday(-2),
        priority: "low",
        status: "completed"
      }
    ];

    return examples.map(function (task) {
      return Object.assign({ id: createId(), createdAt: now }, task);
    });
  }

  /**
   * Adds an entry to the activity log (newest first, max 20 kept).
   */
  function logActivity(type, title, detail) {
    const activity = read(ACTIVITY_KEY, []);
    activity.unshift({
      type: type,
      title: title,
      detail: detail || "",
      time: new Date().toISOString()
    });
    write(ACTIVITY_KEY, activity.slice(0, MAX_ACTIVITY));
  }

  /* ---------- Public functions ---------- */

  /**
   * Returns all tasks. On the first visit it saves and returns the example tasks.
   */
  function getTasks() {
    let tasks = read(TASKS_KEY, null);
    if (!Array.isArray(tasks)) {
      tasks = getSeedTasks();
      write(TASKS_KEY, tasks);
    }
    return tasks;
  }

  /**
   * Returns one task by id, or null if it does not exist.
   */
  function getTaskById(id) {
    const task = getTasks().find(function (item) {
      return item.id === id;
    });
    return task || null;
  }

  /**
   * Creates a new task from form data and saves it. New tasks start as "todo".
   */
  function addTask(data) {
    const tasks = getTasks();
    const task = {
      id: createId(),
      title: data.title.trim(),
      description: data.description.trim(),
      dueDate: data.dueDate,
      priority: data.priority,
      status: "todo",
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks(tasks);
    logActivity("added", task.title);
    return task;
  }

  /**
   * Changes fields of an existing task, e.g. { status: "completed" }.
   * Logs a status change separately from a normal edit.
   */
  function updateTask(id, changes) {
    const tasks = getTasks();
    const task = tasks.find(function (item) {
      return item.id === id;
    });
    if (!task) {
      return null;
    }

    const oldStatus = task.status;
    Object.assign(task, changes);
    saveTasks(tasks);

    if (changes.status && changes.status !== oldStatus) {
      logActivity(changes.status === "completed" ? "completed" : "moved", task.title, changes.status);
    } else {
      logActivity("edited", task.title);
    }
    return task;
  }

  /**
   * Removes a task by id. Returns true if a task was deleted.
   */
  function deleteTask(id) {
    const tasks = getTasks();
    const task = tasks.find(function (item) {
      return item.id === id;
    });
    if (!task) {
      return false;
    }

    saveTasks(
      tasks.filter(function (item) {
        return item.id !== id;
      })
    );
    logActivity("deleted", task.title);
    return true;
  }

  /**
   * Returns the activity log, newest entry first.
   */
  function getActivity() {
    return read(ACTIVITY_KEY, []);
  }

  /**
   * "2026-10-25" -> "25 Oct 2026", read as local time (not UTC).
   */
  function formatDate(dateString) {
    const parts = dateString.split("-");
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  /**
   * Makes user text safe to insert with innerHTML (prevents HTML/script injection).
   */
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Only these are visible to other files
  return {
    STATUS_LABELS: STATUS_LABELS,
    PRIORITY_BADGES: PRIORITY_BADGES,
    getTasks: getTasks,
    getTaskById: getTaskById,
    addTask: addTask,
    updateTask: updateTask,
    deleteTask: deleteTask,
    getActivity: getActivity,
    formatDate: formatDate,
    escapeHtml: escapeHtml,
    today: function () {
      return toDateString(new Date());
    }
  };
})();
