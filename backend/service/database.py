from sqlalchemy import select
from data.config import new_session, DatabaseOrm, UserOrm
from service import user
from model.database import Database
from fastapi import HTTPException, status, UploadFile
from sqlalchemy import exc
from typing import Optional, Dict, List, Tuple
import re
from model.table import Table
from model.column import Column
from service.table import add_table_to_db
from service.column import create_column_in_table

CREATE_RE = re.compile(
    r"CREATE TABLE\s+public\.(\w+)\s*\((.*?)\);",
    re.DOTALL | re.IGNORECASE
)

SKIP_PREFIX = {"CONSTRAINT", "PRIMARY", "UNIQUE", "FOREIGN",
               "CHECK", "EXCLUDE", "PARTITION", ")"}


def _canon_type(raw: str) -> str:
    t = re.sub(r"\(.*?\)", "", raw).upper().strip()
    if t.startswith("CHARACTER"):
        return "VARCHAR"
    if t == "INTEGER":
        return "INT"
    return t


def parse_sql_dump(sql: str) -> Dict[str, List[Tuple[str, str]]]:
    tables: Dict[str, List[Tuple[str, str]]] = {}

    for tbl_match in CREATE_RE.finditer(sql):
        table_name, block = tbl_match.groups()
        columns: List[Tuple[str, str]] = []

        for raw in block.splitlines():
            line = raw.strip().rstrip(",")

            if not line or line.startswith("--"):
                continue
            first = line.split()[0].upper()
            if first in SKIP_PREFIX:
                continue

            m = re.match(r'"?(?P<name>\w+)"?\s+(?P<rest>.+)', line)
            if not m:
                continue

            col_name = m.group("name")
            rest = m.group("rest")

            toks = []
            for tok in re.split(r"\s+", rest):
                if tok.upper() in {"NOT", "NULL", "DEFAULT",
                                   "PRIMARY", "REFERENCES", "UNIQUE",
                                   "CHECK"}:
                    break
                toks.append(tok)
            if not toks:
                continue

            base_type = _canon_type(" ".join(toks))
            columns.append((col_name, base_type))

        tables[table_name] = columns

    return tables


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


async def create_database(token: str, data: Database, file: UploadFile | None = None) -> Database | None:
    try:
        user_model: UserOrm = await user.verify_token(token)
        user_id = user_model.id

        async with new_session() as session:
            database_dict = data.model_dump(exclude={"file"})
            database = DatabaseOrm(**database_dict, user_id=user_id)
            session.add(database)
            await session.flush()
            await session.commit()
            database = Database.from_orm(database)

        if file:
            sql_text = (await file.read()).decode("utf-8")
            parsed_tables = parse_sql_dump(sql_text)

            for table_name, columns in parsed_tables.items():
                table = Table(table_name=table_name)
                await add_table_to_db(data.db_name, token, table)

                for column_name, column_type in columns:
                    column = Column(column_name=column_name, column_type=column_type)
                    await create_column_in_table(token, data.db_name, column, table_name)

        return database

    except exc.IntegrityError:
        raise HTTPException(status_code=400, detail="You're trying to create database, which already exists.")
    except AttributeError:
        raise HTTPException(status_code=400, detail="Some parameters do not exist.")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=f"Unexpected error: {str(e)}")


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


async def get_db_model(token: str, db_name: str) -> DatabaseOrm | None:
    user_model: UserOrm = await user.verify_token(token)
    user_id = user_model.id
    async with new_session() as session:
        result = await session.execute(
            select(DatabaseOrm).where(DatabaseOrm.user_id == user_id, DatabaseOrm.db_name == db_name)
        )
        return result.scalars().first()
