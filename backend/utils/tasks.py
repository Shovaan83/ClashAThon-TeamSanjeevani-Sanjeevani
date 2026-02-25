from celery import shared_task
from utils.email import send_email
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_email_task(self, to, subject, body):
    """
    Celery task to send email asynchronously with retry support.
    
    Args:
        to (str): Recipient email address
        subject (str): Email subject
        body (str): Email body content
    """
    try:
        logger.info(f"Attempting to send email to {to}")
        send_email(to, subject, body)
        logger.info(f"Email sent successfully to {to}")
        return {"status": "success", "to": to}
    except Exception as exc:
        logger.error(f"Failed to send email to {to}: {str(exc)}")
        # Retry the task if it fails
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for email to {to}")
            return {"status": "failed", "to": to, "error": str(exc)}