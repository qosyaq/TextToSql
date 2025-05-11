from fastapi import APIRouter, Depends, status, Query
from fastapi.security import OAuth2PasswordBearer
from service import chat
from model.chat import Chat, ChatRequest
from typing import Optional

router = APIRouter(prefix="/database", tags=["chat"])

oauth2schema = OAuth2PasswordBearer(tokenUrl="user/login")


@router.post("/{db_name}/chat")
async def convert_request(chat_request: ChatRequest, db_name: str, token: str = Depends(oauth2schema)) -> dict:
    result = await chat.sql_generation(chat_request, db_name, token)
    return result


@router.get("/{db_name}/chat")
async def chat_history(
    db_name: str,
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, gt=0, le=100),
    skip: Optional[int] = Query(None, ge=0),
    token: str = Depends(oauth2schema),
) -> list[Chat] | None:
    return await chat.get_chat_history(db_name, page, page_size, skip, token)


@router.delete("/{db_name}/chat")
async def clear_chat_history(db_name: str, token: str = Depends(oauth2schema)) -> dict:
    result = await chat.clear_chat_history(token, db_name)
    return result
