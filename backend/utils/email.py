from django.http import HttpResponse
from django.shortcuts import render
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
import logging
import socket

logger = logging.getLogger(__name__)


def send_email(to, subject, body, timeout=30):
    """
    Send an HTML email with dynamic subject and message.

    Args:
        to (str): Recipient email address
        subject (str): Subject of the email
        body (str): Message content (HTML allowed)
        timeout (int): Socket timeout in seconds (default 30)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    
    Raises:
        Exception: If email sending fails
    """
    # Set socket timeout to prevent hanging
    original_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(timeout)
    
    try:
        # HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{subject}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    background-color: #f6f9fc;
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: #fff;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                    padding: 30px;
                }}
                .footer {{
                    margin-top: 20px;
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                {body}
                <div class="footer">
                    &copy; 2025 Sanjeevani. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text fallback
        text_content = body

        # Determine from_email: prefer EMAIL_HOST_USER, fallback to DEFAULT_FROM_EMAIL if available
        from_email = getattr(settings, "EMAIL_HOST_USER", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None)
        
        if not from_email:
            logger.error("No EMAIL_HOST_USER or DEFAULT_FROM_EMAIL configured in settings")
            raise ValueError("Email configuration error: No sender email configured")

        # Create email object
        email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to]
        )

        email_message.attach_alternative(html_content, "text/html")
        email_message.send(fail_silently=False)
        logger.info(f"Email sent successfully to {to}")
        return True
        
    except socket.timeout as e:
        logger.error(f"Email sending timed out after {timeout} seconds: {e}")
        raise Exception(f"Email sending timed out. Please try again later.")
    except socket.gaierror as e:
        logger.error(f"Network error while sending email: {e}")
        raise Exception(f"Network error: Unable to connect to email server. Please check your internet connection.")
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {str(e)}")
        raise Exception(f"Failed to send email: {str(e)}")
    finally:
        # Restore original timeout
        socket.setdefaulttimeout(original_timeout)
