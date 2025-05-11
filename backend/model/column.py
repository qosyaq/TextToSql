from pydantic import BaseModel, ConfigDict, Field


class Column(BaseModel):
    column_name: str = Field(max_length=30)
    column_type: str | None
    model_config = ConfigDict(from_attributes=True)
