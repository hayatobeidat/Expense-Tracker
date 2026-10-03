const API_URL = "http://localhost:3000/api/expenses";
const expensesBody = document.getElementById("expensesBody");
const categoryFilter = document.getElementById("categoryFilter");
const loading = document.getElementById("loading");
const errorAlert = document.getElementById("errorAlert");
const emptyMessage = document.getElementById("emptyMessage");
const totalAmount = document.getElementById("totalAmount");
const expenseCount = document.getElementById("expenseCount");
const highestAmount = document.getElementById("highestAmount");
const highestTitle = document.getElementById("highestTitle");
const editModalElement = document.getElementById("editModal");
const editModal = new bootstrap.Modal(editModalElement);
const editForm = document.getElementById("editForm");
const editTitle = document.getElementById("editTitle");
const editAmount = document.getElementById("editAmount");
const editCategory = document.getElementById("editCategory");
const editDate = document.getElementById("editDate");
const editError = document.getElementById("editError");
const editLoading = document.getElementById("editLoading");
const saveEditButton = document.getElementById("saveEditButton");
const addSuccess = document.getElementById("addSuccess");
/*for delete confirm slert window */
const deleteModalElement = document.getElementById("deleteModal");
const deleteModal = new bootstrap.Modal(deleteModalElement);
const deleteMessage = document.getElementById("deleteMessage");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");
let pendingDeleteExpense = null;
let addSuccessTimer;
let editingId = null;
let categoryChart = null;
let expenses = [];

/* Bootstrap colors for the five categories*/
const categoryColors = {
    Food: "bg-success",
    Transport: "bg-primary",
    Bills: "bg-warning text-dark",
    Entertainment: "bg-info text-dark",
    Other: "bg-secondary"
};

/* Show & hide the loading spinner*/
function setLoading(isLoading) {
    loading.classList.toggle("d-none", !isLoading);
}

/*Display a readable error*/
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove("d-none");
}

/* Hide the previous error*/
function clearError() {
    errorAlert.textContent = "";
    errorAlert.classList.add("d-none");
}

/* GET: request all expenses from the backend */
async function getExpenses() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // fetch does not automatically throw for HTTP 400 or 500.
        if (!response.ok) {
            throw new Error(data.message || "Could not load expenses.");
        }

        return data;
    } catch (error) {
        // Pass the error to refresh(), which displays the alert.
        throw error;
    }
}

/* Send a new expense to the backend*/
async function addExpense(data) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not add expense.");
        }

        return result;
    } catch (error) {
        throw error;
    }
}
/*for send delete update */
async function deleteExpense(id) {
    try {
        const response = await fetch(API_URL + "/" + id, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not delete expense.");
        }

        return result;
    } catch (error) {
        throw error;
    }
}

/* Send updated expense data to the backend*/
async function updateExpense(id, data) {
    try {
        const response = await fetch(API_URL + "/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not update expense.");
        }

        return result;
    } catch (error) {
        throw error;
    }
}
/*Fill the modal with the selected expense*/
function openEditModal(expense) {
    clearError();

    editingId = expense.id;
    editTitle.value = expense.title;
    editAmount.value = expense.amount;
    editCategory.value = expense.category;
    editDate.value = expense.date;

    editError.textContent = "";
    editError.classList.add("d-none");

    editModal.show();
}
/* Build table rows using the DOM*/
function renderTable(list) 
{
    expensesBody.replaceChildren();
    emptyMessage.classList.toggle("d-none", list.length !== 0);

    for (const expense of list) 
   {
        const row = document.createElement("tr");
        const titleCell = document.createElement("td");
        titleCell.textContent = expense.title;
        const amountCell = document.createElement("td");
        amountCell.className = "text-end";
        amountCell.textContent = expense.amount.toFixed(2);
        const categoryCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className =
            "badge " + (categoryColors[expense.category] || "bg-secondary");
        badge.textContent = expense.category;
        categoryCell.append(badge);
        const dateCell = document.createElement("td");
        dateCell.className = "text-nowrap";
        dateCell.textContent = expense.date;
        const actionsCell = document.createElement("td");
        actionsCell.className = "text-end text-nowrap";
        /*Active Edit buttons*/
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-sm btn-warning me-3";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            openEditModal(expense);
        });
        /*Active delete buttons */
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-sm btn-primary";
        deleteButton.textContent = "Delete";

        /*active delete button with confirm message bafor delete  */
        deleteButton.addEventListener("click", () => {
            pendingDeleteExpense = expense;
            deleteMessage.textContent =
                `Are you sure you want to delete "${expense.title}"?`;
            deleteModal.show();
        });

        actionsCell.append(editButton, deleteButton);
        
        row.append(
            titleCell,
            amountCell,
            categoryCell,
            dateCell,
            actionsCell
        );

        expensesBody.append(row);
    }
}
/*confirm delete after confirmation window shown up  */
        confirmDeleteButton.addEventListener("click", async () => {
            if (!pendingDeleteExpense || confirmDeleteButton.disabled) {
                return;
            }
            const expense = pendingDeleteExpense;
            confirmDeleteButton.disabled = true;
            confirmDeleteButton.textContent = "Deleting...";
            clearError();
            setLoading(true);
            try {
                await deleteExpense(expense.id);
                pendingDeleteExpense = null;
                deleteModal.hide();
                /* Request the latest list after the server confirms deletion*/
                await refresh();
            } catch (error) {
                deleteMessage.textContent =
                    error instanceof TypeError
                        ? "Cannot connect to the server. Make sure the backend is running on port 3000."
                        : error.message;
            } finally {
                confirmDeleteButton.disabled = false;
                confirmDeleteButton.textContent = "Delete";
                setLoading(false);
            }
        });

/* Calculate the summary from ALL expenses*/
function renderSummary(list) {
    let total = 0;
    let highest = null;
    for (const expense of list) {
        total += expense.amount;

        if (highest === null || expense.amount > highest.amount) {
            highest = expense;
        }
    }
    totalAmount.textContent = total.toFixed(2);
    expenseCount.textContent = list.length;
    highestAmount.textContent =
        highest === null ? "0.00" : highest.amount.toFixed(2);
    highestTitle.textContent =
        highest === null ? "No expenses" : highest.title;
}

/*Filter only the table. The summary stays based on all expenses*/
function applyFilter() {
    const category = categoryFilter.value;
    const filteredExpenses =
        category === "All"
            ? expenses
            : expenses.filter(expense => expense.category === category);

    renderTable(filteredExpenses);
}

/* Load the latest server data, then update the page*/
async function refresh() {
    clearError();
    setLoading(true);

    try {
        expenses = await getExpenses();
        renderSummary(expenses);
        applyFilter();

        //add chart//
        renderChart(expenses);
    } catch (error) {
        const message =
            error instanceof TypeError
                ? "Cannot connect to the server. Make sure the backend is running on port 3000."
                : error.message;

        showError(message);
    } finally {
        /* Always hide the spinner, even when a request fails*/
        setLoading(false);
    }
}

/* Update the table when the selected category changes*/
categoryFilter.addEventListener("change", applyFilter);
const addForm = document.getElementById("addForm");
const addButton = document.getElementById("addButton");
/* Show an error below a form field */
function showFieldError(fieldId, message) {
    document.getElementById(fieldId).classList.add("is-invalid");
    document.getElementById(fieldId + "Error").textContent = message;
}

/* Clear the previous form errors */
function clearFieldErrors() {
    const fields = ["title", "amount", "category", "date"];

    for (const fieldId of fields) {
        document.getElementById(fieldId).classList.remove("is-invalid");
        document.getElementById(fieldId + "Error").textContent = "";
    }
}
/*Handle the add form*/
addForm.addEventListener("submit", async event => {
    event.preventDefault();

    /*add success messege alert*/
    clearTimeout(addSuccessTimer);
    addSuccess.classList.add("d-none");
    clearError();

    const data = {
        title: document.getElementById("title").value.trim(),
        amount: Number(document.getElementById("amount").value),
        category: document.getElementById("category").value,
        date: document.getElementById("date").value
    };


    /* Frontend validation rules message  */
    clearFieldErrors();
    let hasErrors = false;
    if (data.title === "") {
        showFieldError("title", "Title is required.");
        hasErrors = true;
    } else if (Array.from(data.title).length > 100) {
        showFieldError("title", "Title must not exceed 100 characters.");
        hasErrors = true;
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
        showFieldError("amount", "Enter an amount greater than 0.");
        hasErrors = true;
    } else if (data.amount < 0.01 || data.amount > 99999999.99) {
        showFieldError("amount", "Enter an amount between 0.01 and 99999999.99.");
        hasErrors = true;
    }

    if (!Object.hasOwn(categoryColors, data.category)) {
        showFieldError("category", "Choose a category.");
        hasErrors = true;
    }

    if (!data.date) {
        showFieldError("date", "Choose a date.");
        hasErrors = true;
    }

    if (hasErrors) {
        addForm.querySelector(".is-invalid").focus();
        return;
    }
    addButton.disabled = true;
    setLoading(true);

    try {
        await addExpense(data);

        /*add expense with message alert */
        addSuccess.classList.remove("d-none");

        addSuccessTimer = setTimeout(() => {
            addSuccess.classList.add("d-none");
        }, 3000);

        /* Clear the form only after the server saves successfully*/
        addForm.reset();

        /*GET the latest data; do not add a table row manually*/
        await refresh();
    } catch (error) {
        const message =
            error instanceof TypeError
                ? "Cannot connect to the server. Make sure the backend is running on port 3000."
                : error.message;

        showError(message);
    } finally {
        addButton.disabled = false;
        setLoading(false);
    }
});

/* Track whether an edit request is running*/
let editRequestRunning = false;

/* Prevent closing the modal while saving*/
editModalElement.addEventListener("hide.bs.modal", event => {
    if (editRequestRunning) {
        event.preventDefault();
    }
});

/* Save the edited expense*/
editForm.addEventListener("submit", async event => {
    event.preventDefault();

    /* Prevent sending the same request twice*/
    if (editRequestRunning) {
        return;
    }

    editError.textContent = "";
    editError.classList.add("d-none");

    const data = {
        title: editTitle.value.trim(),
        amount: Number(editAmount.value),
        category: editCategory.value,
        date: editDate.value
    };

    /* Validate the form before sending*/
    let message = "";

    if (data.title === "") {
        message = "Please enter a title.";
    } else if (Array.from(data.title).length > 100) {
        message = "Title must not exceed 100 characters.";
    } else if (
        !Number.isFinite(data.amount) ||
        data.amount < 0.01 ||
        data.amount > 99999999.99
    ) {
        message = "Enter an amount between 0.01 and 99999999.99.";
    } else if (!Object.hasOwn(categoryColors, data.category)) {
        message = "Please choose a valid category.";
    } else if (!data.date) {
        message = "Please choose a date.";
    }

    if (message) {
        editError.textContent = message;
        editError.classList.remove("d-none");
        return;
    }

    const id = editingId;

    const closeButtons =
        editModalElement.querySelectorAll('[data-bs-dismiss="modal"]');

    editRequestRunning = true;
    saveEditButton.disabled = true;
    editLoading.classList.remove("d-none");

    closeButtons.forEach(button => {
        button.disabled = true;
    });

    try {
        /* PUT: save changes in the database*/
        await updateExpense(id, data);

        /*Allow the modal to close after saving*/
        editRequestRunning = false;
        editModal.hide();

        /*GET: reload the saved data and update the page*/
        await refresh();
    } catch (error) {
        editError.textContent =
            error instanceof TypeError
                ? "Cannot connect to the server. Make sure the backend is running on port 3000."
                : error.message;

        editError.classList.remove("d-none");
    } finally {
        editRequestRunning = false;
        saveEditButton.disabled = false;
        editLoading.classList.add("d-none");

        closeButtons.forEach(button => {
            button.disabled = false;
        });
    }
});
/* dark mood button */
const themeButton = document.getElementById("themeButton");

themeButton.addEventListener("click", () => {
    const isDark =
        document.documentElement.getAttribute("data-bs-theme") === "dark";

    const nextTheme = isDark ? "light" : "dark";

    document.documentElement.setAttribute("data-bs-theme", nextTheme);

    themeButton.textContent = isDark
        ? "🌙 Dark mode"
        : "☀️ Light mode";

    themeButton.setAttribute("aria-pressed", String(!isDark));

    renderChart(expenses);
});

/*chart */
function renderChart(list) {
    const labels = [
        "Food",
        "Transport",
        "Bills",
        "Entertainment",
        "Other"
    ];

    const totals = labels.map(category => {
        let total = 0;

        list.forEach(expense => {
            if (expense.category === category) {
                total += expense.amount;
            }
        });

        return total;
    });

    const isDark =
        document.documentElement.getAttribute("data-bs-theme") === "dark";

    const textColor = isDark ? "#dee2e6" : "#212529";

    document.getElementById("chartEmptyMessage")
        .classList.toggle("d-none", list.length > 0);

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(
        document.getElementById("categoryChart"),
        {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    label: "Total amount",
                    data: totals,
                    backgroundColor: [
                        "#198754",
                        "#0d6efd",
                        "#ffc107",
                        "#0dcaf0",
                        "#6c757d"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: textColor
                        }
                    }
                }
            }
        }
    );
}

refresh();