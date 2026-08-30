const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Calix Backend is running!");
});

app.get("/test-db", (req, res) => {
    db.query("SELECT 1 AS test", (err, results) => {
        if (err) {
            console.error("Database error:", err);

            return res.status(500).json({
                success: false,
                message: "Database connection failed",
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "Calix database connected successfully!",
            result: results
        });
    });
});

app.listen(PORT, () => {
    console.log(`Calix server running on http://localhost:${PORT}`);
});

app.get("/users", (req, res) => {
    const sql = "SELECT user_id, username, role FROM users";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve users",
                error: err.message
            });
        }

        res.json({
            success: true,
            users: results
        });
    });
});