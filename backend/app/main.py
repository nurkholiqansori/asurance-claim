from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routers import auth, claims
import app.models  # noqa

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Approval System API",
    description="Insurance claim approval system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(claims.router)

@app.get("/", tags=["Health"])
def health():
    return {"status": "ok"}
