import os
from celery import Celery
from celery.signals import worker_ready

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
# Explicitly include DailyRemainder to guarantee its tasks.py is found
# (the capitalised app name can trip up autodiscovery on some platforms).
app.autodiscover_tasks(['DailyRemainder', 'fomo', 'utils'])


@worker_ready.connect
def init_firebase_on_worker_start(**kwargs):
    """Ensure Firebase Admin SDK is initialised inside every Celery worker."""
    try:
        from utils.firebase import initialize_firebase, is_firebase_available
        if not is_firebase_available():
            initialize_firebase()
    except Exception as exc:
        print(f"[celery] Firebase init on worker start failed: {exc}")


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')