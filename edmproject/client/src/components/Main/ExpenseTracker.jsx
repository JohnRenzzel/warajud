import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./styles.module.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import IncomeManager from "./IncomeManager";
import BackupManager from "./BackupManager";
import ArchiveManager from "./ArchiveManager";
import { showToast } from "../../utils/toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    date: "",
    category: "other",
  });
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState(() => {
    return localStorage.getItem("activeFinanceView") || "expenses";
  });
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [incomeReport, setIncomeReport] = useState(null);

  const categories = [
    "groceries",
    "utilities",
    "rent",
    "transportation",
    "entertainment",
    "healthcare",
    "education",
    "shopping",
    "food",
    "other",
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (view === "report") {
      generateMonthlyReport();
      generateIncomeReport();
    }
  }, [view, expenses, totalIncome]);

  useEffect(() => {
    localStorage.setItem("activeFinanceView", view);
  }, [view]);

  const getAuthHeaders = () => ({
    headers: { "x-auth-token": localStorage.getItem("token") },
  });

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/expenses",
        getAuthHeaders()
      );
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      showToast.error("Failed to fetch expenses");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentTotalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      );

      const potentialTotalExpenses =
        currentTotalExpenses + Number(newExpense.amount);

      if (potentialTotalExpenses > totalIncome) {
        showToast.error(
          `Cannot add expense. It would exceed your budget.\nAvailable budget: $${(
            totalIncome - currentTotalExpenses
          ).toFixed(2)}`
        );
        return;
      }

      if (totalIncome <= 0) {
        showToast.error("Please add income before creating expenses");
        return;
      }

      if (editingId) {
        const existingExpense = expenses.find((exp) => exp._id === editingId);
        const expenseDifference =
          Number(newExpense.amount) - Number(existingExpense.amount);
        const newTotalExpenses = currentTotalExpenses + expenseDifference;

        if (newTotalExpenses > totalIncome) {
          showToast.error(
            `Cannot update expense. It would exceed your budget.\nAvailable budget: $${(
              totalIncome - currentTotalExpenses
            ).toFixed(2)}`
          );
          return;
        }

        await axios.put(
          `http://localhost:8080/api/expenses/${editingId}`,
          newExpense,
          getAuthHeaders()
        );
        showToast.success("Expense updated successfully!");
        setEditingId(null);
      } else {
        await axios.post(
          "http://localhost:8080/api/expenses",
          newExpense,
          getAuthHeaders()
        );
        showToast.success("Expense added successfully!");
      }

      setNewExpense({
        description: "",
        amount: "",
        date: "",
        category: "other",
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      showToast.error(error.response?.data?.message || "Error saving expense");
    }
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm("Are you sure you want to delete this expense?")) {
        await axios.delete(
          `http://localhost:8080/api/expenses/${id}`,
          getAuthHeaders()
        );
        showToast.success("Expense deleted successfully!");
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      showToast.error("Failed to delete expense");
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setNewExpense({
      description: expense.description,
      amount: expense.amount,
      date: expense.date.split("T")[0],
      category: expense.category,
    });
    showToast.info("Editing expense...");
  };

  const generateMonthlyReport = async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    const categoryTotals = categories.reduce((acc, category) => {
      acc[category] = monthlyExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);
      return acc;
    }, {});

    const chartData = {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label: "Monthly Expenses by Category",
          data: Object.values(categoryTotals),
          backgroundColor: "rgba(138, 43, 226, 0.5)",
          borderColor: "rgba(138, 43, 226, 1)",
          borderWidth: 1,
        },
      ],
    };

    const total = Object.values(categoryTotals).reduce(
      (sum, value) => sum + value,
      0
    );

    setMonthlyReport({
      chartData,
      total,
      categoryTotals,
    });

    if (!monthlyExpenses.length) {
      showToast.info("No expenses found for current month");
    }
  };

  const handleIncomeUpdate = (newTotal) => {
    setTotalIncome(newTotal);
    if (view === "report") {
      generateMonthlyReport();
      generateIncomeReport();
    }
  };

  const generateIncomeReport = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/income", {
        headers: { "x-auth-token": localStorage.getItem("token") },
      });

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyIncomes = response.data.filter((income) => {
        const incomeDate = new Date(income.date);
        return (
          incomeDate.getMonth() === currentMonth &&
          incomeDate.getFullYear() === currentYear
        );
      });

      const incomeByType = {
        salary: 0,
        freelance: 0,
        investment: 0,
        other: 0,
      };

      monthlyIncomes.forEach((income) => {
        incomeByType[income.type] += Number(income.amount);
      });

      const incomeChartData = {
        labels: Object.keys(incomeByType).map(
          (type) => type.charAt(0).toUpperCase() + type.slice(1)
        ),
        datasets: [
          {
            label: "Monthly Income by Type",
            data: Object.values(incomeByType),
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      };

      const totalMonthlyIncome = Object.values(incomeByType).reduce(
        (sum, value) => sum + value,
        0
      );

      setIncomeReport({
        chartData: incomeChartData,
        total: totalMonthlyIncome,
        byType: incomeByType,
      });

      if (!monthlyIncomes.length) {
        showToast.info("No income records found for current month");
      }
    } catch (error) {
      console.error("Error generating income report:", error);
      showToast.error("Failed to generate income report");
    }
  };

  const getRemainingBudget = () => {
    const currentTotalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );
    return totalIncome - currentTotalExpenses;
  };

  return (
    <section className={styles.expense_tracker}>
      <h2>Financial Management</h2>

      <div className={styles.view_toggle}>
        <button
          className={view === "expenses" ? styles.active : ""}
          onClick={() => setView("expenses")}
        >
          Expenses
        </button>
        <button
          className={view === "income" ? styles.active : ""}
          onClick={() => setView("income")}
        >
          Income
        </button>
        <button
          className={view === "report" ? styles.active : ""}
          onClick={() => setView("report")}
        >
          Reports
        </button>
        <button
          className={view === "backup" ? styles.active : ""}
          onClick={() => setView("backup")}
        >
          Backups
        </button>
        <button
          className={view === "archive" ? styles.active : ""}
          onClick={() => setView("archive")}
        >
          Archives
        </button>
      </div>

      <div className={styles.budget_summary}>
        <div>Total Income: ${totalIncome.toFixed(2)}</div>
        <div>Total Expenses: ${monthlyReport?.total.toFixed(2) || "0.00"}</div>
        <div>
          Remaining Budget: $
          {(totalIncome - (monthlyReport?.total || 0)).toFixed(2)}
        </div>
      </div>

      {view === "expenses" && (
        <>
          <div className={styles.budget_info}>
            <p>Available Budget: ${getRemainingBudget().toFixed(2)}</p>
          </div>
          <form onSubmit={handleSubmit} className={styles.expense_form}>
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) =>
                setNewExpense({ ...newExpense, description: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense({ ...newExpense, amount: e.target.value })
              }
              required
            />
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) =>
                setNewExpense({ ...newExpense, date: e.target.value })
              }
              required
            />
            <select
              value={newExpense.category}
              onChange={(e) =>
                setNewExpense({ ...newExpense, category: e.target.value })
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={totalIncome <= 0}
              title={totalIncome <= 0 ? "Please add income first" : ""}
            >
              {editingId ? "Update" : "Add"} Expense
            </button>
          </form>
          {totalIncome <= 0 && (
            <div className={styles.warning_message}>
              Please add income before creating expenses
            </div>
          )}

          <div className={styles.expense_list}>
            {expenses.map((expense) => (
              <div key={expense._id} className={styles.expense_item}>
                <div className={styles.expense_info}>
                  <h3>{expense.description}</h3>
                  <p>Amount: ₱{expense.amount}</p>
                  <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
                  <p>Category: {expense.category}</p>
                </div>
                <div className={styles.expense_actions}>
                  <button onClick={() => handleEdit(expense)}>Edit</button>
                  <button onClick={() => handleDelete(expense._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === "income" && (
        <IncomeManager onIncomeUpdate={handleIncomeUpdate} />
      )}

      {view === "report" && (
        <div className={styles.reports_container}>
          <div className={styles.monthly_report}>
            <h3>
              Monthly Expenses Report -{" "}
              {new Date().toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            {monthlyReport && (
              <>
                <div className={styles.chart_container}>
                  <Bar data={monthlyReport.chartData} />
                </div>
                <div className={styles.report_summary}>
                  <h4>Expense Summary</h4>
                  <p>
                    Total Monthly Expenses: ${monthlyReport.total.toFixed(2)}
                  </p>
                  <div className={styles.category_breakdown}>
                    {Object.entries(monthlyReport.categoryTotals)
                      .filter(([_, amount]) => amount > 0)
                      .map(([category, amount]) => (
                        <div key={category} className={styles.category_item}>
                          <span>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                            :
                          </span>
                          <span>${amount.toFixed(2)}</span>
                          <span>
                            ({((amount / monthlyReport.total) * 100).toFixed(1)}
                            %)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={styles.monthly_report}>
            <h3>
              Monthly Income Report -{" "}
              {new Date().toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            {incomeReport && (
              <>
                <div className={styles.chart_container}>
                  <Bar data={incomeReport.chartData} />
                </div>
                <div className={styles.report_summary}>
                  <h4>Income Summary</h4>
                  <p>Total Monthly Income: ${incomeReport.total.toFixed(2)}</p>
                  <div className={styles.category_breakdown}>
                    {Object.entries(incomeReport.byType)
                      .filter(([_, amount]) => amount > 0)
                      .map(([type, amount]) => (
                        <div key={type} className={styles.category_item}>
                          <span>
                            {type.charAt(0).toUpperCase() + type.slice(1)}:
                          </span>
                          <span>${amount.toFixed(2)}</span>
                          <span>
                            ({((amount / incomeReport.total) * 100).toFixed(1)}
                            %)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={styles.monthly_report}>
            <h3>Monthly Overview</h3>
            <div className={styles.overview_summary}>
              <div className={styles.overview_item}>
                <h4>Total Income</h4>
                <p>${(incomeReport?.total || 0).toFixed(2)}</p>
              </div>
              <div className={styles.overview_item}>
                <h4>Total Expenses</h4>
                <p>${(monthlyReport?.total || 0).toFixed(2)}</p>
              </div>
              <div className={styles.overview_item}>
                <h4>Net Balance</h4>
                <p
                  className={
                    (incomeReport?.total || 0) - (monthlyReport?.total || 0) >=
                    0
                      ? styles.positive
                      : styles.negative
                  }
                >
                  $
                  {(
                    (incomeReport?.total || 0) - (monthlyReport?.total || 0)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "backup" && <BackupManager />}

      {view === "archive" && <ArchiveManager />}
    </section>
  );
};

export default ExpenseTracker;
