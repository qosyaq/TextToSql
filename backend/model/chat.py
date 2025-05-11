from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ChatRequest(BaseModel):
    content: Optional[str]


class Chat(BaseModel):
    content: str
    sender: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)