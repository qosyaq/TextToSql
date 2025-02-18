from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordBearer
from service import request
from model.request import Chat

router = APIRouter(prefix="/database", tags=["chat"])

oauth2schema = OAuth2PasswordBearer(tokenUrl="user/login")


@router.post("/{db_name}/chat")
async def convert_request(chat_request: Chat, db_name: str, token: str = Depends(oauth2schema)) -> dict:
    result = await request.sql_generation(chat_request, db_name, token)
    return result
