import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
# Explicitly include DailyRemainder to guarantee its tasks.py is found
# (the capitalised app name can trip up autodiscovery on some platforms).
app.autodiscover_tasks(['DailyRemainder', 'utils'])


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')