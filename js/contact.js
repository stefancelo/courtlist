/**
 * contact.js
 * Contact page: validates every field, keeps the Send button disabled until the whole form
 * is valid, and shows the submitted details in a confirmation pop-up.
 * Nothing is sent to a server; the details are only displayed.
 */
(function () {
    "use strict";

    const form = document.querySelector("#contact-form");
    const submitButton = document.querySelector("#contact-submit");
    const nameInput = document.querySelector("#contact-name");
    const emailInput = document.querySelector("#contact-email");
    const subjectInput = document.querySelector("#contact-subject");
    const messageInput = document.querySelector("#contact-message");
    const fields = [nameInput, emailInput, subjectInput, messageInput];

    // Bootstrap's modal component, controlled from JS
    const confirmModal = new bootstrap.Modal(document.querySelector("#confirm-modal"));

    // Something@something.something, with a domain ending of at least 2 letters
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    /**
     * Marks a field valid or invalid. An empty message means valid.
     */
    function setRule(input, isValid, message) {
        input.setCustomValidity(isValid ? "" : message);
    }

    /**
     * Custom checks on top of the built-in "required" and "maxlength" rules.
     */
    function validateCustomRules() {
        setRule(nameInput, nameInput.value.trim().length >= 2, "Name must be at least 2 characters.");
        setRule(emailInput, EMAIL_PATTERN.test(emailInput.value.trim()), "Enter a valid email address.");
        setRule(subjectInput, subjectInput.value.trim().length >= 3, "Subject must be at least 3 characters.");
        setRule(messageInput, messageInput.value.trim().length >= 10, "Message must be at least 10 characters.");
    }

    /**
     * Shows one field as valid (green) or invalid (red with its message).
     */
    function showFieldState(input) {
        const isValid = input.checkValidity();
        input.classList.toggle("is-invalid", !isValid);
        input.classList.toggle("is-valid", isValid);
    }

    /**
     * Re-checks all fields and enables the Send button only when every field is valid.
     */
    function updateSubmitButton() {
        validateCustomRules();
        submitButton.disabled = !form.checkValidity();
    }

    /**
     * Copies the submitted values into the pop-up and opens it.
     * textContent is used, so the user's text is shown as plain text, never as HTML.
     */
    function showConfirmation() {
        document.querySelector("#confirm-name").textContent = nameInput.value.trim();
        document.querySelector("#confirm-email").textContent = emailInput.value.trim();
        document.querySelector("#confirm-subject").textContent = subjectInput.value.trim();
        document.querySelector("#confirm-message").textContent = messageInput.value.trim();
        confirmModal.show();
    }

    /**
     * Clears the form and its red/green states after a successful send.
     */
    function resetForm() {
        form.reset();
        fields.forEach(function (input) {
            input.classList.remove("is-valid", "is-invalid");
            delete input.dataset.touched;
        });
        updateSubmitButton();
    }

    // While typing: update the button, and the field's colour if the user has already left it once
    form.addEventListener("input", function (event) {
        updateSubmitButton();
        if (event.target.dataset.touched === "true") {
            showFieldState(event.target);
        }
    });

    // When leaving a field: mark it as touched and show whether it is valid
    form.addEventListener("focusout", function (event) {
        if (fields.includes(event.target)) {
            event.target.dataset.touched = "true";
            showFieldState(event.target);
        }
    });

    // Safety net: even if the button were enabled by other means, an invalid form is never sent
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        updateSubmitButton();

        if (!form.checkValidity()) {
            fields.forEach(showFieldState);
            return;
        }

        showConfirmation();
        resetForm();
    });

    // The button starts disabled because the empty form is invalid
    updateSubmitButton();
})();
