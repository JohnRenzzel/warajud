const router = require("express").Router();
const Archive = require("../models/archive");
const Expense = require("../models/expense");
const Income = require("../models/income");
const auth = require("../middleware/auth");

// Get all archived items
router.get("/", auth, async (req, res) => {
  try {
    const archive = await Archive.findOne({ userId: req.user._id });
    if (!archive) {
      return res.json({ expenses: [], incomes: [] });
    }
    res.json({
      expenses: archive.expenses || [],
      incomes: archive.incomes || [],
    });
  } catch (error) {
    console.error("Error fetching archives:", error);
    res.status(500).send({ message: "Error fetching archived items" });
  }
});

// Restore expense from archive
router.post("/restore/expense/:id", auth, async (req, res) => {
  try {
    const archive = await Archive.findOne({ userId: req.user._id });
    if (!archive) {
      return res.status(404).send({ message: "Archive not found" });
    }

    const expenseToRestore = archive.expenses.id(req.params.id);
    if (!expenseToRestore) {
      return res.status(404).send({ message: "Archived expense not found" });
    }

    // Create new expense
    const newExpense = new Expense({
      userId: req.user._id,
      description: expenseToRestore.description,
      amount: expenseToRestore.amount,
      date: expenseToRestore.date,
      category: expenseToRestore.category,
    });

    await newExpense.save();

    // Remove from archive
    archive.expenses.pull(expenseToRestore._id);
    await archive.save();

    res.json({ message: "Expense restored successfully" });
  } catch (error) {
    console.error("Error restoring expense:", error);
    res.status(500).send({ message: "Error restoring expense" });
  }
});

// Restore income from archive
router.post("/restore/income/:id", auth, async (req, res) => {
  try {
    const archive = await Archive.findOne({ userId: req.user._id });
    if (!archive) {
      return res.status(404).send({ message: "Archive not found" });
    }

    const incomeToRestore = archive.incomes.id(req.params.id);
    if (!incomeToRestore) {
      return res.status(404).send({ message: "Archived income not found" });
    }

    // Create new income
    const newIncome = new Income({
      userId: req.user._id,
      source: incomeToRestore.source,
      amount: incomeToRestore.amount,
      date: incomeToRestore.date,
      description: incomeToRestore.description,
      type: incomeToRestore.type,
    });

    await newIncome.save();

    // Remove from archive
    archive.incomes.pull(incomeToRestore._id);
    await archive.save();

    res.json({ message: "Income restored successfully" });
  } catch (error) {
    console.error("Error restoring income:", error);
    res.status(500).send({ message: "Error restoring income" });
  }
});

// Permanently delete expense from archive
router.delete("/expense/:id", auth, async (req, res) => {
  try {
    const archive = await Archive.findOne({ userId: req.user._id });
    if (!archive) {
      return res.status(404).send({ message: "Archive not found" });
    }

    const expenseToDelete = archive.expenses.id(req.params.id);
    if (!expenseToDelete) {
      return res.status(404).send({ message: "Archived expense not found" });
    }

    archive.expenses.pull(expenseToDelete._id);
    await archive.save();

    res.json({ message: "Expense permanently deleted" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).send({ message: "Error deleting expense" });
  }
});

// Permanently delete income from archive
router.delete("/income/:id", auth, async (req, res) => {
  try {
    const archive = await Archive.findOne({ userId: req.user._id });
    if (!archive) {
      return res.status(404).send({ message: "Archive not found" });
    }

    const incomeToDelete = archive.incomes.id(req.params.id);
    if (!incomeToDelete) {
      return res.status(404).send({ message: "Archived income not found" });
    }

    archive.incomes.pull(incomeToDelete._id);
    await archive.save();

    res.json({ message: "Income permanently deleted" });
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).send({ message: "Error deleting income" });
  }
});

module.exports = router;
