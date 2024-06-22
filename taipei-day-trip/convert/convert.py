import json
import mysql.connector
from config import Config

# 保留現有的資料庫連接設置
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password=Config.MYSQL_PASSWORD,
    database="website"
)
cursor = db.cursor()

# 讀取和解析 JSON 檔案
with open('data/taipei-attractions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 確保 attractions 表格存在，否則創建它
cursor.execute("""
CREATE TABLE IF NOT EXISTS attractions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    description TEXT,
    address VARCHAR(255),
    transport TEXT,
    mrt VARCHAR(255),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    images JSON
)
""")

# 確保 member 表格存在，否則創建它
cursor.execute("""
CREATE TABLE IF NOT EXISTS member (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
)
""")

# 插入資料
for attraction in data['result']['results']:  # 確保從 'result' -> 'results' 中讀取資料
    name = attraction['name']
    category = attraction.get('CAT', '')
    description = attraction.get('description', '')
    address = attraction.get('address', '')
    transport = attraction.get('direction', '')
    mrt = attraction.get('MRT', '')
    lat = float(attraction.get('latitude', 0.0))  # 確保緯度和經度為浮點數
    lng = float(attraction.get('longitude', 0.0))
    
    # 使用正則表達式分割字符串
    import re
    image_urls = re.split(r'https://', attraction['file'])
    valid_image_urls = [f"https://{url}" for url in image_urls if url.endswith(('.jpg', '.JPG', '.PNG', '.png'))]
    images = json.dumps(valid_image_urls, ensure_ascii=False)  # 將圖像 URL 列表轉換為 JSON 字符串

    insert_attraction = """
    INSERT INTO attractions (name, category, description, address, transport, mrt, lat, lng, images)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    cursor.execute(insert_attraction, (name, category, description, address, transport, mrt, lat, lng, images))
    
db.commit()

# 提交更改並關閉連接
cursor.close()
db.close()





