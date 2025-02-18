import asyncio

from model.request import Chat
from service import table as table_service
from service import column as column_service
from service import database as db_service
from g4f.client import Client
from fastapi import HTTPException, status
import g4f.Provider.Ai4Chat as Provider
import html


async def sql_generation(chat: Chat, db_name: str, token: str) -> dict | None:
    if not await db_service.db_exists(token, db_name):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This database doesn't exist")
    result: dict = {}
    tables = await table_service.get_all_tables_from_db(db_name, token, None, None, None)
    for table in tables:
        columns = await column_service.get_all_columns_from_table(token, db_name, table.table_name, None, None, None)
        result[table.table_name] = [{column.column_name: column.column_type}
                                    for column in columns
                                    ]
    schema = {
        "tables": result
    }

    client = Client(provider=Provider)
    prompt = f"""
    Convert the following task description into a valid SQL query.

    Task: {chat.request}

    Schema details:
    {schema}

    Instructions:
    1. Read the task description carefully.
    2. Identify the relevant tables and columns.
    3. Create an SQL query matching the schema structure.
    4. **Return only raw SQL code** with no additional text.
    5. **Do not use any HTML entities or encoding. Use only plain text characters.**
    6. Write SQL **on one line** without line breaks.
    """
    response = await asyncio.to_thread(
        client.chat.completions.create,
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    response_text = html.unescape(response.choices[0].message.content.strip())
    return {"response": response_text,
            "schema": result
            }
