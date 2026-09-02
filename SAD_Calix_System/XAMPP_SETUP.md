# CALIX Inventory - XAMPP Setup

This version connects the existing CALIX Inventory pages to the provided `calix_db` MySQL/MariaDB database.

## 1. Put the project in htdocs

Copy the `SAD_Calix_System` folder to:

`C:\xampp\htdocs\SAD_Calix_System`

## 2. Start XAMPP

Start **Apache** and **MySQL** in the XAMPP Control Panel.

## 3. Import the supplied database

Open phpMyAdmin:

`http://localhost/phpmyadmin`

Choose **Import** and import the original `calix_db.sql` file first.

## 4. Run the inventory upgrade

In phpMyAdmin, select the `calix_db` database, open the **Import** tab again, and import:

`database_inventory_upgrade.sql`

This adds the fields already used by the CALIX Create Inventory form: item code, prices, supplier, location, description, and updated date.

## 5. Open CALIX through localhost

Do NOT double-click the HTML file from File Explorer. Open it through Apache:

`http://localhost/SAD_Calix_System/HTML/LoginPage.html`

The inventory pages will automatically call:

`../api/inventory.php`

## Inventory features connected to MySQL

- Create an inventory item
- View saved inventory items
- Search/filter inventory
- Stock In
- Stock Out
- Record each stock movement in `inventory_transactions`
- Preserve data after browser refresh/restart

## Database connection

The connection file is `api/db.php` and currently uses the normal XAMPP defaults:

- Host: `127.0.0.1`
- User: `root`
- Password: blank
- Database: `calix_db`

If your MySQL root user has a password, edit only `api/db.php`.

## Progress-check note

The inventory table starts empty because the provided SQL has no sample inventory rows. The other tables in the supplied database still contain their original sample data, but the current CALIX progress-check pages do not display those records.
