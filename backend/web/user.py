from fastapi import APIRouter, status, security, Depends

from model.user import LoginRequest, User, Password, VerifyEmailRequest, ResendVerificationRequest, OAuthRequest

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


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(payload: VerifyEmailRequest):
    await user_service.verify_email_code(email=payload.email, code=payload.code)
    return {"status": "ok", "detail": "Email успешно подтверждён"}


@router.post("/resend-verification")
async def resend_verification(payload: ResendVerificationRequest) -> dict:
    await user_service.resend_verification_code(email=payload.email)
    return {"status": "ok", "detail": "Новый код отправлен на вашу почту"}


@router.post("/oauth/google")
async def google_login(payload: OAuthRequest):
    return await user_service.oauth_login("google", payload.oauth_token)


@router.post("/oauth/microsoft")
async def microsoft_login(payload: OAuthRequest):
    return await user_service.oauth_login("microsoft", payload.oauth_token)


@router.delete("/delete", status_code=status.HTTP_200_OK)
async def delete(password: Password, token: str = Depends(oauth2schema)) -> dict:
    result = await user_service.delete_account(password, token)
    return result


@router.get("/me", status_code=status.HTTP_200_OK)
async def me(token: str = Depends(oauth2schema)) -> dict:
    result = await user_service.checkme(token)
    return result


@router.get("/profile", status_code=status.HTTP_200_OK)
async def get_profile(token: str = Depends(oauth2schema)) -> dict:
    profile = await user_service.get_profile(token)
    return profile
