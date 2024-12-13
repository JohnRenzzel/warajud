import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./styles.module.css";
import { showToast } from "../../utils/toast";

const ArchiveManager = () => {
  const [archives, setArchives] = useState({ expenses: [], incomes: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/archive", {
        headers: { "x-auth-token": localStorage.getItem("token") },
      });
      setArchives(response.data);

      if (
        response.data.expenses.length === 0 &&
        response.data.incomes.length === 0
      ) {
        showToast.info("No archived items found");
      }
    } catch (error) {
      console.error("Error fetching archives:", error);
      showToast.error("Error fetching archived items");
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (type, itemId) => {
    try {
      setLoading(true);
      showToast.info(`Restoring ${type}...`);
      await axios.post(
        `http://localhost:8080/api/archive/restore/${type}/${itemId}`,
        {},
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      showToast.success(`${type} restored successfully`);
      // Update state directly
      setArchives((prev) => ({
        ...prev,
        [type + "s"]: prev[type + "s"].filter((item) => item._id !== itemId),
      }));
    } catch (error) {
      showToast.error(`Error restoring ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (type, itemId) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete this ${type}?`
      )
    ) {
      try {
        setLoading(true);
        showToast.info(`Deleting ${type}...`);
        await axios.delete(
          `http://localhost:8080/api/archive/${type}/${itemId}`,
          {
            headers: { "x-auth-token": localStorage.getItem("token") },
          }
        );
        showToast.success(`${type} permanently deleted`);
        // Update state directly
        setArchives((prev) => ({
          ...prev,
          [type + "s"]: prev[type + "s"].filter((item) => item._id !== itemId),
        }));
      } catch (error) {
        showToast.error(`Error deleting ${type}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.archive_manager}>
      <h3>Archived Items</h3>

      {loading && <div className={styles.loading}>Loading...</div>}

      <div className={styles.archive_sections}>
        <div className={styles.archive_section}>
          <h4>Archived Expenses</h4>
          {archives.expenses.length > 0 ? (
            archives.expenses.map((expense) => (
              <div key={expense._id} className={styles.archive_item}>
                <div className={styles.archive_info}>
                  <p>
                    <strong>{expense.description}</strong>
                  </p>
                  <p>Amount: ${expense.amount}</p>
                  <p>Category: {expense.category}</p>
                  <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
                  <p>
                    Deleted: {new Date(expense.deletedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={styles.archive_actions}>
                  <button
                    onClick={() => restoreItem("expense", expense._id)}
                    disabled={loading}
                    className={styles.restore_btn}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => deleteItem("expense", expense._id)}
                    disabled={loading}
                    className={styles.delete_btn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.no_items}>No archived expenses</p>
          )}
        </div>

        <div className={styles.archive_section}>
          <h4>Archived Incomes</h4>
          {archives.incomes.length > 0 ? (
            archives.incomes.map((income) => (
              <div key={income._id} className={styles.archive_item}>
                <div className={styles.archive_info}>
                  <p>
                    <strong>{income.source}</strong>
                  </p>
                  <p>Amount: ${income.amount}</p>
                  <p>Type: {income.type}</p>
                  <p>Date: {new Date(income.date).toLocaleDateString()}</p>
                  <p>
                    Deleted: {new Date(income.deletedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={styles.archive_actions}>
                  <button
                    onClick={() => restoreItem("income", income._id)}
                    disabled={loading}
                    className={styles.restore_btn}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => deleteItem("income", income._id)}
                    disabled={loading}
                    className={styles.delete_btn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.no_items}>No archived incomes</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveManager;
