const router = require("express").Router();
const Expense = require("../models/expense");
const auth = require("../middleware/auth");
const Archive = require("../models/archive");

// Get all expenses for a user
router.get("/", auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({
      date: -1,
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).send({ message: "Error fetching expenses" });
  }
});

// Create new expense
router.post("/", auth, async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      userId: req.user._id,
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).send({ message: "Error creating expense" });
  }
});

// Update expense
router.put("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!expense) return res.status(404).send({ message: "Expense not found" });
    res.json(expense);
  } catch (error) {
    res.status(500).send({ message: "Error updating expense" });
  }
});

// Delete expense
router.delete("/:id", auth, async (req, res) => {
  try {
    // Find the expense to be deleted
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!expense) {
      return res.status(404).send({ message: "Expense not found" });
    }

    // Archive the expense
    let archive = await Archive.findOne({ userId: req.user._id });
    if (!archive) {
      archive = new Archive({
        userId: req.user._id,
        expenses: [],
        incomes: [],
      });
    }

    archive.expenses.push({
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
      deletedAt: new Date(),
    });

    await archive.save();

    // Delete the expense
    await expense.deleteOne();

    res.json({ message: "Expense archived successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error archiving expense" });
  }
});

module.exports = router;
