from pydantic import BaseModel, ConfigDict


class Column(BaseModel):
    column_name: str
    column_type: str | None
    model_config = ConfigDict(from_attributes=True)
