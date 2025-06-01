import smtplib
from email.message import EmailMessage
import os

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM")


async def send_email(to_email: str, subject: str, body: str) -> None:
    if not (SMTP_HOST and SMTP_PORT and SMTP_USERNAME and SMTP_PASSWORD and EMAIL_FROM):
        raise RuntimeError("Не настроены SMTP-параметры в .env")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        smtp.send_message(msg)
