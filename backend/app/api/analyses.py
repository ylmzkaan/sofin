from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
from .. import models, schemas, auth
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.post("/", response_model=schemas.AnalysisResponse)
def create_analysis(
    title: str = Form(...),
    content: str = Form(...),
    target_price: float = Form(...),
    current_price: Optional[float] = Form(None),
    time_horizon: str = Form(...),
    ticker_symbol: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new analysis"""
    # Create analysis
    analysis = models.Analysis(
        title=title,
        content=content,
        target_price=target_price,
        current_price=current_price,
        time_horizon=time_horizon,
        ticker_symbol=ticker_symbol,
        author_id=current_user.id
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Handle image uploads
    if images:
        for image in images:
            if image.content_type.startswith('image/'):
                # Save image
                filename = f"{analysis.id}_{image.filename}"
                file_path = os.path.join(settings.upload_dir, filename)
                
                os.makedirs(settings.upload_dir, exist_ok=True)
                with open(file_path, "wb") as buffer:
                    buffer.write(image.file.read())
                
                # Create image record
                analysis_image = models.AnalysisImage(
                    analysis_id=analysis.id,
                    image_path=file_path,
                    caption=image.filename
                )
                db.add(analysis_image)
        
        db.commit()
        db.refresh(analysis)
    
    return analysis


@router.get("/", response_model=List[schemas.AnalysisResponse])
def get_analyses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    author_id: Optional[int] = Query(None),
    ticker_symbol: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get list of analyses"""
    query = db.query(models.Analysis)
    
    if author_id:
        query = query.filter(models.Analysis.author_id == author_id)
    
    if ticker_symbol:
        query = query.filter(models.Analysis.ticker_symbol == ticker_symbol)
    
    analyses = query.offset(skip).limit(limit).order_by(models.Analysis.created_at.desc()).all()
    return analyses


@router.get("/{analysis_id}", response_model=schemas.AnalysisResponse)
def get_analysis(
    analysis_id: int,
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis by ID"""
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Check if user is subscribed to the author
    if current_user and current_user.id != analysis.author_id:
        subscription = db.query(models.Subscription).filter(
            models.Subscription.subscriber_id == current_user.id,
            models.Subscription.creator_id == analysis.author_id,
            models.Subscription.status == "active"
        ).first()
        
        if not subscription:
            raise HTTPException(
                status_code=403,
                detail="You need to subscribe to this user to view their analyses"
            )
    
    return analysis


@router.put("/{analysis_id}", response_model=schemas.AnalysisResponse)
def update_analysis(
    analysis_id: int,
    analysis_update: schemas.AnalysisUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update analysis"""
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if analysis.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this analysis")
    
    for field, value in analysis_update.dict(exclude_unset=True).items():
        setattr(analysis, field, value)
    
    db.commit()
    db.refresh(analysis)
    return analysis


@router.delete("/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete analysis"""
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if analysis.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this analysis")
    
    db.delete(analysis)
    db.commit()
    
    return {"message": "Analysis deleted successfully"}


@router.get("/{analysis_id}/images", response_model=List[schemas.AnalysisImageResponse])
def get_analysis_images(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """Get images for a specific analysis"""
    images = db.query(models.AnalysisImage).filter(
        models.AnalysisImage.analysis_id == analysis_id
    ).all()
    
    return images


@router.post("/{analysis_id}/images", response_model=schemas.AnalysisImageResponse)
def add_analysis_image(
    analysis_id: int,
    image: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add image to analysis"""
    # Check if analysis exists and user owns it
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if analysis.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add images to this analysis")
    
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save image
    filename = f"{analysis_id}_{image.filename}"
    file_path = os.path.join(settings.upload_dir, filename)
    
    os.makedirs(settings.upload_dir, exist_ok=True)
    with open(file_path, "wb") as buffer:
        buffer.write(image.file.read())
    
    # Create image record
    analysis_image = models.AnalysisImage(
        analysis_id=analysis_id,
        image_path=file_path,
        caption=caption
    )
    
    db.add(analysis_image)
    db.commit()
    db.refresh(analysis_image)
    
    return analysis_image 