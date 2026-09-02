(function () {
    "use strict";

    const form = document.getElementById("inventoryForm");
    const successNotice = document.getElementById("inventorySuccess");
    const errorNotice = document.getElementById("inventoryError");
    const successText = document.getElementById("inventorySuccessText");

    const fields = {
        itemCode: document.getElementById("itemCode"),
        itemName: document.getElementById("itemName"),
        category: document.getElementById("category"),
        unit: document.getElementById("unit"),
        quantity: document.getElementById("quantity"),
        reorderLevel: document.getElementById("reorderLevel"),
        unitCost: document.getElementById("unitCost"),
        sellingPrice: document.getElementById("sellingPrice"),
        supplier: document.getElementById("supplier"),
        location: document.getElementById("location"),
        description: document.getElementById("description")
    };

    const preview = {
        code: document.getElementById("previewCode"),
        name: document.getElementById("previewName"),
        category: document.getElementById("previewCategory"),
        stock: document.getElementById("previewStock"),
        unit: document.getElementById("previewUnit"),
        cost: document.getElementById("previewCost"),
        price: document.getElementById("previewPrice"),
        status: document.getElementById("previewStatus")
    };

    function formatCurrency(value) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP"
        }).format(Number(value) || 0);
    }

    function updatePreview() {
        const quantity = Number(fields.quantity.value) || 0;
        const reorderLevel = Number(fields.reorderLevel.value) || 0;
        let status = "In Stock";
        let statusClass = "status-chip";

        if (quantity <= 0) {
            status = "Out of Stock";
            statusClass += " out";
        } else if (quantity <= reorderLevel) {
            status = "Low Stock";
            statusClass += " low";
        }

        preview.code.textContent = fields.itemCode.value.trim().toUpperCase() || "ITEM CODE";
        preview.name.textContent = fields.itemName.value.trim() || "New inventory item";
        preview.category.textContent = fields.category.value || "Choose a category";
        preview.stock.textContent = quantity.toLocaleString("en-PH");
        preview.unit.textContent = fields.unit.value || "Unit";
        preview.cost.textContent = formatCurrency(fields.unitCost.value);
        preview.price.textContent = formatCurrency(fields.sellingPrice.value);
        preview.status.textContent = status;
        preview.status.className = statusClass;
    }

    function hideNotices() {
        successNotice.classList.remove("show");
        errorNotice.classList.remove("show");
    }

    form.addEventListener("input", function () {
        hideNotices();
        updatePreview();
    });

    form.addEventListener("reset", function () {
        window.setTimeout(function () {
            fields.quantity.value = "0";
            fields.reorderLevel.value = "5";
            updatePreview();
        }, 0);
    });


    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        hideNotices();

        if (!form.reportValidity()) {
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            const savedItem = await window.InventoryData.createItem({
                itemCode: fields.itemCode.value,
                itemName: fields.itemName.value,
                category: fields.category.value,
                unit: fields.unit.value,
                quantity: fields.quantity.value,
                reorderLevel: fields.reorderLevel.value,
                unitCost: fields.unitCost.value,
                sellingPrice: fields.sellingPrice.value,
                supplier: fields.supplier.value,
                location: fields.location.value,
                description: fields.description.value
            });

            successText.textContent = savedItem.itemName + " was added successfully. You can now view or adjust its stock.";
            successNotice.classList.add("show");
            form.reset();
            successNotice.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (error) {
            errorNotice.textContent = error.message || "The inventory item could not be saved.";
            errorNotice.classList.add("show");
            errorNotice.scrollIntoView({ behavior: "smooth", block: "center" });
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    updatePreview();
}());
