const role = sessionStorage.getItem("userRole");
const loggingMessage = document.getElementById("loggingMessage");

if (role === "Admin" || role === "Staff" ) {
    loggingMessage.textContent = `Logging in as ${role}...`;

    setTimeout(function () {
        window.location.href = "Dashboard.html";
    }, 1500);
} else {
    window.location.href = "LoginPage.html";
}
