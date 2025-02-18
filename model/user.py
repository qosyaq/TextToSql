from pydantic import BaseModel, Field, ConfigDict


class LoginRequest(BaseModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=3)


class User(BaseModel):
    username: str
    hashed_password: str
    model_config = ConfigDict(from_attributes=True)


class Password(BaseModel):
    password: str
