from typing import Optional
from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import mysql.connector
from mysql.connector import Error
from config import Config

app = FastAPI()

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
    return FileResponse("./static/index.html", media_type="text/html")

@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
    return FileResponse("./static/attraction.html", media_type="text/html")

@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
    return FileResponse("./static/booking.html", media_type="text/html")

@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
    return FileResponse("./static/thankyou.html", media_type="text/html")

# Connect to MySQL server
def connectMySQLserver():
    try:
        con = mysql.connector.connect(
            host="localhost",
            user="root",
            password=Config.MYSQL_PASSWORD,
            database="website"
        )
        if con.is_connected():
            cursor = con.cursor(dictionary=True)  # 使用 dictionary cursor
            return con, cursor
        else:
            print("資料庫連線未成功")
            return None, None
    except mysql.connector.Error as e:
        print("資料庫連線失敗:", e)
        return None, None

# Get attractions
@app.get("/api/attractions")
def get_attractions(page: int = 0, keyword: Optional[str] = Query(None)):
    if page < 0:
        raise HTTPException(status_code=400, detail="Page number must be 0 or greater")
    
    con, cursor = connectMySQLserver()
    if cursor is not None:
        
        try:
            offset = page * 12
            base_query = "SELECT * FROM attractions"
            limit_offset = " LIMIT %s OFFSET %s"
            params = [12, offset]

            if keyword:
                keyword_condition = " WHERE name LIKE %s OR mrt = %s"
                base_query += keyword_condition
                params = [f"%{keyword}%", keyword, 12, offset]

            full_query = base_query + limit_offset

            cursor.execute(full_query, params)
            attractions = cursor.fetchall()

            if not attractions:
                return {"nextPage": None, "data": []}

            next_page = page + 1 if len(attractions) == 12 else None

            result = []
            for attraction in attractions:
                images = attraction['images'].split(',') if attraction['images'] else []

                result.append({
                    "id": attraction['id'],
                    "name": attraction['name'],
                    "category": attraction['category'],
                    "description": attraction['description'],
                    "address": attraction['address'],
                    "transport": attraction['transport'],
                    "mrt": attraction['mrt'],
                    "lat": attraction['lat'],
                    "lng": attraction['lng'],
                    "images": [url for url in images if url.lower().endswith(('jpg', 'png'))]
                })

            return {"nextPage": next_page, "data": result}
        except mysql.connector.Error as err:
            return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
        finally:
            con.close()
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})

# Get attraction by id
@app.get("/api/attraction/{attractionId}")
def get_attraction(attractionId: int):
    con, cursor = connectMySQLserver()
    if cursor is not None:
        try:
            cursor.execute("SELECT * FROM attractions WHERE id = %s", (attractionId,))
            attraction = cursor.fetchone()

            if not attraction:
                raise HTTPException(status_code=400, detail="景點編號不正確")

            images = attraction['images'].split(',') if attraction['images'] else []

            result = {
                "id": attraction['id'],
                "name": attraction['name'],
                "category": attraction['category'],
                "description": attraction['description'],
                "address": attraction['address'],
                "transport": attraction['transport'],
                "mrt": attraction['mrt'],
                "lat": attraction['lat'],
                "lng": attraction['lng'],
                "images": [url for url in images if url.lower().endswith(('jpg', 'png'))]
            }

            return {"data": result}
        except mysql.connector.Error as err:
            return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
        finally:
            con.close()
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})

# Get MRTs
@app.get("/api/mrts")
def get_mrts():
    con, cursor = connectMySQLserver()
    if cursor is not None:
        try:
            cursor.execute("SELECT mrt, COUNT(*) FROM attractions GROUP BY mrt ORDER BY COUNT(*) DESC")
            rows = cursor.fetchall()
            mrts = [row['mrt'] for row in rows if row['mrt'] is not None]
            return {"data": mrts}
        except mysql.connector.Error as err:
            return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
        finally:
            con.close()
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})

def close_connection_pool():
    pass

@app.on_event("shutdown")
def shutdown_event():
    close_connection_pool()

