from data.config import new_session
from model.table import Table
from data.config import TableOrm, DatabaseOrm
from sqlalchemy import select, exc
from service import user, database
from fastapi import HTTPException, status
from typing import Optional


async def get_all_tables_from_db(db_name: str, token: str, page: Optional[int], page_size: Optional[int],
                                 skip: Optional[int]) -> \
        list[Table] | None:
    if not await database.db_exists(token, db_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found!")

    try:
        if page is not None:
            skip = (page - 1) * page_size
        if skip is None:
            skip = 0
        user_model = await user.verify_token(token)
        user_id = user_model.id
        async with new_session() as session:
            if page_size is not None:
                query = select(TableOrm).join(DatabaseOrm).where(DatabaseOrm.db_name == db_name,
                                                                 DatabaseOrm.user_id == user_id).offset(skip).limit(
                    page_size)
            else:
                query = select(TableOrm).join(DatabaseOrm).where(DatabaseOrm.db_name == db_name,
                                                                 DatabaseOrm.user_id == user_id).offset(skip)
            result = await session.execute(query)
            tabel_models = result.scalars().all()
            tabels = [Table.from_orm(tabel_model) for tabel_model in tabel_models]
            return tabels
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bad request.")


async def add_table_to_db(db_name: str, token: str, table: Table) -> Table | None:
    if not await database.db_exists(token, db_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found!")
    try:
        user_model = await user.verify_token(token)
        user_id = user_model.id
        async with new_session() as session:

            query = select(DatabaseOrm).where(DatabaseOrm.db_name == db_name, DatabaseOrm.user_id == user_id)
            result = await session.execute(query)
            database_model = result.scalar_one_or_none()

            table_dict = table.model_dump()
            new_table = TableOrm(**table_dict, database_id=database_model.id)
            session.add(new_table)
            await session.flush()
            await session.commit()
            new_table = Table.from_orm(new_table)
            return new_table
    except exc.IntegrityError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="This table exists in database!")


async def delete_table(db_name: str, table_name: str, token: str) -> dict:
    if not await database.db_exists(token, db_name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found!")
    user_model = await user.verify_token(token)
    user_id = user_model.id
    async with new_session() as session:
        query = select(TableOrm).join(DatabaseOrm).where(DatabaseOrm.db_name == db_name,
                                                         DatabaseOrm.user_id == user_id,
                                                         TableOrm.table_name == table_name
                                                         )
        result = await session.execute(query)
        table_model = result.scalars().first()
        if table_model is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Non-existent table")
        await session.delete(table_model)
        await session.commit()
    return {"detail:": "Table deleted successfully!"}


async def table_exists(token: str, db_name: str, table_name: str) -> bool:
    user_model = await user.verify_token(token)
    user_id = user_model.id
    async with new_session() as session:
        query = select(TableOrm).join(DatabaseOrm).where(DatabaseOrm.user_id == user_id, DatabaseOrm.db_name == db_name,
                                                         TableOrm.table_name == table_name)
        result = await session.execute(query)
        if result.scalars().first() is None:
            return False
        return True
