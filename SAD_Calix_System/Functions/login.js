const form = document.querySelector(".login-form");
const userInput = document.getElementById("user");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const user = userInput.value.trim().toLowerCase();
    const pass = passwordInput.value;
    let role = "";

    if (user === "admin" && pass === "admin123") {
        role = "Admin";
    } else if (user === "staff" && pass === "staff123") {
        role = "Staff";
    }
    
    if (role) {
        sessionStorage.setItem("userRole", role);
        window.location.href = "LoadingPage.html";
    } else {
        loginError.textContent = "Incorrect username or password.";
        userInput.classList.add("invalid");
        passwordInput.classList.add("invalid");
    }
});

form.addEventListener("input", function () {
    loginError.textContent = "";
    userInput.classList.remove("invalid");
    passwordInput.classList.remove("invalid");
});
