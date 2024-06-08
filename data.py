import mysql.connector
import logging
from config import Config  # 假設你的密碼儲存在Config模組中

def get_db_connection():
    try:
        dbconfig = {
            "user": "root",
            "password": Config.MYSQL_PASSWORD,
            "host": "localhost",
            "database": "sites"
        }
        cnxpool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name="mypool",
            pool_size=5,
            **dbconfig
        )
        cnx = cnxpool.get_connection()
        print("---Database connection successful---")
    except mysql.connector.Error as err:
        print(f'Database connection error: {err}')
        raise
    return cnx

def get_db_attractions(page, keyword=None):
    try:
        db_connection = get_db_connection()
        db = db_connection.cursor(dictionary=True)
        
        # 基本查詢語句
        attraction_query = (
            """
            SELECT id, name, CAT AS category, description, address, direction AS transport, MRT AS mrt, latitude AS lat, longitude AS lng, images
            FROM attractions
            """
        )
        
        # 計算總數的查詢語句
        count_query = "SELECT COUNT(*) AS count FROM attractions"
        
        if keyword:
            attraction_query += " WHERE name LIKE %s OR mrt LIKE %s"
            count_query += " WHERE name LIKE %s OR mrt LIKE %s"
            val_1 = (f"%{keyword}%", f"%{keyword}%")
            db.execute(count_query, val_1)
        else:
            db.execute(count_query)
        
        row_count = db.fetchone()["count"]
        print(row_count)
        
        offset = page * 12
        attraction_query += " LIMIT 12 OFFSET %s"
        
        if keyword:
            val = (f"%{keyword}%", f"%{keyword}%", offset)
        else:
            val = (offset,)
        
        db.execute(attraction_query, val)
        results = db.fetchall()
        
        return {"data": results, "lastPage": (page + 1) * 12 >= row_count}
    except Exception as e:
        logging.error("Error when fetching attractions info: %s", e, exc_info=True)
        return {}
    finally:
        db.close()
        db_connection.close()

def get_db_attraction_by_id(attraction_id):
    try:
        db_connection = get_db_connection()
        db = db_connection.cursor(dictionary=True)
        attraction_query = (
            """
            SELECT id, name, CAT AS category, description, address, direction AS transport, MRT AS mrt, latitude AS lat, longitude AS lng, images
            FROM attractions
            WHERE id = %s
            """
        )
        val = (attraction_id,)
        db.execute(attraction_query, val)
        return db.fetchone()
    except Exception as e:
        logging.error("Error when fetching attraction info: %s", e, exc_info=True)
        return {}
    finally:
        db.close()
        db_connection.close()

def get_db_mrts():
    try:
        db_connection = get_db_connection()
        db = db_connection.cursor(dictionary=True)
        mrts_query = "SELECT MRT as mrt, COUNT(*) as count FROM attractions GROUP BY mrt ORDER BY COUNT(*) DESC"
        db.execute(mrts_query)
        return db.fetchall()
    except Exception as e:
        logging.error("Error when fetching MRT info: %s", e, exc_info=True)
        return {}
    finally:
        db.close()
        db_connection.close()

# 測試功能
if __name__ == "__main__":
    print(get_db_attractions(0, "北投"))
    print(get_db_attraction_by_id(1))
    print(get_db_mrts())
