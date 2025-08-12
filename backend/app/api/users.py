from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[schemas.UserWithStats])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get list of users with their statistics"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        # Calculate total analyses
        total_analyses = db.query(func.count(models.Analysis.id)).filter(
            models.Analysis.author_id == user.id
        ).scalar()
        
        # Calculate success rate
        success_count = db.query(func.count(models.Analysis.id)).filter(
            models.Analysis.author_id == user.id,
            models.Analysis.success_status == "success"
        ).scalar()
        
        success_rate = (success_count / total_analyses * 100) if total_analyses > 0 else None
        
        # Count subscribers
        subscriber_count = db.query(func.count(models.Subscription.id)).filter(
            models.Subscription.creator_id == user.id,
            models.Subscription.status == "active"
        ).scalar()
        
        user_stats = schemas.UserWithStats(
            **user.__dict__,
            total_analyses=total_analyses,
            success_rate=success_rate,
            subscriber_count=subscriber_count
        )
        result.append(user_stats)
    
    return result


@router.get("/me", response_model=schemas.UserResponse)
def get_my_profile(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=schemas.UserResponse)
def update_user(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/analyses", response_model=List[schemas.AnalysisResponse])
def get_my_analyses(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's analyses"""
    analyses = db.query(models.Analysis).filter(
        models.Analysis.author_id == current_user.id
    ).order_by(models.Analysis.created_at.desc()).all()
    
    return analyses


@router.get("/me/subscriptions", response_model=List[schemas.SubscriptionResponse])
def get_my_subscriptions(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscriptions"""
    subscriptions = db.query(models.Subscription).filter(
        models.Subscription.subscriber_id == current_user.id
    ).all()
    
    return subscriptions


@router.get("/me/subscribers", response_model=List[schemas.SubscriptionResponse])
def get_my_subscribers(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscribers"""
    subscriptions = db.query(models.Subscription).filter(
        models.Subscription.creator_id == current_user.id
    ).all()
    
    return subscriptions


@router.get("/{user_id}", response_model=schemas.UserWithStats)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID with statistics"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate statistics
    total_analyses = db.query(func.count(models.Analysis.id)).filter(
        models.Analysis.author_id == user.id
    ).scalar()
    
    success_count = db.query(func.count(models.Analysis.id)).filter(
        models.Analysis.author_id == user.id,
        models.Analysis.success_status == "success"
    ).scalar()
    
    success_rate = (success_count / total_analyses * 100) if total_analyses > 0 else None
    
    subscriber_count = db.query(func.count(models.Subscription.id)).filter(
        models.Subscription.creator_id == user.id,
        models.Subscription.status == "active"
    ).scalar()
    
    return schemas.UserWithStats(
        **user.__dict__,
        total_analyses=total_analyses,
        success_rate=success_rate,
        subscriber_count=subscriber_count
    ) 