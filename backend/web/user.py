from fastapi import APIRouter, status, HTTPException, security, Depends

from model.user import LoginRequest, User, Password

from service import user as user_service

router = APIRouter(prefix="/user", tags=["User"])

oauth2schema = security.OAuth2PasswordBearer(tokenUrl="user/login")


@router.post("/login")
async def login(user: LoginRequest) -> dict:
    token = await user_service.login(user)
    return token


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: LoginRequest) -> User:
    user_data = await user_service.register(user)
    return user_data


@router.delete("/delete", status_code=status.HTTP_200_OK)
async def delete(password: Password, token: str = Depends(oauth2schema)) -> dict:
    result = await user_service.delete(password, token)
    return result


@router.get("/me", status_code=status.HTTP_200_OK)
async def me(token: str = Depends(oauth2schema)) -> dict:
    result = await user_service.checkme(token)
    return result
