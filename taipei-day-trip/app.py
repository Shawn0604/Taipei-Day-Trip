from typing import Optional
from fastapi import FastAPI, Request, Query, HTTPException,Depends
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer
import mysql.connector
from fastapi.staticfiles import StaticFiles
from mysql.connector import Error
from config import Config
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
from config import Config

app = FastAPI()
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

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

def connectMySQLserver():
    try:
        con = mysql.connector.connect(
            host="localhost",
            user="root",
            password=Config.MYSQL_PASSWORD,
            database="website"
        )
        if con.is_connected():
            cursor = con.cursor(dictionary=True)  
            return con, cursor
        else:
            print("資料庫連線未成功")
            return None, None
    except mysql.connector.Error as e:
        print("資料庫連線失敗:", e)
        return None, None
import re
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

            # print("執行查詢：", full_query, "參數：", params)
            cursor.execute(full_query, params)
            attractions = cursor.fetchall()
            # print("查詢結果：", attractions)

            if not attractions:
                return {"nextPage": None, "data": []}

            next_page = page + 1 if len(attractions) == 12 else None

            result = []
            for attraction in attractions:
                # print("處理景點：", attraction)
                # 使用正則表達式提取圖片 URL
                images = re.findall(r'(https?://\S+\.(?:jpg|png|JPG|PNG))', attraction['images'])
                # print("景點圖片：", images)

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
                    "images": images
                })

            return {"nextPage": next_page, "data": result}
        except mysql.connector.Error as err:
            print("資料庫查詢錯誤：", err)
            return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
        finally:
            con.close()
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})

@app.get("/api/attraction/{attractionId}")
def get_attraction(attractionId: int):
    con, cursor = connectMySQLserver()
    if cursor is not None:
        try:
            cursor.execute("SELECT * FROM attractions WHERE id = %s", (attractionId,))
            attraction = cursor.fetchone()

            if not attraction:
                raise HTTPException(status_code=400, detail="景點編號不正確")

            # print("Fetched attraction data:", attraction)
            images = re.findall(r'(https?://\S+\.(?:jpg|png|JPG|PNG))', attraction['images'])
            # print("Parsed images:", images)

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
                "images": images
            }

            return {"data": result}
        except mysql.connector.Error as err:
            print("Database error:", err)
            return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
        finally:
            con.close()
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})

@app.get("/api/mrts")
def get_mrts():
    con, cursor = connectMySQLserver()
    if cursor is not None:
        try:
            cursor.execute("SELECT mrt, COUNT(*) FROM attractions GROUP BY mrt ORDER BY COUNT(*) DESC")
            rows = cursor.fetchall()
            # print("Fetched MRT data:", rows)
            mrts = [row['mrt'] for row in rows if row['mrt'] is not None]
            return {"data": mrts}
        except mysql.connector.Error as err:
            print("Database error:", err)
            return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
        finally:
            con.close()
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = Config.SECRET_KEY
ALGORITHM = Config.ALGORITHM

async def generate_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    data_to_encode = data.copy()
    data_to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(data_to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_token_data(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return {}

async def get_user_info(token: str = Depends(oauth2_scheme)) -> dict:
    payload = await get_token_data(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload
    
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

@app.post("/api/user")
def create_user(user: UserCreate):
    con, cursor = connectMySQLserver()
    if cursor is not None:
        try:
            cursor.execute("SELECT * FROM member WHERE email = %s", (user.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail={"error": True, "message": "Email already registered"})

            # 執行插入新用戶的 SQL 語句
            cursor.execute(
                "INSERT INTO member (name, email, password) VALUES (%s, %s, %s)",
                (user.name, user.email, user.password)
            )
            con.commit()
            return {"ok": True}
        except mysql.connector.Error as err:
            print("Database error:", err)
            raise HTTPException(status_code=500, detail={"error": True, "message": "Internal server error"})
        finally:
            cursor.close()
            con.close()
    else:
        raise HTTPException(status_code=500, detail={"error": True, "message": "Internal server error"})



class User(BaseModel):
    id: int
    name: str
    email: str

class UserResponse(BaseModel):
    data: User

@app.get("/api/user/auth", response_model=UserResponse)
async def read_user(current_user: dict = Depends(get_user_info)):
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        con, cursor = connectMySQLserver()
        if cursor is not None:
            try:
                cursor.execute("SELECT id, name, email FROM member WHERE id=%s", (current_user["id"],))
                user = cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                return UserResponse(data=User(id=user['id'], name=user['name'], email=user['email']))
            except mysql.connector.Error as err:
                print("Database error:", err)
                raise HTTPException(status_code=500, detail="Internal server error")
            finally:
                cursor.close()
                con.close()
        else:
            raise HTTPException(status_code=500, detail="Internal server error")
    except HTTPException as http_exc:
        print(f"HTTP Exception: {str(http_exc)}")
        return JSONResponse(status_code=http_exc.status_code, content={"error": True, "message": http_exc.detail})
    except Exception as e:
        print(f"General Exception: {str(e)}")
        return JSONResponse(status_code=500, content={"error": True, "message": f"Internal server error: {str(e)}"})



class UserCheckin(BaseModel):
    email: str
    password: str

@app.put("/api/user/auth")
async def update_user(user: UserCheckin):
    try:
        con, cursor = connectMySQLserver()
        if cursor is not None:
            try:
                cursor.execute("SELECT * FROM member WHERE email=%s AND password=%s", (user.email, user.password))
                user_data = cursor.fetchone()
                if not user_data:
                    return JSONResponse(status_code=400, content={
                        "error": True,
                        "message": "Incorrect email or password"
                    })

                access_token = await generate_token(data={
                    "id": user_data["id"],
                    "name": user_data["name"],
                    "email": user_data["email"],
                })

                return {"token": access_token}
            except mysql.connector.Error as err:
                print("Database error:", err)
                raise HTTPException(status_code=500, detail={"error": True, "message": "Internal server error"})
            finally:
                cursor.close()
                con.close()
        else:
            raise HTTPException(status_code=500, detail={"error": True, "message": "Internal server error"})
    except HTTPException as http_exc:
        print(f"HTTP Exception: {str(http_exc)}")
        return {"error": True, "message": "HTTP Exception occurred"}
    except Exception as e:
        print(f"General Exception: {str(e)}")
        return {"error": True, "message": f"Internal server error: {str(e)}"}
    
class BookingDataPost(BaseModel):
    attractionId: int
    date: str
    time: str
    price: int
    member_id: int

@app.post("/api/booking")
async def create_booking(bookings: BookingDataPost):
    con, cursor = connectMySQLserver()
    if cursor is not None:
        try:
            cursor.execute("DELETE FROM booking WHERE member_id = %s", (bookings.member_id,))
            cursor.execute("INSERT INTO booking (attractionId, date, time, price, member_id) VALUES (%s, %s, %s, %s, %s)",
            (bookings.attractionId, bookings.date, bookings.time, bookings.price, bookings.member_id))
            con.commit()
            return {"ok": "true"}
        except mysql.connector.Error as err:
            print("Database Error:", err)
            return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
        finally:
            cursor.close()
            con.close()
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    
class BookingDataResponse(BaseModel):
    attractionId: int
    date: str
    time: str
    price: int
    member_id: int


@app.get("/api/booking")
async def get_booking(member_id: int):
    con, cursor = connectMySQLserver()
    if cursor is not None:
        try:
            cursor.execute("SELECT attractionId, date, time, price FROM booking WHERE member_id = %s", (member_id,))
            rows = cursor.fetchall()
            bookings = []
            for row in rows:
                booking = {
                    "attractionId": row['attractionId'],
                    "date": row['date'],
                    "time": row['time'],
                    "price": row['price']
                }
                bookings.append(booking)
            return {"data": bookings}
        except mysql.connector.Error as err:
            print("Database Error:", err)
            return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
        finally:
            cursor.close()
            con.close()
    else:
        return JSONResponse(status_code=500, content={"error": True, "message": "伺服器內部錯誤"})
    

@app.delete("/api/booking/")
async def delete_booking(member_id: int):
    con, cursor = connectMySQLserver()
    if cursor is not None:
        try:
            cursor.execute("DELETE FROM booking WHERE member_id = %s", (member_id,))
            con.commit()
            if cursor.rowcount > 0:
                return {"message": f"成功刪除 member_id 為 {member_id} 的所有預訂資料"}
            else:
                raise HTTPException(status_code=404, detail=f"找不到 member_id 為 {member_id} 的預訂資料")
        except mysql.connector.Error as err:
            print("Database Error:", err)
            raise HTTPException(status_code=500, detail="伺服器內部錯誤")
        finally:
            cursor.close()
            con.close()
    else:
        raise HTTPException(status_code=500, detail="伺服器內部錯誤")






    
def close_connection_pool():
    pass

@app.on_event("shutdown")
def shutdown_event():
    close_connection_pool()
