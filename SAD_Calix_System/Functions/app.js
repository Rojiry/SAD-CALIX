(function () {
    const page = document.body.dataset.page || "dashboard";
    const role = sessionStorage.getItem("userRole");
    const sidebar = document.getElementById("sidebar");
    const topbar = document.getElementById("topbar");

    if (role !== "Admin" && role !== "Staff") {
        window.location.replace("LoginPage.html");
        return;
    }

    const icons = {
        home: '<path d="m3 11 9-8 9 8"></path><path d="M5 10v10h14V10"></path>',
        quotation: '<path d="M6 3h9l4 4v14H6z"></path><path d="M15 3v5h5M9 13h7M9 17h5"></path>',
        sales: '<path d="M4 5h16v14H4z"></path><path d="M4 10h16M9 5v14"></path>',
        inventory: '<path d="M4 8.5 12 4l8 4.5v8L12 21l-8-4.5z"></path><path d="m4 8.5 8 4.5 8-4.5M12 13v8"></path>',
        projects: '<path d="M4 7h6l2 2h8v10H4z"></path>',
        customers: '<circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="9" r="2"></circle><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 5"></path>',
        reports: '<path d="M6 3h9l4 4v14H6z"></path><path d="M15 3v5h5M9 16v-3M13 16V9M17 16v-5"></path>',
        settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 6a8 8 0 0 0-1.7 1L5 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5 18l2.3-1a8 8 0 0 0 1.7 1l.5 3h5l.5-3a8 8 0 0 0 1.7-1l2.3 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1z"></path>',
        logout: '<path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"></path>'
    };

    function navIcon(name) {
        return '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + '</svg>';
    }

    function isActive(name) {
        return page === name ? " active" : "";
    }

    function groupIsActive(name) {
        if (name === "quotation" && page === "projects") {
            return true;
        }
        return page.indexOf(name + "-") === 0;
    }

    function navGroup(name, label, iconName, links) {
        const openClass = groupIsActive(name) ? " open" : "";
        const activeClass = groupIsActive(name) ? " active" : "";
        const expanded = groupIsActive(name) ? "true" : "false";
        let submenu = "";

        links.forEach(function (link) {
            submenu += '<a class="' + isActive(link.page).trim() + '" href="' + link.href + '">' + link.label + '</a>';
        });

        return '<div class="nav-group' + openClass + '" data-group="' + name + '">' +
            '<button class="nav-toggle' + activeClass + '" type="button" aria-expanded="' + expanded + '">' +
            navIcon(iconName) + '<span class="nav-toggle-text">' + label + '</span><span class="nav-caret" aria-hidden="true"></span></button>' +
            '<div class="nav-submenu">' + submenu + '</div></div>';
    }

    sidebar.innerHTML =
        '<a class="sidebar-logo-link" href="Dashboard.html" aria-label="Go to CALIX dashboard">' +
        '<img class="sidebar-logo" src="../Assets/Logo1.png" alt="CALIX Glass and Aluminum Fabrication"></a>' +
        '<nav class="nav-list" aria-label="Main navigation">' +
        '<a class="nav-link' + isActive("dashboard") + '" href="Dashboard.html">' + navIcon("home") + 'Dashboard</a>' +
        navGroup("quotation", "Quotation", "quotation", [
            { page: "quotation-create", href: "CreateQuotation.html", label: "Create a Quotation" },
            { page: "projects", href: "Projects.html", label: "Existing Projects" }
        ]) +
        '<a class="nav-link' + isActive("sales-summary") + '" href="ViewSales.html">' + navIcon("sales") + 'Summary of Sales</a>' +
        navGroup("inventory", "Inventory", "inventory", [
            { page: "inventory-create", href: "CreateInventory.html", label: "Create Inventory" },
            { page: "inventory-view", href: "ViewInventory.html", label: "View Inventory" }
        ]) +
        '<a class="nav-link' + isActive("customers") + '" href="Customers.html">' + navIcon("customers") + 'Customers</a>' +
        '<a class="nav-link' + isActive("reports") + '" href="Reports.html">' + navIcon("reports") + 'Reports</a>' +
        '<a id="settingsLink" class="nav-link' + isActive("settings") + '" href="Settings.html">' + navIcon("settings") + 'Settings</a>' +
        '</nav>' +
        '<div class="sidebar-footer"><button id="logoutButton" class="logout-button" type="button">' + navIcon("logout") + 'Logout</button></div>';

    topbar.innerHTML =
        '<button id="menuButton" class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false">☰</button>' +
        '<label class="header-search">' +
        '<span class="sr-only">Search this workspace</span>' +
        '<svg class="topbar-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>' +
        '<input id="globalSearch" type="search" placeholder="Search this workspace" autocomplete="off"></label>' +
        '<div class="account"><div class="account-copy"><strong id="userRole"></strong><small>CALIX account</small></div>' +
        '<svg class="account-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg></div>';

    document.getElementById("userRole").textContent = role;

    if (role === "Staff") {
        const settingsLink = document.getElementById("settingsLink");
        if (settingsLink) {
            settingsLink.remove();
        }

        document.querySelectorAll("[data-admin-only]").forEach(function (element) {
            element.remove();
        });

        if (page === "settings") {
            window.location.replace("Dashboard.html");
            return;
        }
    }

    const menuButton = document.getElementById("menuButton");
    const logoutButton = document.getElementById("logoutButton");
    const overlay = document.getElementById("sidebarOverlay");
    const globalSearch = document.getElementById("globalSearch");

    function closeSidebar() {
        sidebar.classList.remove("open");
        document.body.classList.remove("sidebar-open");
        menuButton.setAttribute("aria-expanded", "false");
        if (overlay) {
            overlay.classList.remove("show");
        }
    }

    function openSidebar() {
        sidebar.classList.add("open");
        document.body.classList.add("sidebar-open");
        menuButton.setAttribute("aria-expanded", "true");
        if (overlay) {
            overlay.classList.add("show");
        }
    }

    menuButton.addEventListener("click", function () {
        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    if (overlay) {
        overlay.addEventListener("click", closeSidebar);
    }

    document.querySelectorAll(".nav-toggle").forEach(function (toggle) {
        toggle.addEventListener("click", function () {
            const group = toggle.closest(".nav-group");
            const willOpen = !group.classList.contains("open");

            document.querySelectorAll(".nav-group").forEach(function (otherGroup) {
                otherGroup.classList.remove("open");
                otherGroup.querySelector(".nav-toggle").setAttribute("aria-expanded", "false");
            });

            if (willOpen) {
                group.classList.add("open");
                toggle.setAttribute("aria-expanded", "true");
            }
        });
    });

    document.querySelectorAll(".nav-link, .nav-submenu a").forEach(function (link) {
        link.addEventListener("click", closeSidebar);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    logoutButton.addEventListener("click", function () {
        sessionStorage.removeItem("userRole");
        window.location.replace("LoginPage.html");
    });

    globalSearch.addEventListener("input", function () {
        window.dispatchEvent(new CustomEvent("calix:search", {
            detail: { query: globalSearch.value.trim() }
        }));
    });

    window.addEventListener("pageshow", function () {
        const currentRole = sessionStorage.getItem("userRole");
        if (currentRole !== "Admin" && currentRole !== "Staff") {
            window.location.replace("LoginPage.html");
        }
    });
}());
