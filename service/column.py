from data.config import new_session, ColumnOrm, TableOrm, DatabaseOrm, UserOrm
from model.column import Column
from service import user, table, database
from fastapi import HTTPException, status
from sqlalchemy import select, exc
from typing import Optional


async def get_all_columns_from_table(token: str, db_name: str, table_name: str, page: Optional[int],
                                     page_size: Optional[int],
                                     skip: Optional[int]) -> list[Column] | None:
    if not await database.db_exists(token, db_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found!")
    if not await table.table_exists(token, db_name, table_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found!")

    try:
        if page is not None:
            skip = (page - 1) * page_size
        if skip is None:
            skip = 0

        user_model: UserOrm = await user.verify_token(token)
        user_id = user_model.id
        async with new_session() as session:
            if page_size is not None:
                query = select(ColumnOrm).join(TableOrm).join(DatabaseOrm).where(TableOrm.table_name == table_name,
                                                                                 DatabaseOrm.db_name == db_name,
                                                                                 DatabaseOrm.user_id == user_id).offset(
                    skip).limit(page_size)
            else:
                query = select(ColumnOrm).join(TableOrm).join(DatabaseOrm).where(TableOrm.table_name == table_name,
                                                                                 DatabaseOrm.db_name == db_name,
                                                                                 DatabaseOrm.user_id == user_id).offset(
                    skip)
            result = await session.execute(query)
            column_models = result.scalars().all()
            columns = [Column.from_orm(column_model) for column_model in column_models]
            return columns
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bad request.")


async def create_column_in_table(token: str, db_name: str, column: Column, table_name: str) -> Column | None:
    if not await database.db_exists(token, db_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found!")
    if not await table.table_exists(token, db_name, table_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found!")

    try:
        user_model = await user.verify_token(token)
        user_id = user_model.id
        async with new_session() as session:
            query = select(TableOrm).join(DatabaseOrm).where(
                TableOrm.table_name == table_name,
                DatabaseOrm.db_name == db_name,
                DatabaseOrm.user_id == user_id)
            result = await session.execute(query)
            table_model = result.scalars().first()
            column_dict = column.model_dump()
            column_model = ColumnOrm(**column_dict, table_id=table_model.id)
            session.add(column_model)
            await session.flush()
            await session.commit()
            column_model = Column.from_orm(column_model)
            return column_model
    except exc.IntegrityError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This column exists in table!")


async def delete_column(db_name: str, table_name: str, token: str, column_name: str) -> dict:
    if not await database.db_exists(token, db_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found!")
    if not await table.table_exists(token, db_name, table_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found!")
    user_model = await user.verify_token(token)
    user_id = user_model.id
    async with new_session() as session:
        query = select(ColumnOrm).join(TableOrm).join(DatabaseOrm).where(DatabaseOrm.db_name == db_name,
                                                                         DatabaseOrm.user_id == user_id,
                                                                         TableOrm.table_name == table_name,
                                                                         ColumnOrm.column_name == column_name
                                                                         )
        result = await session.execute(query)
        column_model = result.scalars().first()
        if column_model is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Non-existent column!")
        await session.delete(column_model)
        await session.commit()
    return {"detail:": "Column deleted successfully!"}
