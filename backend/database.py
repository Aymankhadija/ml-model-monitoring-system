import sqlite3
from pathlib import Path


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_FILE = BASE_DIR / "monitoring.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    """
    Create and return a SQLite database connection.
    """

    connection = sqlite3.connect(
        DATABASE_FILE,
        check_same_thread=False
    )

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# CREATE TABLES
# ============================================================

def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()

    # --------------------------------------------------------
    # PREDICTIONS TABLE
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            timestamp TEXT NOT NULL,

            prediction INTEGER NOT NULL,

            churn_probability REAL NOT NULL,

            no_churn_probability REAL NOT NULL,

            latency_ms REAL NOT NULL,

            latency_anomaly INTEGER DEFAULT 0,

            anomaly_type TEXT

        )
    """)


    # --------------------------------------------------------
    # FEEDBACK TABLE
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            timestamp TEXT NOT NULL,

            prediction INTEGER NOT NULL,

            actual_outcome INTEGER NOT NULL,

            correct INTEGER NOT NULL

        )
    """)


    # --------------------------------------------------------
    # ANOMALIES TABLE
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS anomalies (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            timestamp TEXT NOT NULL,

            prediction INTEGER NOT NULL,

            churn_probability REAL NOT NULL,

            latency_ms REAL NOT NULL,

            anomaly_type TEXT NOT NULL

        )
    """)


    connection.commit()

    connection.close()


# ============================================================
# INITIALIZE DATABASE
# ============================================================

initialize_database()