from pydantic import BaseModel, ConfigDict, Field


class Database(BaseModel):
    db_name: str = Field(min_length=3)
    model_config = ConfigDict(from_attributes=True)
