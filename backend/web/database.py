from fastapi import APIRouter, Depends, status, Query
from fastapi.security import OAuth2PasswordBearer
from service import database
from model.database import Database
from typing import Optional

router = APIRouter(prefix="/database", tags=["database"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")


@router.get("s")
async def get_all_databases(page: Optional[int] = Query(None, ge=1), page_size: int = Query(10, gt=0, le=100),
                            skip: Optional[int] = Query(None, ge=0), token: str = Depends(oauth2_scheme)

                            ) -> list[Database] | None:
    databases = await database.get_databases(token, page, page_size, skip)
    return databases


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_database(data: Database, token: str = Depends(oauth2_scheme)) -> Database | None:
    database_model: Database = await database.create_database(token, data)
    return database_model


@router.delete("/{db_name}")
async def delete_db(db_name, token: str = Depends(oauth2_scheme)) -> dict:
    result = await database.delete(token, db_name)
    return result
