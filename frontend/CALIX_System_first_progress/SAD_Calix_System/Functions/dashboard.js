const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");
const userRole = document.getElementById("userRole");
const settingsLink = document.getElementById("settingsLink");
const role = sessionStorage.getItem("userRole");

if (role !== "Admin" && role !== "Staff") {
    window.location.href = "LoginPage.html";
} else {
    userRole.textContent = role;
}

if (role === "Staff") {
    settingsLink.remove();
}

menuButton.addEventListener("click", function () {
    sidebar.classList.toggle("open");
});
