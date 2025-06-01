from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=3)


class User(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    hashed_password: Optional[str] = None
    is_verified: bool = False
    oauth_provider: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Password(BaseModel):
    password: str


class VerifyEmailRequest(BaseModel):
    email: EmailStr = Field(..., description="Email")
    code: str = Field(..., min_length=6, max_length=6, description="code")


class ResendVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="Email")


class OAuthRequest(BaseModel):
    oauth_token: str
