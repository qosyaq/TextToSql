from pydantic import BaseModel, Field, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=3)


class User(BaseModel):
    email: EmailStr
    hashed_password: str
    model_config = ConfigDict(from_attributes=True)


class Password(BaseModel):
    password: str
