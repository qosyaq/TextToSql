from datetime import datetime, timedelta
from sqlalchemy import select
from data.config import new_session, UserOrm
from model.user import LoginRequest, User, Password
import bcrypt
import jwt
import os
from fastapi import HTTPException, status

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')


def create_jwt_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=12)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def verify_token(token: str) -> UserOrm | None:
    try:
        async with new_session() as session:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if email is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token.")
            query = select(UserOrm).where(UserOrm.email == email)
            result = await session.execute(query)
            user_model = result.scalars().first()
            if user_model is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token.")
            return user_model
    except jwt.exceptions.DecodeError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token.")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")


async def register(data: LoginRequest) -> User:
    if await is_email_exists(data):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already in use"
        )
    async with new_session() as session:
        user_dict = {
            "email": data.email,
            "hashed_password": hash_password(data.password)
        }

        user = UserOrm(**user_dict)
        session.add(user)
        await session.flush()
        await session.commit()
        user = User.from_orm(user)
        return user


async def find_user(user: LoginRequest) -> bool:
    async with new_session() as session:
        query = select(UserOrm).where(UserOrm.email == user.email)
        result = await session.execute(query)
        user_model = result.scalars().first()
        if user_model is None:
            return False
        user_data = User.from_orm(user_model)
        return bcrypt.checkpw(user.password.encode('utf-8'), user_data.hashed_password.encode('utf-8'))


async def is_email_exists(user: LoginRequest) -> bool:
    async with new_session() as session:
        query = select(UserOrm).where(UserOrm.email == user.email)
        result = await session.execute(query)
        user_model = result.scalars().first()
        if user_model is None:
            return False
        return True


async def login(data: LoginRequest) -> dict | None:
    if not await find_user(data):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_jwt_token({"sub": data.email})
    return {"token": token, "token_type": "bearer"}


async def delete(password: Password, token: str) -> dict:
    user_model = await verify_token(token)
    if not bcrypt.checkpw(password.password.encode('utf-8'), user_model.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Incorrect password. Account deletion failed.")
    async with new_session() as session:
        await session.delete(user_model)
        await session.flush()
        await session.commit()
        return {"detail": "Your account has been deleted successfully."}


async def checkme(token):
    user_model = await verify_token(token)
    return {"detail": f"Hello! {user_model.email}"}


async def get_profile(token: str) -> dict:
    user_model: UserOrm = await verify_token(token)
    return {
        "id": user_model.id,
        "email": user_model.email,
        "created_at": user_model.created_at,
    }

