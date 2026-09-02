# CALIX Database Integration Guide

## Recommended setup

For a small business system like CALIX, use this structure:

1. The existing HTML, CSS, and JavaScript files provide the user interface.
2. A server-side REST API handles validation, login, calculations, and database queries.
3. MySQL or MariaDB stores the permanent business records.

The browser must never connect directly to MySQL or contain database credentials. A PHP API is a practical option when the system will run through XAMPP or common shared hosting. Node.js or another server technology can also be used without changing the inventory pages, as long as it follows the same API contract.

## Current inventory behavior

`Functions/inventory-data.js` is the inventory data-service layer. It currently uses browser `localStorage` so Create Inventory, View Inventory, filters, totals, and stock adjustments can be tested before the database exists.

When the API is ready, edit only `Functions/config.js` and set:

```javascript
window.CALIX_API_URL = "http://localhost/CALIX/api";
```

The inventory page scripts can remain unchanged.

## First database tables

Build the inventory module with separate master and transaction records:

- `inventory_categories`: `category_id`, `category_name`, `is_active`
- `suppliers`: `supplier_id`, `supplier_name`, `contact_person`, `phone`, `email`, `address`, `is_active`
- `inventory_items`: `inventory_id`, `item_code`, `item_name`, `category_id`, `unit`, `quantity`, `reorder_level`, `unit_cost`, `selling_price`, `supplier_id`, `storage_location`, `description`, `is_active`, `created_at`, `updated_at`
- `inventory_movements`: `movement_id`, `inventory_id`, `movement_type`, `quantity`, `previous_quantity`, `new_quantity`, `reason`, `reference_type`, `reference_id`, `created_by`, `created_at`

`inventory_items` is the current item record. `inventory_movements` is the audit history for every delivery, project release, return, and correction. Stock changes should update the item and insert a movement within one database transaction.

## Inventory API contract

The current data service expects these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/inventory/items` | Return all inventory items or a paginated item list |
| `GET` | `/inventory/items/{id}` | Return one inventory item |
| `POST` | `/inventory/items` | Create an item and its opening-stock movement |
| `PATCH` | `/inventory/items/{id}` | Update item details without silently changing stock |
| `POST` | `/inventory/items/{id}/movements` | Record stock in or stock out and return the updated item |

The API can return either a JSON item/list directly or inside a `data` property.

## Important validation

- Item codes must be unique.
- Quantities, reorder levels, costs, and prices cannot be negative.
- A stock-out transaction cannot exceed the available stock unless CALIX later chooses to allow backorders.
- Stock quantity should change only through a movement record after item creation.
- Deleted items with transaction history should normally be marked inactive instead of being permanently removed.
- The server must validate every request even when the form already validates it in the browser.

## Later module relationships

After Inventory, add these related tables in order:

1. `users` and `roles`
2. `customers`
3. `quotations` and `quotation_items`
4. `sales` and `sale_items`
5. `projects` and `project_materials`

When a sale or project releases inventory, save the sale/project record and its inventory movement together. Quotation items should not reduce stock because a quotation is only an estimate.

The current login is for interface testing only. Production login should be checked by the server, passwords should be hashed, and the server should control Admin and Staff permissions.
