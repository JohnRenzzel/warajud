import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./styles.module.css";
import { showToast } from "../../utils/toast";

const IncomeManager = ({ onIncomeUpdate }) => {
  const [incomes, setIncomes] = useState([]);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("salary");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchIncomes();
  }, []);

  useEffect(() => {
    const total = incomes.reduce(
      (sum, income) => sum + Number(income.amount),
      0
    );
    onIncomeUpdate(total);
  }, [incomes, onIncomeUpdate]);

  const getAuthHeaders = () => ({
    headers: { "x-auth-token": localStorage.getItem("token") },
  });

  const fetchIncomes = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/income",
        getAuthHeaders()
      );
      setIncomes(response.data);

      const total = response.data.reduce(
        (sum, income) => sum + Number(income.amount),
        0
      );
      onIncomeUpdate(total);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      showToast.error("Failed to fetch income data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const incomeData = {
        source,
        amount,
        date,
        description,
        type,
      };

      if (editingId) {
        await axios.put(
          `http://localhost:8080/api/income/${editingId}`,
          incomeData,
          getAuthHeaders()
        );
      } else {
        await axios.post(
          "http://localhost:8080/api/income",
          incomeData,
          getAuthHeaders()
        );
      }

      // Reset form
      setSource("");
      setAmount("");
      setDate("");
      setDescription("");
      setType("salary");
      await fetchIncomes();
    } catch (error) {
      console.error("Error saving income:", error);
      showToast.error(error.response?.data?.message || "Error saving income");
    }
  };

  const deleteIncome = async (id) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/income/${id}`,
        getAuthHeaders()
      );
      showToast.success("Income deleted successfully!");
      fetchIncomes();
    } catch (error) {
      console.error("Error deleting income:", error);
      showToast.error("Error deleting income");
    }
  };

  const handleEdit = (income) => {
    setEditingId(income._id);
    setSource(income.source);
    setAmount(income.amount);
    setDate(income.date.split("T")[0]);
    setDescription(income.description);
    setType(income.type);
    showToast.info("Editing income entry...");
  };

  return (
    <div className={styles.income_manager}>
      <form onSubmit={handleSubmit} className={styles.income_form}>
        <input
          type="text"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="salary">Salary</option>
          <option value="freelance">Freelance</option>
          <option value="investment">Investment</option>
          <option value="other">Other</option>
        </select>
        <button type="submit">{editingId ? "Update" : "Add"} Income</button>
      </form>

      <div className={styles.income_list}>
        {incomes.map((income) => (
          <div key={income._id} className={styles.income_item}>
            <div className={styles.income_info}>
              <h3>{income.source}</h3>
              <p>Amount: ₱{income.amount}</p>
              <p>Date: {new Date(income.date).toLocaleDateString()}</p>
              <p>Description: {income.description}</p>
              <p>Type: {income.type}</p>
            </div>
            <div className={styles.income_actions}>
              <button onClick={() => handleEdit(income)}>Edit</button>
              <button onClick={() => deleteIncome(income._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeManager;
