const router = require("express").Router();
const Backup = require("../models/backup");
const Expense = require("../models/expense");
const Income = require("../models/income");
const auth = require("../middleware/auth");

// Create backup
router.post("/", auth, async (req, res) => {
  try {
    // Fetch only active (non-archived) data
    const expenses = await Expense.find({ userId: req.user._id });
    const incomes = await Income.find({ userId: req.user._id });

    // If no data to backup, return error
    if (expenses.length === 0 && incomes.length === 0) {
      return res.status(400).json({
        message: "No active data available to backup",
      });
    }

    // Prepare current expenses data
    const currentExpenses = expenses.map((exp) => ({
      description: exp.description || "",
      amount: Number(exp.amount) || 0,
      date: new Date(exp.date),
      category: exp.category || "other",
    }));

    // Prepare current incomes data
    const currentIncomes = incomes.map((inc) => ({
      source: inc.source || "",
      amount: Number(inc.amount) || 0,
      date: new Date(inc.date),
      description: inc.description || "",
      type: inc.type || "other",
    }));

    // Create backup name with timestamp and counts
    const backupName = `Backup ${new Date().toLocaleString()} (${
      currentExpenses.length
    } expenses, ${currentIncomes.length} incomes)`;

    // Create backup with only current active data
    const backup = new Backup({
      userId: req.user._id,
      name: backupName,
      expenses: currentExpenses,
      incomes: currentIncomes,
    });

    await backup.save();

    res.status(201).json({
      message: "Current data backed up successfully",
      backup: {
        id: backup._id,
        name: backup.name,
        date: backup.date,
        expensesCount: currentExpenses.length,
        incomesCount: currentIncomes.length,
      },
    });
  } catch (error) {
    console.error("Backup creation error:", error);
    res.status(500).send({
      message: "Error creating backup",
      error: error.message,
    });
  }
});

// Get all backups
router.get("/", auth, async (req, res) => {
  try {
    const backups = await Backup.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("name date expenses incomes createdAt");

    res.json(
      backups.map((backup) => ({
        id: backup._id,
        name: backup.name,
        date: backup.createdAt,
        expensesCount: backup.expenses.length,
        incomesCount: backup.incomes.length,
      }))
    );
  } catch (error) {
    console.error("Error fetching backups:", error);
    res.status(500).send({ message: "Error fetching backups" });
  }
});

// Restore from backup
router.post("/restore/:id", auth, async (req, res) => {
  try {
    const backup = await Backup.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!backup) {
      return res.status(404).send({ message: "Backup not found" });
    }

    // Delete only current data, don't touch archives
    await Expense.deleteMany({ userId: req.user._id });
    await Income.deleteMany({ userId: req.user._id });

    // Restore expenses
    const expensePromises = backup.expenses.map((expense) => {
      const newExpense = new Expense({
        userId: req.user._id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
      });
      return newExpense.save();
    });

    // Restore incomes
    const incomePromises = backup.incomes.map((income) => {
      const newIncome = new Income({
        userId: req.user._id,
        source: income.source,
        amount: income.amount,
        date: income.date,
        description: income.description,
        type: income.type,
      });
      return newIncome.save();
    });

    // Wait for all documents to be saved
    await Promise.all([...expensePromises, ...incomePromises]);

    res.json({
      message: "Backup restored successfully",
      expensesRestored: backup.expenses.length,
      incomesRestored: backup.incomes.length,
    });
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).send({
      message: "Error restoring backup",
      error: error.message,
    });
  }
});

// Delete backup
router.delete("/:id", auth, async (req, res) => {
  try {
    const backup = await Backup.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!backup) {
      return res.status(404).send({ message: "Backup not found" });
    }

    res.json({
      message: "Backup deleted successfully",
      deletedBackupName: backup.name,
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    res.status(500).send({ message: "Error deleting backup" });
  }
});

module.exports = router;
