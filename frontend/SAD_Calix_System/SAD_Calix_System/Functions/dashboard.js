const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

menuButton.addEventListener("click", function () {
    sidebar.classList.toggle("open");
});
