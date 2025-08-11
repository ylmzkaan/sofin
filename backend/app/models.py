from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


# Association table for many-to-many relationship between analyses and tags
analysis_tags = Table(
    'analysis_tags',
    Base.metadata,
    Column('analysis_id', Integer, ForeignKey('analyses.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    bio = Column(Text)
    profile_image = Column(String)
    is_verified = Column(Boolean, default=False)
    monthly_fee = Column(Float, default=0.0)  # Monthly subscription fee
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    analyses = relationship("Analysis", back_populates="author")
    subscriptions = relationship("Subscription", foreign_keys="Subscription.subscriber_id", back_populates="subscriber")
    subscribers = relationship("Subscription", foreign_keys="Subscription.creator_id", back_populates="creator")


class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    target_price = Column(Float, nullable=False)
    current_price = Column(Float)
    time_horizon = Column(String, nullable=False)  # e.g., "3 months", "1 year"
    ticker_symbol = Column(String)
    success_status = Column(String, default="pending")  # pending, success, failed
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    author = relationship("User", back_populates="analyses")
    images = relationship("AnalysisImage", back_populates="analysis")
    tags = relationship("Tag", secondary=analysis_tags, back_populates="analyses")


class AnalysisImage(Base):
    __tablename__ = "analysis_images"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    image_path = Column(String, nullable=False)
    caption = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    analysis = relationship("Analysis", back_populates="images")


class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    analyses = relationship("Analysis", secondary=analysis_tags, back_populates="tags")


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stripe_subscription_id = Column(String, unique=True)
    status = Column(String, default="active")  # active, canceled, past_due
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subscriber = relationship("User", foreign_keys=[subscriber_id], back_populates="subscriptions")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="subscribers")


class PaymentHistory(Base):
    __tablename__ = "payment_history"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    stripe_payment_intent_id = Column(String, unique=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="usd")
    status = Column(String, nullable=False)  # succeeded, failed, pending
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    subscription = relationship("Subscription") 