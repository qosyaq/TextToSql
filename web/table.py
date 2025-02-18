from fastapi import APIRouter, Depends, status, Query
from model.table import Table
from fastapi.security import OAuth2PasswordBearer
from service import table as service
from typing import Optional

router = APIRouter(prefix="/database", tags=["Table"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")


@router.get("/{db_name}/tables")
async def get_tables(db_name: str, page: Optional[int] = Query(None, ge=1), page_size: int = Query(10, gt=0, le=100),
                     skip: Optional[int] = Query(None, ge=0), token: str = Depends(oauth2_scheme)) -> list[
                                                                                                          Table] | None:
    tables = await service.get_all_tables_from_db(db_name, token, page, page_size, skip)
    return tables


@router.post("/{db_name}/table", status_code=status.HTTP_201_CREATED)
async def add_table(table: Table, db_name: str, token: str = Depends(oauth2_scheme)) -> Table | None:
    table = await service.add_table_to_db(db_name, token, table)
    return table


@router.delete("/{db_name}/table/{table_name}")
async def delete(db_name: str, table_name: str, token: str = Depends(oauth2_scheme)) -> dict:
    result = await service.delete_table(db_name, table_name, token)
    return result
