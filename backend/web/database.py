from fastapi import APIRouter, Depends, status, Query, Form, File, UploadFile
from fastapi.security import OAuth2PasswordBearer
from service import database
from model.database import Database
from typing import Optional
from pydantic import constr

router = APIRouter(prefix="/database", tags=["database"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")


@router.get("s")
async def get_all_databases(page: Optional[int] = Query(None, ge=1), page_size: int = Query(10, gt=0, le=100),
                            skip: Optional[int] = Query(None, ge=0), token: str = Depends(oauth2_scheme)

                            ) -> list[Database] | None:
    databases = await database.get_databases(token, page, page_size, skip)
    return databases


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_database(
    db_name: constr(min_length=3) = Form(...),
    db_type: constr(pattern="^(postgresql|mysql|sqlite|mssql|oracle)$") = Form(...),
    file: UploadFile = File(None),
    token: str = Depends(oauth2_scheme)
) -> Database | None:
    data = Database(db_name=db_name, db_type=db_type)
    return await database.create_database(token, data, file)


@router.delete("/{db_name}")
async def delete_db(db_name, token: str = Depends(oauth2_scheme)) -> dict:
    result = await database.delete(token, db_name)
    return result
