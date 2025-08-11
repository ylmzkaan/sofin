from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    monthly_fee: Optional[float] = 0.0


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    monthly_fee: Optional[float] = None


class UserResponse(UserBase):
    id: int
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserWithStats(UserResponse):
    total_analyses: int
    success_rate: Optional[float] = None
    subscriber_count: int


# Analysis schemas
class AnalysisBase(BaseModel):
    title: str
    content: str
    target_price: float
    current_price: Optional[float] = None
    time_horizon: str
    ticker_symbol: Optional[str] = None


class AnalysisCreate(AnalysisBase):
    pass


class AnalysisUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    target_price: Optional[float] = None
    current_price: Optional[float] = None
    time_horizon: Optional[str] = None
    ticker_symbol: Optional[str] = None


class AnalysisResponse(AnalysisBase):
    id: int
    author_id: int
    success_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: UserResponse
    images: List['AnalysisImageResponse'] = []
    tags: List['TagResponse'] = []
    
    class Config:
        from_attributes = True


# Analysis Image schemas
class AnalysisImageBase(BaseModel):
    caption: Optional[str] = None


class AnalysisImageCreate(AnalysisImageBase):
    pass


class AnalysisImageResponse(AnalysisImageBase):
    id: int
    analysis_id: int
    image_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Tag schemas
class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Subscription schemas
class SubscriptionBase(BaseModel):
    creator_id: int


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionResponse(SubscriptionBase):
    id: int
    subscriber_id: int
    stripe_subscription_id: Optional[str] = None
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: UserResponse
    subscriber: UserResponse
    
    class Config:
        from_attributes = True


# Payment schemas
class PaymentIntentCreate(BaseModel):
    creator_id: int


class PaymentIntentResponse(BaseModel):
    client_secret: str
    subscription_id: int


# Auth schemas
class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Update forward references
AnalysisResponse.model_rebuild()
AnalysisImageResponse.model_rebuild()
TagResponse.model_rebuild()
SubscriptionResponse.model_rebuild() 