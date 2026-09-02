<?php
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/db.php';

function sendJson($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode(['data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendError(string $message, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readBody(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        sendError('Invalid JSON request.');
    }
    return $data;
}

function itemRow(array $row): array {
    return [
        'id' => (string)$row['material_id'],
        'itemCode' => $row['item_code'],
        'itemName' => $row['material_name'],
        'category' => $row['category'] ?: 'Other',
        'unit' => $row['unit'],
        'quantity' => (float)$row['quantity'],
        'reorderLevel' => (float)$row['reorder_level'],
        'unitCost' => (float)$row['unit_cost'],
        'sellingPrice' => (float)$row['selling_price'],
        'supplier' => $row['supplier'] ?? '',
        'location' => $row['storage_location'] ?? '',
        'description' => $row['description'] ?? '',
        'createdAt' => $row['date_added'],
        'updatedAt' => $row['updated_at']
    ];
}

function getItem(mysqli $conn, int $id): array {
    $stmt = $conn->prepare('SELECT * FROM inventory WHERE material_id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    if (!$row) {
        sendError('Inventory item not found.', 404);
    }
    return itemRow($row);
}

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'list' && $method === 'GET') {
    $result = $conn->query('SELECT * FROM inventory ORDER BY material_id DESC');
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = itemRow($row);
    }
    sendJson($items);
}

if ($action === 'get' && $method === 'GET') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) sendError('Invalid inventory item ID.');
    sendJson(getItem($conn, $id));
}

if ($action === 'create' && $method === 'POST') {
    $body = readBody();

    $itemCode = strtoupper(trim((string)($body['itemCode'] ?? '')));
    $itemName = trim((string)($body['itemName'] ?? ''));
    $category = trim((string)($body['category'] ?? 'Other'));
    $unit = trim((string)($body['unit'] ?? 'Piece'));
    $quantity = (float)($body['quantity'] ?? 0);
    $reorderLevel = (float)($body['reorderLevel'] ?? 0);
    $unitCost = (float)($body['unitCost'] ?? 0);
    $sellingPrice = (float)($body['sellingPrice'] ?? 0);
    $supplier = trim((string)($body['supplier'] ?? ''));
    $location = trim((string)($body['location'] ?? ''));
    $description = trim((string)($body['description'] ?? ''));

    if ($itemCode === '' || $itemName === '' || $unit === '') {
        sendError('Item code, item name, and unit are required.');
    }
    if ($quantity < 0 || $reorderLevel < 0 || $unitCost < 0 || $sellingPrice < 0) {
        sendError('Quantity and price values cannot be negative.');
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare('INSERT INTO inventory (item_code, material_name, category, quantity, unit, reorder_level, unit_cost, selling_price, supplier, storage_location, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('sssdsdddsss', $itemCode, $itemName, $category, $quantity, $unit, $reorderLevel, $unitCost, $sellingPrice, $supplier, $location, $description);
        $stmt->execute();
        $id = $stmt->insert_id;
        $stmt->close();

        if ($quantity > 0) {
            $type = 'IN';
            $remarks = 'Opening stock';
            $userId = 1;
            $movement = $conn->prepare('INSERT INTO inventory_transactions (material_id, user_id, transaction_type, quantity, remarks) VALUES (?, ?, ?, ?, ?)');
            $movement->bind_param('iisds', $id, $userId, $type, $quantity, $remarks);
            $movement->execute();
            $movement->close();
        }

        $conn->commit();
        sendJson(getItem($conn, $id), 201);
    } catch (mysqli_sql_exception $e) {
        $conn->rollback();
        if ((int)$e->getCode() === 1062) {
            sendError('That item code is already in use.', 409);
        }
        sendError('The inventory item could not be saved.', 500);
    }
}

if ($action === 'update' && ($method === 'PATCH' || $method === 'POST')) {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) sendError('Invalid inventory item ID.');
    $current = getItem($conn, $id);
    $body = readBody();

    $itemCode = strtoupper(trim((string)($body['itemCode'] ?? $current['itemCode'])));
    $itemName = trim((string)($body['itemName'] ?? $current['itemName']));
    $category = trim((string)($body['category'] ?? $current['category']));
    $unit = trim((string)($body['unit'] ?? $current['unit']));
    $reorderLevel = (float)($body['reorderLevel'] ?? $current['reorderLevel']);
    $unitCost = (float)($body['unitCost'] ?? $current['unitCost']);
    $sellingPrice = (float)($body['sellingPrice'] ?? $current['sellingPrice']);
    $supplier = trim((string)($body['supplier'] ?? $current['supplier']));
    $location = trim((string)($body['location'] ?? $current['location']));
    $description = trim((string)($body['description'] ?? $current['description']));

    if ($itemCode === '' || $itemName === '' || $unit === '') sendError('Item code, item name, and unit are required.');
    if ($reorderLevel < 0 || $unitCost < 0 || $sellingPrice < 0) sendError('Inventory values cannot be negative.');

    try {
        $stmt = $conn->prepare('UPDATE inventory SET item_code=?, material_name=?, category=?, unit=?, reorder_level=?, unit_cost=?, selling_price=?, supplier=?, storage_location=?, description=? WHERE material_id=?');
        $stmt->bind_param('ssssdddsssi', $itemCode, $itemName, $category, $unit, $reorderLevel, $unitCost, $sellingPrice, $supplier, $location, $description, $id);
        $stmt->execute();
        $stmt->close();
        sendJson(getItem($conn, $id));
    } catch (mysqli_sql_exception $e) {
        if ((int)$e->getCode() === 1062) sendError('That item code is already in use.', 409);
        sendError('The inventory item could not be updated.', 500);
    }
}

if ($action === 'movement' && $method === 'POST') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) sendError('Invalid inventory item ID.');
    $body = readBody();
    $movementType = (string)($body['movementType'] ?? '');
    $quantity = (float)($body['quantity'] ?? 0);
    $reason = trim((string)($body['reason'] ?? ''));

    if (!in_array($movementType, ['stock_in', 'stock_out'], true)) sendError('Select a valid stock movement.');
    if ($quantity <= 0) sendError('Enter a quantity greater than zero.');

    $conn->begin_transaction();
    try {
        $lock = $conn->prepare('SELECT quantity FROM inventory WHERE material_id=? FOR UPDATE');
        $lock->bind_param('i', $id);
        $lock->execute();
        $row = $lock->get_result()->fetch_assoc();
        $lock->close();
        if (!$row) throw new RuntimeException('not_found');

        $currentQuantity = (float)$row['quantity'];
        $newQuantity = $movementType === 'stock_in' ? $currentQuantity + $quantity : $currentQuantity - $quantity;
        if ($newQuantity < 0) {
            $conn->rollback();
            sendError('Stock out cannot be greater than the available quantity.');
        }

        $update = $conn->prepare('UPDATE inventory SET quantity=? WHERE material_id=?');
        $update->bind_param('di', $newQuantity, $id);
        $update->execute();
        $update->close();

        $dbType = $movementType === 'stock_in' ? 'IN' : 'OUT';
        $userId = 1;
        $movement = $conn->prepare('INSERT INTO inventory_transactions (material_id, user_id, transaction_type, quantity, remarks) VALUES (?, ?, ?, ?, ?)');
        $movement->bind_param('iisds', $id, $userId, $dbType, $quantity, $reason);
        $movement->execute();
        $movement->close();

        $conn->commit();
        sendJson(getItem($conn, $id));
    } catch (RuntimeException $e) {
        $conn->rollback();
        sendError('Inventory item not found.', 404);
    } catch (Throwable $e) {
        $conn->rollback();
        sendError('Stock could not be adjusted.', 500);
    }
}

sendError('Inventory API route not found.', 404);
