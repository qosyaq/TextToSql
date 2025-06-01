from datetime import datetime, timedelta
from sqlalchemy import select, delete
from data.config import new_session, UserOrm, EmailVerificationTokenOrm
from model.user import LoginRequest, User, Password
import bcrypt
import jwt
import os
from fastapi import HTTPException, status
import secrets
from tools.email import send_email
import httpx

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
FRONTEND_URL = os.getenv("FRONTEND_URL") or "http://localhost:5173"

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

MS_AUTH_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize"
MS_TOKEN_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token"
MS_USERINFO_URL = "https://graph.microsoft.com/v1.0/me"

MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")
MICROSOFT_REDIRECT_URI = os.getenv("MICROSOFT_REDIRECT_URI")


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


async def create_email_verification_token(user_id: int) -> str:
    code = f"{secrets.randbelow(10**6):06d}"
    expires_at = datetime.utcnow() + timedelta(hours=1)

    async with new_session() as session:
        await session.execute(
            delete(EmailVerificationTokenOrm).where(EmailVerificationTokenOrm.user_id == user_id)
        )
        token_obj = EmailVerificationTokenOrm(
            user_id=user_id,
            token=code,
            expires_at=expires_at
        )
        session.add(token_obj)
        await session.commit()

    return code


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
    await is_email_exists(data)

    async with new_session() as session:
        user_dict = {
            "email": data.email,
            "hashed_password": hash_password(data.password)
        }

        user = UserOrm(**user_dict)
        session.add(user)
        await session.flush()
        await session.commit()

        await session.refresh(user)
        code = await create_email_verification_token(user.id)
        verify_url = f"{FRONTEND_URL}/user/verify-email?email={data.email}"
        body = (
            f"Добро пожаловать! Вот ваш 6-значный код для подтверждения почты: {code}\n\n"
            f"Введите его на странице подтверждения: {verify_url}\n"
            f"(Код действителен 1 час)"
        )
        await send_email(
            to_email=data.email,
            subject="Подтверждение Email",
            body=body
        )
        user = User.from_orm(user)
        return user


async def find_user(user: LoginRequest) -> bool:
    async with new_session() as session:
        query = select(UserOrm).where(UserOrm.email == user.email)
        result = await session.execute(query)
        user_model = result.scalars().first()
        if user_model is None:
            return False
        if not user_model.is_verified:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")
        user_data = User.from_orm(user_model)
        return bcrypt.checkpw(user.password.encode('utf-8'), user_data.hashed_password.encode('utf-8'))


async def is_email_exists(user: LoginRequest):
    async with new_session() as session:
        query = select(UserOrm).where(UserOrm.email == user.email)
        result = await session.execute(query)
        user_model: UserOrm = result.scalars().first()

        if user_model and not user_model.is_verified:
            await session.execute(
                delete(EmailVerificationTokenOrm).where(EmailVerificationTokenOrm.user_id == user_model.id)
            )
            await session.execute(
                delete(UserOrm).where(UserOrm.id == user_model.id)
            )
            await session.commit()
        elif user_model:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already in use"
            )


async def login(data: LoginRequest) -> dict | None:
    if not await find_user(data):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_jwt_token({"sub": data.email})

    return {"token": token, "token_type": "bearer"}


async def delete_account(password: Password, token: str) -> dict:
    user_model = await verify_token(token)
    if not user_model.is_oauth:
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
        "is_verified": user_model.is_verified,
        "is_oauth": user_model.is_oauth,
        "auth_provider": user_model.oauth_provider
    }


async def verify_email_code(email: str, code: str) -> None:
    if not email or not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Отсутствуют email или код")

    async with new_session() as session:
        query_user = select(UserOrm).where(UserOrm.email == email)
        user_res = await session.execute(query_user)
        user_obj: UserOrm | None = user_res.scalars().first()

        if not user_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

        query_token = select(EmailVerificationTokenOrm).where(
            EmailVerificationTokenOrm.user_id == user_obj.id,
            EmailVerificationTokenOrm.token == code
        )
        token_res = await session.execute(query_token)
        token_obj: EmailVerificationTokenOrm | None = token_res.scalars().first()

        if not token_obj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный код")

        if token_obj.expires_at < datetime.utcnow():
            await session.delete(token_obj)
            await session.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Код просрочен")

        user_obj.is_verified = True
        await session.delete(token_obj)
        await session.commit()


async def resend_verification_code(email: str) -> None:
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Отсутствует email")
    async with new_session() as session:
        query_user = select(UserOrm).where(UserOrm.email == email)
        res_user = await session.execute(query_user)
        user_obj: UserOrm | None = res_user.scalars().first()

        if not user_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

        if user_obj.is_verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email уже подтверждён")

        new_code = await create_email_verification_token(user_obj.id)
        verify_url = f"{FRONTEND_URL}/user/verify-email?email={email}"
        body = (
            f"Ваш код подтверждения email: {new_code}\n\n"
            f"Введите его на странице подтверждения: {verify_url}\n"
            f"(Он действителен 1 час)"
        )

        await send_email(
            to_email=email,
            subject="Подтвердите ваш Email",
            body=body
        )


async def oauth_login(provider: str, oauth_token: str) -> dict:

    email: str | None = None

    async with httpx.AsyncClient(timeout=10) as client:
        if provider == "google":
            token_resp = await client.post(
                GOOGLE_TOKEN_URL,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "code": oauth_token,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            if token_resp.status_code != 200:
                raise HTTPException(401, f"Google token exchange failed: {token_resp.text}")

            access_token = token_resp.json().get("access_token")

            user_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if user_resp.status_code != 200:
                raise HTTPException(401, f"Invalid Google access token: {user_resp.text}")

            email = user_resp.json()["email"]
        elif provider == "microsoft":
            token_resp = await client.post(
                MS_TOKEN_URL,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_id": MICROSOFT_CLIENT_ID,
                    "client_secret": MICROSOFT_CLIENT_SECRET,
                    "code": oauth_token,
                    "redirect_uri": MICROSOFT_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            if token_resp.status_code != 200:
                raise HTTPException(401, f"Microsoft token exchange failed: {token_resp.text}")

            access_token = token_resp.json().get("access_token")

            user_resp = await client.get(
                MS_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if user_resp.status_code != 200:
                raise HTTPException(401, f"Invalid Microsoft access token: {user_resp.text}")

            info = user_resp.json()
            email = info.get("mail") or info.get("userPrincipalName")

    if not email:
        raise HTTPException(400, "Could not retrieve email")

    async with new_session() as session:
        result = await session.execute(select(UserOrm).where(UserOrm.email == email))
        user = result.scalars().first()

        if not user:
            user = UserOrm(
                email=email,
                is_verified=True,
                is_oauth=True,
                oauth_provider=provider,
            )
            session.add(user)
            await session.commit()

        token = create_jwt_token({"sub": email})
        return {"token": token, "token_type": "bearer"}
