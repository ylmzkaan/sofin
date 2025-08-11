from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db
from ..services.stripe_service import StripeService
from ..config import settings
from datetime import datetime

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("/", response_model=schemas.SubscriptionResponse)
def create_subscription(
    subscription: schemas.SubscriptionCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new subscription"""
    # Check if already subscribed
    existing_subscription = db.query(models.Subscription).filter(
        models.Subscription.subscriber_id == current_user.id,
        models.Subscription.creator_id == subscription.creator_id,
        models.Subscription.status == "active"
    ).first()
    
    if existing_subscription:
        raise HTTPException(status_code=400, detail="Already subscribed to this user")
    
    # Get creator details
    creator = db.query(models.User).filter(models.User.id == subscription.creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    if creator.monthly_fee <= 0:
        raise HTTPException(status_code=400, detail="This user doesn't charge for subscriptions")
    
    # Create Stripe customer if doesn't exist
    stripe_customer_id = None
    if not hasattr(current_user, 'stripe_customer_id'):
        stripe_customer_id = StripeService.create_customer(
            current_user.email, 
            current_user.full_name or current_user.username
        )
        # You might want to store this in your user model
    
    # Create Stripe price
    price_id = StripeService.create_price(creator.monthly_fee)
    
    # Create Stripe subscription
    stripe_subscription = StripeService.create_subscription(
        stripe_customer_id or "cus_default",  # Use default if no customer ID
        price_id
    )
    
    # Create subscription record
    db_subscription = models.Subscription(
        subscriber_id=current_user.id,
        creator_id=subscription.creator_id,
        stripe_subscription_id=stripe_subscription.id,
        status="active",
        current_period_start=datetime.fromtimestamp(stripe_subscription.current_period_start),
        current_period_end=datetime.fromtimestamp(stripe_subscription.current_period_end)
    )
    
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    
    return db_subscription


@router.get("/", response_model=List[schemas.SubscriptionResponse])
def get_subscriptions(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscriptions"""
    subscriptions = db.query(models.Subscription).filter(
        models.Subscription.subscriber_id == current_user.id
    ).all()
    
    return subscriptions


@router.delete("/{subscription_id}")
def cancel_subscription(
    subscription_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a subscription"""
    subscription = db.query(models.Subscription).filter(
        models.Subscription.id == subscription_id,
        models.Subscription.subscriber_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Cancel in Stripe
    if subscription.stripe_subscription_id:
        StripeService.cancel_subscription(subscription.stripe_subscription_id)
    
    # Update local status
    subscription.status = "canceled"
    db.commit()
    
    return {"message": "Subscription canceled successfully"}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    
    try:
        event = StripeService.verify_webhook_signature(payload, signature)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Handle different event types
    if event["type"] == "invoice.payment_succeeded":
        # Payment succeeded
        subscription_id = event["data"]["object"]["subscription"]
        subscription = db.query(models.Subscription).filter(
            models.Subscription.stripe_subscription_id == subscription_id
        ).first()
        
        if subscription:
            subscription.status = "active"
            db.commit()
    
    elif event["type"] == "invoice.payment_failed":
        # Payment failed
        subscription_id = event["data"]["object"]["subscription"]
        subscription = db.query(models.Subscription).filter(
            models.Subscription.stripe_subscription_id == subscription_id
        ).first()
        
        if subscription:
            subscription.status = "past_due"
            db.commit()
    
    elif event["type"] == "customer.subscription.deleted":
        # Subscription deleted
        subscription_id = event["data"]["object"]["id"]
        subscription = db.query(models.Subscription).filter(
            models.Subscription.stripe_subscription_id == subscription_id
        ).first()
        
        if subscription:
            subscription.status = "canceled"
            db.commit()
    
    return {"status": "success"}


@router.get("/check/{creator_id}")
def check_subscription(
    creator_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check if current user is subscribed to a creator"""
    subscription = db.query(models.Subscription).filter(
        models.Subscription.subscriber_id == current_user.id,
        models.Subscription.creator_id == creator_id,
        models.Subscription.status == "active"
    ).first()
    
    return {"is_subscribed": subscription is not None} 