import asyncio
import html
from model.chat import Chat, ChatRequest
from service import table as table_service
from service import column as column_service
from service import database as db_service
from service import user as user_service
from g4f.client import Client
from fastapi import HTTPException, status
import g4f.Provider.Ai4Chat as Provider
import sqlglot
import pinecone
import hashlib
import os
from dotenv import load_dotenv
from data.config import new_session, UserOrm, ChatHistoryOrm, DatabaseOrm
from sqlalchemy import select, exc, delete
load_dotenv()


async def generate_id(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)

index_name = "text-to-sql"
if not pc.has_index(index_name):
    pc.create_index_for_model(
        name=index_name,
        cloud="aws",
        region="us-east-1",
        embed={"model": "llama-text-embed-v2", "field_map": {"text": "chunk_text"}}
    )
index = pc.Index(index_name)


async def validate_sql_syntax(sql_query: str, dialect: str) -> bool:
    try:
        sqlglot.parse_one(sql_query, dialect=dialect)
        return True
    except Exception as e:
        print(f"Ошибка SQL: {e}")
        return False


def normalize_schema(schema: dict) -> str:
    if not schema or "tables" not in schema:
        return "NO_SCHEMA"

    normalized_tables = []

    for table_name in sorted(schema["tables"]):
        columns = schema["tables"][table_name]

        sorted_columns = sorted(
            [(list(col.keys())[0].strip().lower(), list(col.values())[0].strip().lower()) for col in columns],
            key=lambda x: x[0]
        )

        columns_str = ", ".join(f"{col_name.upper()} ({col_type.upper()})" for col_name, col_type in sorted_columns)

        normalized_tables.append(f"{table_name.strip().lower()} : {columns_str}")

    return "\n".join(normalized_tables)


async def save_sql_to_pinecone(natural_query: str, sql_query: str, schema: dict):
    schema_string = normalize_schema(schema)

    combined_text = f"Query: {natural_query}\nSchema:\n{schema_string}"

    record = {
        "_id": await generate_id(combined_text),
        "chunk_text": combined_text,
        "sql": sql_query
    }

    index.upsert_records(namespace="sql-namespace", records=[record])
    print(f"[PINECONE] Сохранено: {natural_query} → {sql_query}")


async def find_sql_in_pinecone(natural_query: str, schema: dict, top_k=5) -> str | None:
    schema_string = normalize_schema(schema)

    combined_text = f"Query: {natural_query}\nSchema:\n{schema_string}"

    response = index.search(
        namespace="sql-namespace",
        query={
            "top_k": top_k,
            "inputs": {
                "text": combined_text
            }
        },
        rerank={
            "model": "bge-reranker-v2-m3",
            "top_n": top_k,
            "rank_fields": ["chunk_text"]
        }
    )

    if response and "result" in response and "hits" in response["result"]:
        hits = response["result"]["hits"]

        if not hits:
            return None

        best_hit = max(hits, key=lambda x: x["_score"])
        best_sql = best_hit["fields"]["sql"]
        best_score = best_hit["_score"]

        if best_score < 0.90:
            print(best_score)
            return None

        print(f"Найден лучший SQL (score: {best_score}) → {best_sql}")
        return best_sql

    return None


async def add_message_to_chat_history(token: str, db_id: int, data: ChatRequest, sender: str) -> Chat | None:
    try:
        user_model: UserOrm = await user_service.verify_token(token)
        async with new_session() as session:
            chat_dict = data.model_dump()
            message_orm = ChatHistoryOrm(**chat_dict, sender=sender, database_id=db_id)
            session.add(message_orm)
            await session.flush()
            await session.commit()
            message = Chat.from_orm(message_orm)
            return message
    except AttributeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Some parameters do not exist")


async def sql_generation(chat: ChatRequest, db_name: str, token: str) -> dict:
    if not chat.content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request can not be empty!")

    db_id = await db_service.get_db_id_if_exists(token, db_name)
    if not db_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found!")

    result = {}
    tables = await table_service.get_all_tables_from_db(db_name, token, None, None, None)
    for table in tables:
        columns = await column_service.get_all_columns_from_table(token, db_name, table.table_name, None, None, None)
        result[table.table_name] = [{column.column_name: column.column_type} for column in columns]

    schema = {"tables": result}

    similar_sql = await find_sql_in_pinecone(chat.content, schema)
    if similar_sql:
        print("Используем кешированный SQL")
        await add_message_to_chat_history(token, db_id, ChatRequest(content=chat.content), sender="user")
        await add_message_to_chat_history(token, db_id, ChatRequest(content=similar_sql), sender="system")
        return {"sql": similar_sql, "schema": result}

    client = Client(provider=Provider)
    prompt = f"""
    Convert the following task description into a valid SQL query.

    Task: {chat.content}

    Schema details:
    {schema}

    Instructions:
    1. Read the task description carefully.
    2. Identify the relevant tables and columns.
    3. Create an SQL query matching the schema structure.
    4. **Return only raw SQL code** with no additional text.
    5. **Do not use any HTML entities or encoding. Use only plain text characters.**
    6. Write SQL **on one line** without line breaks.
    7. Ensure the query is syntactically correct.
    8. Simplify as much as possible
    """
    sql_query = None

    for attempt in range(1, 4):
        print(f" Попытка {attempt}: Генерация SQL запроса...")

        response = await asyncio.to_thread(
            client.chat.completions.create,
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        sql_query = html.unescape(response.choices[0].message.content.strip())

        is_valid = all(await asyncio.gather(
            validate_sql_syntax(sql_query, "sqlite"),
            validate_sql_syntax(sql_query, "mysql"),
            validate_sql_syntax(sql_query, "postgres"),
            validate_sql_syntax(sql_query, "duckdb")
        ))

        if is_valid:
            print(f"SQL валиден на {attempt}-й попытке.")
            break

        print(f"Попытка {attempt} не удалась. Пробуем снова...")
        sql_query = None

    if sql_query is None:
        raise HTTPException(status_code=500, detail="Failed to generate a valid SQL query after multiple attempts")

    await save_sql_to_pinecone(chat.content, sql_query, schema)
    await add_message_to_chat_history(token, db_id, ChatRequest(content=chat.content), sender="user")
    await add_message_to_chat_history(token, db_id, ChatRequest(content=sql_query), sender="system")

    return {"sql": sql_query, "schema": result}


async def get_chat_history(db_name, page, page_size, skip, token) -> list[Chat] | None:
        user_model: UserOrm = await user_service.verify_token(token)
        user_id = user_model.id
        if not await db_service.get_db_id_if_exists(token, db_name):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database not found!")

        async with new_session() as session:
            query = select(ChatHistoryOrm).join(DatabaseOrm).where(
                DatabaseOrm.db_name == db_name,
                DatabaseOrm.user_id == user_id
            ).order_by(ChatHistoryOrm.created_at)

            if page is not None and page_size is not None:
                offset = (page - 1) * page_size
                query = query.offset(offset).limit(page_size)
            elif skip is not None:
                query = query.offset(skip)

            result = await session.execute(query)
            chat_models = result.scalars().all()
            return [Chat.from_orm(chat_model) for chat_model in chat_models]


async def clear_chat_history(token: str, db_name: str) -> dict:
    db_id = await db_service.get_db_id_if_exists(token, db_name)
    if not db_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Non-existent Database")

    async with new_session() as session:
        await session.execute(
            delete(ChatHistoryOrm).where(ChatHistoryOrm.database_id == db_id)
        )
        await session.commit()

    return {"detail": "Chat history cleared successfully"}
