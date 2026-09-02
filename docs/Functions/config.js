/*
    GitHub Pages viewing configuration.

    GitHub Pages serves static files only and cannot execute PHP/MySQL.
    Keeping CALIX_API_URL empty makes the Inventory module use its built-in
    localStorage fallback so Create Inventory, View Inventory, Stock In, and
    Stock Out can still be demonstrated in the browser.

    The XAMPP/database build can set this back to "../api".
*/
window.CALIX_API_URL = "";
