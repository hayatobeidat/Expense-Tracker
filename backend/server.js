/*for setup express & postgres*/
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
app.use(cors());
app.use(express.json());
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
const categories = [  "Food",  "Transport",  "Bills",  "Entertainment",  "Other"];
/*validation*/
function isValidId(value) {
    if (!/^[1-9]\d*$/.test(value)) {
        return false;
    }

    return Number(value) <= 2147483647;
}
function isValidDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000-")
    ) {
        return false;
    }

    const date = new Date(value + "T00:00:00.000Z");

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return date.toISOString().slice(0, 10) === value;
}
function validateExpense(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "Send an expense as a JSON object.";
    }

    const { title, amount, category, date } = body;

    if (typeof title !== "string" || title.trim() === "") {
        return "Title is required.";
    }

    if (Array.from(title.trim()).length > 100) {
        return "Title must not exceed 100 characters.";
    }

    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return "Amount must be a number greater than zero.";
    }

    if (amount < 0.005 || amount >= 99999999.995) {
        return "Amount is outside the supported database range.";
    }

    if (!categories.includes(category)) {
        return "Category must be Food, Transport, Bills, Entertainment, or Other.";
    }

    if (!isValidDate(date)) {
        return "Date must be a valid date in YYYY-MM-DD format.";
    }
    
return null;
}
/*adding Get for all */
app.get("/api/expenses", async (request, response, next) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                title,
                amount::float8 AS amount,
                category,
                TO_CHAR(date, 'YYYY-MM-DD') AS date
            FROM expenses
            ORDER BY id
        `);

        response.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});
/*Get for one */
app.get("/api/expenses/:id", async (request, response, next) => {
    const id = request.params.id;

    if (!isValidId(id)) {
        return response.status(404).json({
            message: "Expense not found."
        });
    }

    try {
        const result = await pool.query(`
            SELECT
                id,
                title,
                amount::float8 AS amount,
                category,
                TO_CHAR(date, 'YYYY-MM-DD') AS date
            FROM expenses
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Expense not found."
            });
        }

        response.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});
/*for post */
app.post("/api/expenses", async (request, response, next) => {
    const message = validateExpense(request.body);

    if (message) {
        return response.status(400).json({ message });
    }

    const { title, amount, category, date } = request.body;

    try {
        const result = await pool.query(`
            INSERT INTO expenses (title, amount, category, date)
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                title,
                amount::float8 AS amount,
                category,
                TO_CHAR(date, 'YYYY-MM-DD') AS date
        `, [title.trim(), amount, category, date]);

        response.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});
/*Update */
app.put("/api/expenses/:id", async (request, response, next) => {
    const id = request.params.id;

    if (!isValidId(id)) {
        return response.status(404).json({
            message: "Expense not found."
        });
    }
     const message = validateExpense(request.body);
  if (message) {
        return response.status(400).json({ message });
    }
  const { title, amount, category, date } = request.body;
   try {
        const result = await pool.query(`
            UPDATE expenses
            SET title = $1,
                amount = $2,
                category = $3,
                date = $4
            WHERE id = $5
            RETURNING
                id,
                title,
                amount::float8 AS amount,
                category,
                TO_CHAR(date, 'YYYY-MM-DD') AS date
        `, [title.trim(), amount, category, date, id]);

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Expense not found."
            });
        }

        response.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});
/*Delete*/
app.delete("/api/expenses/:id", async (request, response, next) => {
    const id = request.params.id;

    if (!isValidId(id)) {
        return response.status(404).json({
            message: "Expense not found."
        });
    }

    try {
        const result = await pool.query(`
            DELETE FROM expenses
            WHERE id = $1
            RETURNING id
        `, [id]);

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Expense not found."
            });
        }

        response.status(200).json({
            message: "Expense deleted."
        });
    } catch (error) {
        next(error);
    }
});
/*Handle Errors*/
app.use((error, request, response, next) => {
    if (error.type === "entity.parse.failed") {
        return response.status(400).json({
            message: "Request body must contain valid JSON."
        });
    }

    if (
        error.code === "22001" ||
        error.code === "22003" ||
        error.code === "23514"
    ) {
        return response.status(400).json({
            message: "Expense values do not meet the database rules."
        });
    }

    console.error(error.message);

    response.status(500).json({
        message: "Server error. Please try again."
    });
});

app.listen(3000);