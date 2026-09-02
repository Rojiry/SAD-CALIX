<?php
// Simple XAMPP database connection for CALIX.
// Default XAMPP MySQL credentials are usually root with no password.
$host = '127.0.0.1';
$user = 'root';
$password = '';
$database = 'calix_db';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed. Check XAMPP MySQL and api/db.php.']);
    exit;
}

$conn->set_charset('utf8mb4');
