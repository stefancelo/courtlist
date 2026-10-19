/**
 * tasks.js
 * Tasks page: renders the tasks table and handles the add-task form.
 * All data goes through TaskStore (storage.js).
 */
(function () {
    "use strict";

    // Elements used on this page
    const tableBody = document.getElementById("task-table-body");
    const emptyMessage = document.getElementById("empty-message");
    const countTotal = document.getElementById("count-total");
    const countPending = document.getElementById("count-pending");
    const countCompleted = document.getElementById("count-completed");

    // Bootstrap badge colour per priority and status
    const PRIORITY_BADGES = {
        high: "text-bg-danger",
        medium: "text-bg-warning",
        low: "text-bg-success"
    };

    const STATUS_LABELS = {
        todo: "To do",
        "in-progress": "In progress",
        completed: "Completed"
    };

    const STATUS_BADGES = {
        todo: "text-bg-secondary",
        "in-progress": "text-bg-info",
        completed: "text-bg-success"
    };

    /**
     * "high" -> "High"
     */
    function capitalise(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    /**
     * "2026-10-25" -> "25 Oct 2026"
     * Built from its parts so the date is read as local time, not UTC.
     */
    function formatDate(dateString) {
        const parts = dateString.split("-");
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }

    /**
     * Returns the HTML for one table row. User text is escaped before insertion.
     * Action buttons carry the task id in data-id so one click handler serves all rows.
     */
    function buildRow(task) {
        const safe = TaskStore.escapeHtml;
        const title = safe(task.title);
        const isDone = task.status === "completed";
        const toggleLabel = isDone ? "Mark as not completed" : "Mark as completed";

        return `<tr>
      <td class="${isDone ? "text-decoration-line-through text-body-secondary" : "fw-semibold"}">${title}</td>
      <td class="text-body-secondary">${safe(task.description)}</td>
      <td class="text-nowrap">${formatDate(task.dueDate)}</td>
      <td><span class="badge ${PRIORITY_BADGES[task.priority]}">${capitalise(task.priority)}</span></td>
      <td><span class="badge ${STATUS_BADGES[task.status]}">${STATUS_LABELS[task.status]}</span></td>
      <td class="text-end text-nowrap">
        <button type="button" class="btn btn-sm btn-outline-success" data-action="toggle" data-id="${task.id}"
                title="${toggleLabel}" aria-label="${toggleLabel}: ${title}">
          <i class="bi ${isDone ? "bi-arrow-counterclockwise" : "bi-check-lg"}" aria-hidden="true"></i>
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${task.id}"
                title="Edit" aria-label="Edit: ${title}">
          <i class="bi bi-pencil" aria-hidden="true"></i>
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${task.id}"
                title="Delete" aria-label="Delete: ${title}">
          <i class="bi bi-trash" aria-hidden="true"></i>
        </button>
      </td>
    </tr>`;
    }
    /**
     * Updates the summary counters. "Pending" = everything not completed
     * (both "To do" and "In progress").
     */
    function renderSummary(tasks) {
        const completed = tasks.filter(function (task) {
            return task.status === "completed";
        }).length;

        countTotal.textContent = tasks.length;
        countPending.textContent = tasks.length - completed;
        countCompleted.textContent = completed;
    }
    /**
     * Switches a task between completed and to do.
     */
    function toggleComplete(id) {
        const task = TaskStore.getTaskById(id);
        if (!task) {
            return;
        }
        const newStatus = task.status === "completed" ? "todo" : "completed";
        TaskStore.updateTask(id, { status: newStatus });
        renderTasks();
    }

    /**
     * Deletes a task after the user confirms.
     */
    function removeTask(id) {
        const task = TaskStore.getTaskById(id);
        if (!task) {
            return;
        }
        if (!confirm('Delete "' + task.title + '"? This cannot be undone.')) {
            return;
        }
        // If the task being edited is deleted, leave edit mode
        if (editingTask && editingTask.id === id) {
            exitEditMode();
        }
        TaskStore.deleteTask(id);
        renderTasks();
    }

    /**
     * One click listener for the whole table (event delegation).
     * Finds the clicked button and runs the matching action.
     */
    tableBody.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "toggle") {
            toggleComplete(id);
        } else if (action === "edit") {
            startEdit(id);
        } else if (action === "delete") {
            removeTask(id);
        }
    });
    /**
     * Redraws the whole table from storage. Called on load and after every change.
     */
    function renderTasks() {
        const tasks = TaskStore.getTasks();
        tableBody.innerHTML = tasks.map(buildRow).join("");
        emptyMessage.classList.toggle("d-none", tasks.length > 0);
        renderSummary(tasks);
    }

    // Form elements
    const form = document.getElementById("task-form");
    const formHeading = document.getElementById("form-heading");
    const submitButton = document.getElementById("form-submit");
    const cancelButton = document.getElementById("form-cancel");
    const titleInput = document.getElementById("task-title");
    const descriptionInput = document.getElementById("task-description");
    const dueInput = document.getElementById("task-due");
    const priorityInput = document.getElementById("task-priority");

    // The task being edited, or null when the form is adding a new task
    let editingTask = null;

    /**
     * Custom checks the built-in HTML rules can't do.
     * setCustomValidity("") means valid; any other text marks the field invalid.
     */
    function validateCustomRules() {
        const titleTooShort = titleInput.value.trim().length < 3;
        titleInput.setCustomValidity(titleTooShort ? "Task name must be at least 3 characters." : "");

        const descriptionEmpty = descriptionInput.value.trim() === "";
        descriptionInput.setCustomValidity(descriptionEmpty ? "Description is required." : "");

        // An overdue task being edited may keep its original date
        const keepsOriginalDate = editingTask !== null && dueInput.value === editingTask.dueDate;
        const dueInPast = dueInput.value !== "" && dueInput.value < TaskStore.today() && !keepsOriginalDate;
        dueInput.setCustomValidity(dueInPast ? "Due date cannot be in the past." : "");
    }

    /**
     * Fills the form with a task's data and switches it to edit mode.
     */
    function startEdit(id) {
        const task = TaskStore.getTaskById(id);
        if (!task) {
            return;
        }

        editingTask = task;
        titleInput.value = task.title;
        descriptionInput.value = task.description;
        dueInput.value = task.dueDate;
        priorityInput.value = task.priority;

        // Allow the original date even if it is already in the past
        const today = TaskStore.today();
        dueInput.min = task.dueDate < today ? task.dueDate : today;

        formHeading.textContent = "Edit task";
        submitButton.textContent = "Save changes";
        cancelButton.classList.remove("d-none");
        form.classList.remove("was-validated");
        titleInput.focus();
    }

    /**
     * Clears the form and switches it back to add mode.
     */
    function exitEditMode() {
        editingTask = null;
        form.reset();
        form.classList.remove("was-validated");
        dueInput.min = TaskStore.today();
        formHeading.textContent = "Add a task";
        submitButton.textContent = "Add task";
        cancelButton.classList.add("d-none");
    }

    /**
     * Validates the form, then adds a new task or saves the edited one.
     */
    function handleSubmit(event) {
        event.preventDefault();
        validateCustomRules();

        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const data = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            dueDate: dueInput.value,
            priority: priorityInput.value
        };

        if (editingTask) {
            TaskStore.updateTask(editingTask.id, data);
        } else {
            TaskStore.addTask(data);
        }

        exitEditMode();
        renderTasks();
        titleInput.focus();
    }

    dueInput.min = TaskStore.today();
    form.addEventListener("submit", handleSubmit);
    form.addEventListener("input", validateCustomRules);
    cancelButton.addEventListener("click", exitEditMode);

    // Start
    renderTasks();
})();
