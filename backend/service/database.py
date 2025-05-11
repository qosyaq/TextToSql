from sqlalchemy import select
from data.config import new_session, DatabaseOrm, UserOrm
from service import user
from model.database import Database
from fastapi import HTTPException, status
from sqlalchemy import exc
from typing import Optional


async def get_databases(token: str, page: Optional[int], page_size: int, skip: Optional[int]) -> list[Database] | None:
    try:
        if page is not None:
            skip = (page - 1) * page_size
        elif skip is None:
            skip = 0
        user_model: UserOrm = await user.verify_token(token)
        user_id = user_model.id
        async with new_session() as session:
            query = select(DatabaseOrm).filter(DatabaseOrm.user_id == user_id).offset(skip).limit(page_size)
            result = await session.execute(query)
            databases_model = result.scalars().all()
            databases = [Database.from_orm(database_model) for database_model in databases_model]
            return databases
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bad request.")


async def create_database(token: str, data: Database) -> Database | None:
    try:
        user_model: UserOrm = await user.verify_token(token)
        user_id = user_model.id
        async with new_session() as session:
            database_dict = data.model_dump()
            database = DatabaseOrm(**database_dict, user_id=user_id)
            session.add(database)
            await session.flush()
            await session.commit()
            database = Database.from_orm(database)
            return database
    except exc.IntegrityError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="You're trying to create database, which is already exist")
    except AttributeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Some parametrs do not exist")


async def get_db_id_if_exists(token: str, db_name: str) -> int:
    user_model = await user.verify_token(token)
    user_id = user_model.id
    async with new_session() as session:
        query = select(DatabaseOrm).where(DatabaseOrm.user_id == user_id, DatabaseOrm.db_name == db_name)
        result = await session.execute(query)
        database: DatabaseOrm = result.scalars().first()
        if database is None:
            return 0
        return database.id


async def delete(token: str, db_name: str) -> dict:
    user_model: UserOrm = await user.verify_token(token)
    user_id = user_model.id
    async with new_session() as session:
        query = select(DatabaseOrm).where(DatabaseOrm.user_id == user_id, DatabaseOrm.db_name == db_name)
        result = await session.execute(query)
        db_model = result.scalars().first()
        if db_model is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Non-existent Database")
        await session.delete(db_model)
        await session.commit()
    return {"detail": "Database deleted successful!"}