/**
 * kanban.js
 * Kanban board on analytics.html: three columns, one card per task.
 * Cards move by drag and drop, or with the arrow buttons (keyboard and touch screens).
 * Moving a card updates the task's status in TaskStore.
 */
(function () {
  "use strict";

  const board = document.getElementById("kanban-board");
  const COLUMNS = ["todo", "in-progress", "completed"];

  /**
   * Returns the HTML for one task card.
   */
  function buildCard(task, columnIndex) {
    const safe = TaskStore.escapeHtml;
    const title = safe(task.title);
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === COLUMNS.length - 1;

    return `<article class="card kanban-card mb-2" draggable="true" data-id="${task.id}">
      <div class="card-body p-3">
        <h4 class="h6 mb-1">${title}</h4>
        <p class="small text-body-secondary mb-2">${safe(task.description)}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge ${TaskStore.PRIORITY_BADGES[task.priority]} text-capitalize">${task.priority}</span>
          <small class="text-body-secondary">${TaskStore.formatDate(task.dueDate)}</small>
        </div>
        <div class="d-flex justify-content-between mt-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-move="-1"
                  aria-label="Move ${title} to the previous column" ${isFirst ? "disabled" : ""}>
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" data-move="1"
                  aria-label="Move ${title} to the next column" ${isLast ? "disabled" : ""}>
            <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </article>`;
  }

  /**
   * Returns the HTML for one column with its cards.
   */
  function buildColumn(status, tasks) {
    const columnIndex = COLUMNS.indexOf(status);
    const columnTasks = tasks.filter(function (task) {
      return task.status === status;
    });
    const cards = columnTasks.map(function (task) {
      return buildCard(task, columnIndex);
    }).join("");

    return `<div class="col-md-4">
      <section class="kanban-column card h-100" data-status="${status}" aria-labelledby="column-${status}">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3 id="column-${status}" class="h6 mb-0">${TaskStore.STATUS_LABELS[status]}</h3>
          <span class="badge text-bg-secondary rounded-pill">${columnTasks.length}</span>
        </div>
        <div class="card-body kanban-dropzone">
          ${cards || '<p class="small text-body-secondary text-center my-3">Drop tasks here</p>'}
        </div>
      </section>
    </div>`;
  }

  /**
   * Redraws the whole board from storage.
   */
  function renderBoard() {
    const tasks = TaskStore.getTasks();
    board.innerHTML = COLUMNS.map(function (status) {
      return buildColumn(status, tasks);
    }).join("");
  }

  /**
   * Changes a task's status if it is different. Saving fires "courtlist:taskschange",
   * which redraws the board and the charts.
   */
  function moveTask(id, newStatus) {
    const task = TaskStore.getTaskById(id);
    if (task && task.status !== newStatus) {
      TaskStore.updateTask(id, { status: newStatus });
    }
  }

  /* ---------- Drag and drop (event delegation on the board) ---------- */

  board.addEventListener("dragstart", function (event) {
    const card = event.target.closest(".kanban-card");
    if (!card) {
      return;
    }
    event.dataTransfer.setData("text/plain", card.dataset.id);
    event.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
  });

  board.addEventListener("dragend", function (event) {
    const card = event.target.closest(".kanban-card");
    if (card) {
      card.classList.remove("dragging");
    }
  });

  board.addEventListener("dragover", function (event) {
    const column = event.target.closest(".kanban-column");
    if (column) {
      event.preventDefault(); // allows dropping here
      column.classList.add("drag-over");
    }
  });

  board.addEventListener("dragleave", function (event) {
    const column = event.target.closest(".kanban-column");
    if (column && !column.contains(event.relatedTarget)) {
      column.classList.remove("drag-over");
    }
  });

  board.addEventListener("drop", function (event) {
    const column = event.target.closest(".kanban-column");
    if (!column) {
      return;
    }
    event.preventDefault();
    column.classList.remove("drag-over");
    moveTask(event.dataTransfer.getData("text/plain"), column.dataset.status);
  });

  /* ---------- Arrow buttons (keyboard and touch alternative) ---------- */

  board.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-move]");
    if (!button) {
      return;
    }
    const id = button.closest(".kanban-card").dataset.id;
    const direction = Number(button.dataset.move);
    const task = TaskStore.getTaskById(id);
    const newIndex = COLUMNS.indexOf(task.status) + direction;

    moveTask(id, COLUMNS[newIndex]);

    // Keep keyboard focus on the moved card after the redraw
    const sameButton = board.querySelector('[data-id="' + id + '"] [data-move="' + direction + '"]');
    const fallback = board.querySelector('[data-id="' + id + '"] [data-move]:not([disabled])');
    (sameButton && !sameButton.disabled ? sameButton : fallback).focus();
  });

  // Draw now, and redraw whenever tasks change
  renderBoard();
  document.addEventListener("courtlist:taskschange", renderBoard);
})();