// this file contains the needed javascript for the sign up page

document.addEventListener("DOMContentLoaded", function() {
    // Get the form and input elements
    var signUpForm = document.getElementById("signUpForm");
    var usernameInput = document.getElementById("username");
    var emailInput = document.getElementById("email");
    var passwordInput = document.getElementById("password");
    var confirmPasswordInput = document.getElementById("confirm-password");
    var passwordError = document.getElementById("password-error");

    // Add submit event listener to the form
    signUpForm.addEventListener("submit", function(event) {
        // Prevent the form from submitting
        event.preventDefault();

        // Reset error messages
        passwordError.textContent = "";

        // Check username length
        if (usernameInput.value.length < 3) {
            alert("Username is too short (minimum 3 characters).");
            return;
        } else if (usernameInput.value.length > 20) {
            alert("Username is too long (maximum 20 characters).");
            return;
        }

        // Check email validity
        if (!isValidEmail(emailInput.value)) {
            alert("Invalid email address.");
            return;
        }

        // Check password length
        if (passwordInput.value.length < 5) {
            alert("Password is too short (minimum 5 characters).")
            return;
        }

        // Password pattern check (combination of letters, numbers, and special characters)
        var passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
        if (!passwordPattern.test(passwordInput.value)) {
            alert("Password must be a combination of letters, numbers, and special characters.");
            return;
        }

        // Check if the retyped password matches the initial password
        if (confirmPasswordInput.value !== passwordInput.value) {
            alert("Passwords do not match. Please retype the password correctly.");
            return;
        }

        // If all validations pass, submit the form
        signUpForm.submit();
    });
});

// Function to validate email address
function isValidEmail(email) {
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}


// TODO: allow user to see password as typing it in
