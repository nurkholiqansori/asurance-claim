from sqlalchemy import create_engine

from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL
print("Using DB:", DATABASE_URL)

engine = create_engine(DATABASE_URL, echo=True)
conn = engine.connect()
print("Connected successfully")
conn.close()