USE `calix_db`;

-- Adds only the fields used by the current CALIX inventory pages.
-- Run this AFTER importing the provided calix_db.sql file.
ALTER TABLE `inventory`
  ADD COLUMN `item_code` varchar(30) NOT NULL AFTER `material_id`,
  ADD COLUMN `unit_cost` decimal(12,2) NOT NULL DEFAULT 0.00 AFTER `reorder_level`,
  ADD COLUMN `selling_price` decimal(12,2) NOT NULL DEFAULT 0.00 AFTER `unit_cost`,
  ADD COLUMN `supplier` varchar(150) DEFAULT NULL AFTER `selling_price`,
  ADD COLUMN `storage_location` varchar(100) DEFAULT NULL AFTER `supplier`,
  ADD COLUMN `description` varchar(500) DEFAULT NULL AFTER `storage_location`,
  ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `date_added`,
  ADD UNIQUE KEY `uq_inventory_item_code` (`item_code`);
