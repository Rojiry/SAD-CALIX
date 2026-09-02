(function () {
    "use strict";

    const tableBody = document.getElementById("inventoryTableBody");
    const searchInput = document.getElementById("inventorySearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const statusFilter = document.getElementById("statusFilter");
    const exportButton = document.getElementById("exportInventory");
    const resultCount = document.getElementById("inventoryResultCount");
    const previousButton = document.getElementById("previousPage");
    const nextButton = document.getElementById("nextPage");
    const pageNumber = document.getElementById("pageNumber");
    const successNotice = document.getElementById("viewSuccess");
    const errorNotice = document.getElementById("viewError");
    const detailsDialog = document.getElementById("detailsDialog");
    const adjustDialog = document.getElementById("adjustDialog");
    const adjustForm = document.getElementById("adjustStockForm");
    const pageSize = 8;
    let items = [];
    let filteredItems = [];
    let currentPage = 1;

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    function statusClass(status) {
        if (status === "Low Stock") {
            return "status-chip low";
        }
        if (status === "Out of Stock") {
            return "status-chip out";
        }
        return "status-chip";
    }

    function stockClass(status) {
        if (status === "Low Stock") {
            return "stock-number low";
        }
        if (status === "Out of Stock") {
            return "stock-number out";
        }
        return "stock-number";
    }

    function updateMetrics() {
        let lowStock = 0;
        let outOfStock = 0;
        let inventoryValue = 0;

        items.forEach(function (item) {
            const status = window.InventoryData.getStatus(item);
            if (status === "Low Stock") {
                lowStock += 1;
            }
            if (status === "Out of Stock") {
                outOfStock += 1;
            }
            inventoryValue += Number(item.quantity) * Number(item.unitCost);
        });

        document.getElementById("totalItems").textContent = items.length.toLocaleString("en-PH");
        document.getElementById("lowStockItems").textContent = lowStock.toLocaleString("en-PH");
        document.getElementById("outOfStockItems").textContent = outOfStock.toLocaleString("en-PH");
        document.getElementById("inventoryValue").textContent = formatCurrency(inventoryValue);
    }

    function populateCategories() {
        const selected = categoryFilter.value;
        const categories = [];

        items.forEach(function (item) {
            if (!categories.includes(item.category)) {
                categories.push(item.category);
            }
        });

        categories.sort();
        categoryFilter.innerHTML = '<option value="">All categories</option>' + categories.map(function (category) {
            return '<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + '</option>';
        }).join("");
        categoryFilter.value = selected;
    }

    function applyFilters() {
        const query = searchInput.value.trim().toLowerCase();
        const category = categoryFilter.value;
        const status = statusFilter.value;

        filteredItems = items.filter(function (item) {
            const searchable = [
                item.itemCode,
                item.itemName,
                item.category,
                item.supplier,
                item.location
            ].join(" ").toLowerCase();
            const matchesQuery = !query || searchable.includes(query);
            const matchesCategory = !category || item.category === category;
            const matchesStatus = !status || window.InventoryData.getStatus(item) === status;
            return matchesQuery && matchesCategory && matchesStatus;
        });

        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const start = (currentPage - 1) * pageSize;
        const visibleItems = filteredItems.slice(start, start + pageSize);

        if (visibleItems.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10"><div class="empty-state">' +
                '<svg class="empty-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5 12 4l8 4.5v8L12 21l-8-4.5z"></path><path d="m4 8.5 8 4.5 8-4.5M12 13v8"></path></svg>' +
                '<h3>No inventory items found</h3><p>Try another filter or create a new inventory item.</p></div></td></tr>';
        } else {
            tableBody.innerHTML = visibleItems.map(function (item) {
                const status = window.InventoryData.getStatus(item);
                return '<tr>' +
                    '<td><span class="document-number">' + escapeHtml(item.itemCode) + '</span></td>' +
                    '<td class="inventory-name-cell"><span class="cell-title">' + escapeHtml(item.itemName) + '</span><span class="cell-subtitle">' + escapeHtml(item.unit) + '</span></td>' +
                    '<td>' + escapeHtml(item.category) + '</td>' +
                    '<td class="numeric-cell"><span class="' + stockClass(status) + '">' + Number(item.quantity).toLocaleString("en-PH") + '</span></td>' +
                    '<td class="numeric-cell">' + Number(item.reorderLevel).toLocaleString("en-PH") + '</td>' +
                    '<td class="numeric-cell">' + escapeHtml(formatCurrency(item.unitCost)) + '</td>' +
                    '<td class="numeric-cell">' + escapeHtml(formatCurrency(item.sellingPrice)) + '</td>' +
                    '<td class="location-cell"><span class="cell-title">' + escapeHtml(item.location || "Not set") + '</span><span class="cell-subtitle">' + escapeHtml(item.supplier || "No supplier") + '</span></td>' +
                    '<td><span class="' + statusClass(status) + '">' + status + '</span></td>' +
                    '<td><div class="row-actions"><button class="button secondary small" type="button" data-action="details" data-id="' + escapeHtml(item.id) + '">Details</button>' +
                    '<button class="button small" type="button" data-action="adjust" data-id="' + escapeHtml(item.id) + '">Adjust</button></div></td>' +
                    '</tr>';
            }).join("");
        }

        const firstShown = filteredItems.length === 0 ? 0 : start + 1;
        const lastShown = Math.min(start + pageSize, filteredItems.length);
        resultCount.textContent = "Showing " + firstShown + "–" + lastShown + " of " + filteredItems.length + " items";
        pageNumber.textContent = "Page " + currentPage + " of " + totalPages;
        previousButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
    }

    function showDetails(item) {
        document.getElementById("detailTitle").textContent = item.itemName;
        document.getElementById("detailCode").textContent = item.itemCode;
        document.getElementById("detailCategory").textContent = item.category;
        document.getElementById("detailUnit").textContent = item.unit;
        document.getElementById("detailQuantity").textContent = Number(item.quantity).toLocaleString("en-PH");
        document.getElementById("detailReorder").textContent = Number(item.reorderLevel).toLocaleString("en-PH");
        document.getElementById("detailCost").textContent = formatCurrency(item.unitCost);
        document.getElementById("detailPrice").textContent = formatCurrency(item.sellingPrice);
        document.getElementById("detailSupplier").textContent = item.supplier || "Not set";
        document.getElementById("detailLocation").textContent = item.location || "Not set";
        document.getElementById("detailDescription").textContent = item.description || "No description was added.";
        detailsDialog.showModal();
    }

    function showAdjustment(item) {
        adjustForm.reset();
        document.getElementById("adjustItemId").value = item.id;
        document.getElementById("adjustItemName").textContent = item.itemName + " · Available: " + Number(item.quantity).toLocaleString("en-PH") + " " + item.unit.toLowerCase();
        adjustDialog.showModal();
    }

    async function refreshInventory() {
        try {
            items = await window.InventoryData.listItems();
            populateCategories();
            updateMetrics();
            applyFilters();
        } catch (error) {
            errorNotice.textContent = error.message || "Inventory records could not be loaded.";
            errorNotice.classList.add("show");
        }
    }

    function exportCsv() {
        const rows = [[
            "Item Code", "Item Name", "Category", "Unit", "Quantity", "Reorder Level",
            "Unit Cost", "Selling Price", "Supplier", "Location", "Status"
        ]];

        filteredItems.forEach(function (item) {
            rows.push([
                item.itemCode, item.itemName, item.category, item.unit, item.quantity,
                item.reorderLevel, item.unitCost, item.sellingPrice, item.supplier,
                item.location, window.InventoryData.getStatus(item)
            ]);
        });

        const csv = rows.map(function (row) {
            return row.map(function (cell) {
                return '"' + String(cell).replaceAll('"', '""') + '"';
            }).join(",");
        }).join("\n");

        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "CALIX_Inventory.csv";
        link.click();
        URL.revokeObjectURL(url);
    }

    searchInput.addEventListener("input", applyFilters);
    categoryFilter.addEventListener("change", applyFilters);
    statusFilter.addEventListener("change", applyFilters);
    exportButton.addEventListener("click", exportCsv);

    previousButton.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage -= 1;
            renderTable();
        }
    });

    nextButton.addEventListener("click", function () {
        const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
        if (currentPage < totalPages) {
            currentPage += 1;
            renderTable();
        }
    });

    tableBody.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const item = items.find(function (entry) {
            return entry.id === button.dataset.id;
        });

        if (!item) {
            return;
        }

        if (button.dataset.action === "details") {
            showDetails(item);
        } else if (button.dataset.action === "adjust") {
            showAdjustment(item);
        }
    });

    document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
        button.addEventListener("click", function () {
            button.closest("dialog").close();
        });
    });

    adjustForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const submitButton = adjustForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            const movementType = document.getElementById("movementType").value;
            const quantity = document.getElementById("movementQuantity").value;
            const reason = document.getElementById("movementReason").value;
            await window.InventoryData.adjustStock(document.getElementById("adjustItemId").value, {
                movementType: movementType,
                quantity: quantity,
                reason: reason
            });
            adjustDialog.close();
            successNotice.textContent = "Stock quantity was updated and the movement was recorded.";
            successNotice.classList.add("show");
            errorNotice.classList.remove("show");
            await refreshInventory();
        } catch (error) {
            errorNotice.textContent = error.message || "Stock could not be adjusted.";
            errorNotice.classList.add("show");
            adjustDialog.close();
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Save Adjustment";
        }
    });

    window.addEventListener("calix:search", function (event) {
        searchInput.value = event.detail.query;
        applyFilters();
    });

    refreshInventory();
}());
