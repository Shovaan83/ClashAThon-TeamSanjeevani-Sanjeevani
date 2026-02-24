
from celery import shared_task
from utils.email import send_email

@shared_task
def send_email_task(to, subject, body):
    send_email(to, subject, body)