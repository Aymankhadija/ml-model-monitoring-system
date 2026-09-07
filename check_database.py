import sqlite3

# ============================================================
# DATABASE PATH
# ============================================================

DATABASE_FILE = "backend/monitoring.db"


# ============================================================
# CONNECT TO DATABASE
# ============================================================

connection = sqlite3.connect(DATABASE_FILE)

cursor = connection.cursor()


# ============================================================
# CHECK TABLES
# ============================================================

cursor.execute("""
    SELECT name
    FROM sqlite_master
    WHERE type='table'
    ORDER BY name
""")

tables = cursor.fetchall()


print("\n======================================")
print("       SQLITE DATABASE CHECK")
print("======================================")

if not tables:

    print("❌ No tables found.")

else:

    print("✅ Database connected successfully!")
    print("\nTables found:")

    for table in tables:

        print(f"   ✓ {table[0]}")


# ============================================================
# CHECK TABLE STRUCTURE
# ============================================================

expected_tables = [
    "predictions",
    "feedback",
    "anomalies"
]


print("\n======================================")
print("       TABLE VERIFICATION")
print("======================================")


for table_name in expected_tables:

    cursor.execute("""
        SELECT name
        FROM sqlite_master
        WHERE type='table'
        AND name=?
    """, (table_name,))

    result = cursor.fetchone()

    if result:

        print(f"✅ {table_name} table exists")

    else:

        print(f"❌ {table_name} table is missing")


# ============================================================
# CHECK RECORD COUNTS
# ============================================================

print("\n======================================")
print("       RECORD COUNTS")
print("======================================")


for table_name in expected_tables:

    cursor.execute(
        f"SELECT COUNT(*) FROM {table_name}"
    )

    count = cursor.fetchone()[0]

    print(f"{table_name}: {count} records")


# ============================================================
# CLOSE DATABASE
# ============================================================

connection.close()


print("\n======================================")
print("Database verification completed.")
print("======================================")