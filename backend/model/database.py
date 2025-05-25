from pydantic import BaseModel, ConfigDict, Field


class Database(BaseModel):
    db_name: str = Field(min_length=3)
    db_type: str = Field(..., pattern="^(postgresql|mysql|sqlite|mssql|oracle)$")
    model_config = ConfigDict(from_attributes=True)
