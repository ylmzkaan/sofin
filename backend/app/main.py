from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .api import auth, users, analyses, subscriptions
from .database import engine
from . import models
from .config import settings

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Create uploads directory
os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(
    title="Social Finance API",
    description="A social finance platform for stock analysis and subscriptions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(analyses.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Social Finance API is running!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"} 