/**
 * analytics.js
 * Draws the task charts on analytics.html with Chart.js.
 * Colours come from Bootstrap's CSS variables, so the charts match the badges and follow dark mode.
 */
(function () {
    "use strict";

    const statusCanvas = document.getElementById("status-chart");
    const priorityCanvas = document.getElementById("priority-chart");

    const STATUSES = ["todo", "in-progress", "completed"];
    const PRIORITIES = ["high", "medium", "low"];

    // The current chart objects, kept so they can be destroyed before redrawing
    let statusChart = null;
    let priorityChart = null;

    /**
     * Reads a CSS variable from the page, e.g. "--bs-success" -> "#198754".
     */
    function cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    /**
     * Counts tasks per value of a field, in the given order.
     * countBy(tasks, "priority", ["high", "medium", "low"]) -> [3, 3, 2]
     */
    function countBy(tasks, field, values) {
        return values.map(function (value) {
            return tasks.filter(function (task) {
                return task[field] === value;
            }).length;
        });
    }

    /**
     * Builds a text description of a chart for screen readers.
     */
    function describe(labels, counts) {
        return labels
            .map(function (label, index) {
                return counts[index] + " " + label.toLowerCase();
            })
            .join(", ");
    }

    /**
     * Draws (or redraws) both charts from the current tasks and theme.
     */
    function drawCharts() {
        const tasks = TaskStore.getTasks();
        const statusLabels = STATUSES.map(function (status) {
            return TaskStore.STATUS_LABELS[status];
        });
        const priorityLabels = ["High", "Medium", "Low"];
        const statusCounts = countBy(tasks, "status", STATUSES);
        const priorityCounts = countBy(tasks, "priority", PRIORITIES);

        // Text and grid colours follow the current theme
        Chart.defaults.color = cssVar("--bs-body-color");
        Chart.defaults.borderColor = cssVar("--bs-border-color");
        Chart.defaults.font.family = cssVar("--bs-body-font-family");

        // Chart.js can't draw a new chart on a canvas that still has one
        if (statusChart) {
            statusChart.destroy();
        }
        if (priorityChart) {
            priorityChart.destroy();
        }

        statusChart = new Chart(statusCanvas, {
            type: "bar",
            data: {
                labels: statusLabels,
                datasets: [
                    {
                        label: "Tasks",
                        data: statusCounts,
                        backgroundColor: [cssVar("--bs-secondary"), cssVar("--bs-info"), cssVar("--bs-success")],
                        borderRadius: 6
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });

        priorityChart = new Chart(priorityCanvas, {
            type: "doughnut",
            data: {
                labels: priorityLabels,
                datasets: [
                    {
                        data: priorityCounts,
                        backgroundColor: [cssVar("--bs-danger"), cssVar("--bs-warning"), cssVar("--bs-success")],
                        borderColor: cssVar("--bs-body-bg")
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } }
            }
        });

        // Screen readers can't see a canvas, so the numbers go in its label
        statusCanvas.setAttribute(
            "aria-label",
            "Bar chart of tasks by status: " + describe(statusLabels, statusCounts)
        );
        priorityCanvas.setAttribute(
            "aria-label",
            "Doughnut chart of tasks by priority: " + describe(priorityLabels, priorityCounts)
        );
    }

    // Draw now, and redraw when the theme or the tasks change
    drawCharts();
    document.addEventListener("courtlist:themechange", drawCharts);
    document.addEventListener("courtlist:taskschange", drawCharts); // fired by storage.js, added in the Kanban step
})();
