const form = document.querySelector(".login-form");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const user = document.getElementById("user").value.trim();
    const pass = document.getElementById("password").value;

    if (user === "admin" && pass === "admin123") {
        alert("-ADMIN-");
        window.location.href = "Dashboard.html";
    } else if (user === "staff" && pass === "staff123") {
        alert("-STAFF-");
        window.location.href = "Dashboard.html";
    } else {
        alert("Incorrect username or password");
    }
});
