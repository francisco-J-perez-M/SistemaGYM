import os
import subprocess

MYSQL_PATH = r"C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysql.exe"

def restore_sql_backup(sql_file_path):
    if not os.path.exists(sql_file_path):
        raise Exception("Archivo SQL no existe")

    db_user = os.getenv("DB_USER")
    db_pass = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME")

    env = os.environ.copy()
    if db_pass:
        env["MYSQL_PWD"] = db_pass

    with open(sql_file_path, "r", encoding="utf-8") as f:
        subprocess.run(
            [MYSQL_PATH, "-u", db_user, db_name],
            stdin=f,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            check=True
        )
