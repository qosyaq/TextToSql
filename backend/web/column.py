from fastapi import APIRouter, Depends, Query, status
from service import column as service
from fastapi.security import OAuth2PasswordBearer
from model.column import Column
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")

router = APIRouter(prefix="/database", tags=["Column"])


@router.get("/{db_name}/table/{table_name}/columns")
async def get_all_columns(db_name: str, table_name: str, page: Optional[int] = Query(None, gt=1),
                          page_size: int = Query(10, gt=0, le=100),
                          skip: Optional[int] = Query(None, ge=0), token: str = Depends(oauth2_scheme)
                          ) -> list[Column] | None:
    columns = await service.get_all_columns_from_table(token, db_name, table_name, page, page_size, skip)
    return columns


@router.post("/{db_name}/table/{table_name}/column", status_code=status.HTTP_201_CREATED)
async def create_column(column: Column, db_name: str, table_name: str,
                        token: str = Depends(oauth2_scheme)) -> Column | None:
    created_column = await service.create_column_in_table(token, db_name, column, table_name)
    return created_column


@router.delete("/{db_name}/table/{table_name}/column/{column_name}")
async def delete_column(db_name: str, table_name: str, column_name: str,
                        token: str = Depends(oauth2_scheme)) -> dict | None:
    result = await service.delete_column(db_name, table_name, token, column_name)
    return result
