from fastapi import Request, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from service import user as user_service
import jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        public_paths = ["/user/login", "/user/register", "/docs", "/openapi.json"]

        if request.method == "OPTIONS" or request.url.path in public_paths:
            return await call_next(request)

        try:
            token = await oauth2_scheme(request)
            user = await user_service.verify_token(token)

            if user is None:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid Token..."}
                )
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token has expired"},
            )
        except HTTPException:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid Token..."}
            )

        response = await call_next(request)
        return response
