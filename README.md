# Expense Tracker

A simple app to manage daily expenses. Users can add, view, edit, and delete expenses, and the data is saved in PostgreSQL.

## How to run

You need  PostgreSQL, VS Code and Node.js.

### Backend

1. Open the project folder in VS Code.

2. In pgAdmin, create a database named `expense_tracker`.

3. Open the Query Tool for this database. Open `backend/schema.sql` and execute it to create the expenses table.

4. Copy `backend/.env.example` to a new file named `.env` inside the backend folder.

5. Set your PostgreSQL connection details in `.env`:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_postgresql_password
   DB_NAME=expense_tracker
   ```

   Replace the username and password with your own PostgreSQL details.

6. Open a terminal in the project folder and run:

   ```powershell
   cd backend
   npm.cmd install
   node server.js
   ```

7. Keep this terminal running. The API is available at:

   ```text
   http://localhost:3000/api/expenses
   /*front -*
   http://127.0.0.1:5500/frontend/index.html
   ```

### Frontend

1. Install the Live Server extension by Ritwick Dey in VS Code.

2. Right-click `frontend/index.html` and select **Open with Live Server**.

3. Use the page to manage expenses. Keep the backend running on port 3000.

The backend uses CORS so the frontend can read API responses from a different origin.

## Features

- [x] Add an expense with validation
- [x] View expenses in a table
- [x] Delete an expense with a confirmation message
- [x] Edit an expense
- [x] Filter by category
- [x] Summary cards: total amount, expense count, and highest expense
- [x] Save data in PostgreSQL
- [x] Loading indicator and error messages
- [x] Responsive layout with CSS Grid for summary cards
- [x] Dark mode
- [x] Chart showing spending by category

## Screenshots

### Desktop

![Desktop view](<Backend test & Final page screens/WebPage.png>)
![Desktop view 2](<Backend test & Final page screens/webpage2.png>)
### Mobile

![Mobile view 1](<Backend test & Final page screens/Web Mobile 1.png>)
![Mobile view 2](<Backend test & Final page screens/web mobile 2.png>)

### Delete confirmation

![Delete confirmation](<Backend test & Final page screens/Delete confirm .png>)

## What was the hardest part?
The hardest part for me was learning and using Node.js for the first time. Adding the chart and creating a custom delete confirmation window were also challenging. I practiced and tested each part step by step to understand how it works.

GitHub Link :
https://github.com/hayatobeidat/Expense-Tracker