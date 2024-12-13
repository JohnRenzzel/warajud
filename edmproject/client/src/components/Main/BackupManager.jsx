import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./styles.module.css";
import { showToast } from "../../utils/toast";

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const getAuthHeaders = () => ({
    headers: { "x-auth-token": localStorage.getItem("token") },
  });

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:8080/api/backup",
        getAuthHeaders()
      );
      setBackups(response.data || []);
    } catch (error) {
      console.error("Error fetching backups:", error);
      showToast.error("Failed to fetch backups");
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:8080/api/backup",
        {},
        getAuthHeaders()
      );
      showToast.success("Backup created successfully!");
      fetchBackups();
    } catch (error) {
      console.error("Error creating backup:", error);
      showToast.error(error.response?.data?.message || "Error creating backup");
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupId) => {
    if (
      window.confirm(
        "Are you sure you want to restore this backup? Current data will be replaced."
      )
    ) {
      try {
        setLoading(true);
        showToast.info("Restoring backup...");

        await axios.post(
          `http://localhost:8080/api/backup/restore/${backupId}`,
          {},
          getAuthHeaders()
        );

        showToast.success("Backup restored successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error restoring backup:", error);
        showToast.error(
          error.response?.data?.message || "Error restoring backup"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteBackup = async (backupId) => {
    if (window.confirm("Are you sure you want to delete this backup?")) {
      try {
        setLoading(true);
        await axios.delete(
          `http://localhost:8080/api/backup/${backupId}`,
          getAuthHeaders()
        );

        showToast.success("Backup deleted successfully");
        fetchBackups();
      } catch (error) {
        console.error("Error deleting backup:", error);
        showToast.error("Error deleting backup");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.backup_manager}>
      <div className={styles.backup_header}>
        <h3>Data Backup Manager</h3>
        <button
          onClick={createBackup}
          disabled={loading}
          className={styles.create_backup_btn}
        >
          {loading ? "Creating..." : "Create New Backup"}
        </button>
      </div>

      {loading && <div className={styles.loading}>Loading...</div>}

      <div className={styles.backup_list}>
        {Array.isArray(backups) &&
          backups.map((backup) => (
            <div key={backup.id} className={styles.backup_item}>
              <div className={styles.backup_info}>
                <h4>{backup.name}</h4>
                <p>Created: {new Date(backup.date).toLocaleString()}</p>
                <p>
                  Items: {backup.expensesCount} expenses, {backup.incomesCount}{" "}
                  incomes
                </p>
              </div>
              <div className={styles.backup_actions}>
                <button
                  onClick={() => restoreBackup(backup.id)}
                  disabled={loading}
                  className={styles.restore_btn}
                >
                  Restore
                </button>
                <button
                  onClick={() => deleteBackup(backup.id)}
                  disabled={loading}
                  className={styles.delete_btn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        {Array.isArray(backups) && backups.length === 0 && !loading && (
          <div className={styles.no_backups}>
            No backups found. Create your first backup!
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupManager;
