from sqlalchemy import ForeignKey, UniqueConstraint, DateTime, func, Text, String, Boolean
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import Mapped, mapped_column, declarative_base, relationship

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL)
new_session = async_sessionmaker(engine, expire_on_commit=False)

Base = declarative_base()


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def delete_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


class ColumnOrm(Base):
    __tablename__ = 'columns'
    __table_args__ = (
        UniqueConstraint('table_id', 'column_name', name='unique_database_table_column_name'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    table_id: Mapped[int] = mapped_column(ForeignKey('tables.id', ondelete='CASCADE'), nullable=False)
    column_name: Mapped[str]
    column_type: Mapped[str | None]
    table: Mapped['TableOrm'] = relationship('TableOrm', back_populates='columns')


class TableOrm(Base):
    __tablename__ = 'tables'
    __table_args__ = (
        UniqueConstraint('database_id', 'table_name', name='unique_database_table_name'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    database_id: Mapped[int] = mapped_column(ForeignKey('databases.id', ondelete='CASCADE'), nullable=False)
    table_name: Mapped[str]
    columns: Mapped[list[ColumnOrm] | None] = relationship('ColumnOrm', back_populates='table', cascade="all, delete")
    database: Mapped['DatabaseOrm'] = relationship('DatabaseOrm', back_populates='tables')


class DatabaseOrm(Base):
    __tablename__ = 'databases'
    __table_args__ = (
        UniqueConstraint('user_id', 'db_name', name='unique_database_name'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    db_name: Mapped[str]
    db_type: Mapped[str] = mapped_column(String(20), nullable=False)
    tables: Mapped[list[TableOrm] | None] = relationship('TableOrm', back_populates='database', cascade="all, delete")
    user: Mapped['UserOrm'] = relationship('UserOrm', back_populates='databases')
    chat_history: Mapped[list['ChatHistoryOrm']] = relationship('ChatHistoryOrm', back_populates='database',
                                                                cascade="all, delete")


class UserOrm(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_oauth: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now())

    databases: Mapped[list[DatabaseOrm] | None] = relationship('DatabaseOrm', back_populates='user',
                                                               cascade="all, delete")


class EmailVerificationTokenOrm(Base):
    __tablename__ = "email_verification_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    token: Mapped[str] = mapped_column(String(6), unique=True, nullable=False)
    expires_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now())

    user: Mapped["UserOrm"] = relationship("UserOrm", backref="verification_tokens")


class ChatHistoryOrm(Base):
    __tablename__ = "chat_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    database_id: Mapped[int] = mapped_column(ForeignKey('databases.id', ondelete='CASCADE'), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sender: Mapped[str] = mapped_column(default='user')
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now())
    database: Mapped['DatabaseOrm'] = relationship('DatabaseOrm', back_populates='chat_history')
