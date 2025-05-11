import uvicorn
from fastapi import FastAPI, Response
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from data.config import create_tables, delete_tables
from web import user, database, table, column, chat
from tools.middleware import AuthMiddleware
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # await delete_tables()
    # print("Database is empty")
    await create_tables()
    print("Database is ready")
    yield
    print("Shutdown")


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(AuthMiddleware)
app.include_router(user.router)
app.include_router(database.router)
app.include_router(table.router)
app.include_router(column.router)
app.include_router(chat.router)
if __name__ == '__main__':
    uvicorn.run("main:app", reload=True)
