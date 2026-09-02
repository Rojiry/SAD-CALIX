(function () {
    "use strict";

    /*
        Database integration point:
        Leave CALIX_API_URL empty while designing the interface. The service will
        use an empty localStorage workspace. Later, set window.CALIX_API_URL to the server
        API address and keep the page scripts unchanged.
    */
    const API_BASE = window.CALIX_API_URL || "";
    const ITEMS_KEY = "calixInventoryItemsV2";
    const MOVEMENTS_KEY = "calixInventoryMovementsV2";

    const sampleItems = [];

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function readLocal(key, fallback) {
        const stored = localStorage.getItem(key);

        if (!stored) {
            localStorage.setItem(key, JSON.stringify(fallback));
            return clone(fallback);
        }

        try {
            return JSON.parse(stored);
        } catch (error) {
            localStorage.setItem(key, JSON.stringify(fallback));
            return clone(fallback);
        }
    }

    function writeLocal(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function normalizeItem(item) {
        return {
            id: item.id ? String(item.id) : "",
            itemCode: String(item.itemCode || "").trim().toUpperCase(),
            itemName: String(item.itemName || "").trim(),
            category: String(item.category || "Other").trim(),
            unit: String(item.unit || "Piece").trim(),
            quantity: Number(item.quantity) || 0,
            reorderLevel: Number(item.reorderLevel) || 0,
            unitCost: Number(item.unitCost) || 0,
            sellingPrice: Number(item.sellingPrice) || 0,
            supplier: String(item.supplier || "").trim(),
            location: String(item.location || "").trim(),
            description: String(item.description || "").trim(),
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || ""
        };
    }

    async function request(path, options) {
        const response = await fetch(API_BASE + path, {
            method: options && options.method ? options.method : "GET",
            headers: {
                "Content-Type": "application/json"
            },
            body: options && options.body ? JSON.stringify(options.body) : undefined
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "The inventory request could not be completed.");
        }

        if (response.status === 204) {
            return null;
        }

        const result = await response.json();
        return result.data === undefined ? result : result.data;
    }

    async function listItems() {
        if (API_BASE) {
            const items = await request("/inventory.php?action=list");
            return items.map(normalizeItem);
        }

        return readLocal(ITEMS_KEY, sampleItems).map(normalizeItem);
    }

    async function getItem(id) {
        if (API_BASE) {
            return normalizeItem(await request("/inventory.php?action=get&id=" + encodeURIComponent(id)));
        }

        const items = await listItems();
        return items.find(function (item) {
            return item.id === String(id);
        }) || null;
    }

    async function createItem(data) {
        const payload = normalizeItem(data);

        if (API_BASE) {
            return normalizeItem(await request("/inventory.php?action=create", {
                method: "POST",
                body: payload
            }));
        }

        const items = await listItems();
        const duplicate = items.some(function (item) {
            return item.itemCode.toLowerCase() === payload.itemCode.toLowerCase();
        });

        if (duplicate) {
            throw new Error("That item code is already in use.");
        }

        const now = new Date().toISOString();
        payload.id = "inv-" + Date.now().toString(36);
        payload.createdAt = now;
        payload.updatedAt = now;
        items.unshift(payload);
        writeLocal(ITEMS_KEY, items);

        if (payload.quantity > 0) {
            const movements = readLocal(MOVEMENTS_KEY, []);
            movements.unshift({
                id: "mov-" + Date.now().toString(36),
                itemId: payload.id,
                movementType: "stock_in",
                quantity: payload.quantity,
                previousQuantity: 0,
                newQuantity: payload.quantity,
                reason: "Opening stock",
                createdBy: sessionStorage.getItem("userRole") || "User",
                createdAt: now
            });
            writeLocal(MOVEMENTS_KEY, movements);
        }

        return clone(payload);
    }

    async function updateItem(id, changes) {
        if (API_BASE) {
            return normalizeItem(await request("/inventory.php?action=update&id=" + encodeURIComponent(id), {
                method: "PATCH",
                body: changes
            }));
        }

        const items = await listItems();
        const index = items.findIndex(function (item) {
            return item.id === String(id);
        });

        if (index < 0) {
            throw new Error("Inventory item not found.");
        }

        const updated = normalizeItem(Object.assign({}, items[index], changes, {
            id: items[index].id,
            createdAt: items[index].createdAt,
            updatedAt: new Date().toISOString()
        }));

        const duplicate = items.some(function (item, itemIndex) {
            return itemIndex !== index && item.itemCode.toLowerCase() === updated.itemCode.toLowerCase();
        });

        if (duplicate) {
            throw new Error("That item code is already in use.");
        }

        items[index] = updated;
        writeLocal(ITEMS_KEY, items);
        return clone(updated);
    }

    async function adjustStock(id, movement) {
        const quantity = Number(movement.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error("Enter a quantity greater than zero.");
        }

        if (movement.movementType !== "stock_in" && movement.movementType !== "stock_out") {
            throw new Error("Select a valid stock movement.");
        }

        if (API_BASE) {
            return normalizeItem(await request("/inventory.php?action=movement&id=" + encodeURIComponent(id), {
                method: "POST",
                body: movement
            }));
        }

        const items = await listItems();
        const index = items.findIndex(function (item) {
            return item.id === String(id);
        });

        if (index < 0) {
            throw new Error("Inventory item not found.");
        }

        const previousQuantity = Number(items[index].quantity);
        const nextQuantity = movement.movementType === "stock_in"
            ? previousQuantity + quantity
            : previousQuantity - quantity;

        if (nextQuantity < 0) {
            throw new Error("Stock out cannot be greater than the available quantity.");
        }

        items[index].quantity = nextQuantity;
        items[index].updatedAt = new Date().toISOString();
        writeLocal(ITEMS_KEY, items);

        const movements = readLocal(MOVEMENTS_KEY, []);
        movements.unshift({
            id: "mov-" + Date.now().toString(36),
            itemId: items[index].id,
            movementType: movement.movementType,
            quantity: quantity,
            previousQuantity: previousQuantity,
            newQuantity: nextQuantity,
            reason: String(movement.reason || "").trim(),
            createdBy: sessionStorage.getItem("userRole") || "User",
            createdAt: items[index].updatedAt
        });
        writeLocal(MOVEMENTS_KEY, movements);
        return clone(items[index]);
    }

    function getStatus(item) {
        const quantity = Number(item.quantity);
        const reorderLevel = Number(item.reorderLevel);

        if (quantity <= 0) {
            return "Out of Stock";
        }

        if (quantity <= reorderLevel) {
            return "Low Stock";
        }

        return "In Stock";
    }

    async function getStats() {
        const items = await listItems();
        let lowStock = 0;
        let outOfStock = 0;
        let inventoryValue = 0;

        items.forEach(function (item) {
            const status = getStatus(item);
            if (status === "Low Stock") {
                lowStock += 1;
            }
            if (status === "Out of Stock") {
                outOfStock += 1;
            }
            inventoryValue += Number(item.quantity) * Number(item.unitCost);
        });

        return {
            totalItems: items.length,
            lowStock: lowStock,
            outOfStock: outOfStock,
            inventoryValue: inventoryValue
        };
    }

    window.InventoryData = {
        listItems: listItems,
        getItem: getItem,
        createItem: createItem,
        updateItem: updateItem,
        adjustStock: adjustStock,
        getStatus: getStatus,
        getStats: getStats,
        usesDatabaseApi: Boolean(API_BASE)
    };
}());
