"""
FCM push notification helpers for medicine broadcasting events.

Sends push notifications alongside WebSocket messages so that users
receive alerts even when the app is killed or in the background.

Uses the DeviceToken model from DailyRemainder to look up registered
device tokens, and utils/firebase.py to actually send the push.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def _get_user_tokens(user) -> list[str]:
    """Return all active FCM tokens for a user."""
    from DailyRemainder.models import DeviceToken
    return list(
        DeviceToken.objects.filter(user=user, is_active=True)
        .values_list('token', flat=True)
    )


def _deactivate_tokens(tokens: list[str]) -> None:
    """Mark stale tokens as inactive so we stop sending to them."""
    if not tokens:
        return
    from DailyRemainder.models import DeviceToken
    DeviceToken.objects.filter(token__in=tokens).update(is_active=False)
    logger.info("Deactivated %d stale FCM tokens", len(tokens))


def _safe_send_multicast(
    tokens: list[str],
    title: str,
    body: str,
    data: dict | None = None,
) -> None:
    """
    Best-effort multicast push.  Never raises — errors are logged.
    Automatically deactivates any unregistered tokens.
    """
    if not tokens:
        return

    try:
        from utils.firebase import send_multicast_notification, is_firebase_available
    except ImportError:
        logger.warning("Firebase module not available — skipping push")
        return

    if not is_firebase_available():
        logger.info("Firebase not initialized — skipping push")
        return

    try:
        result = send_multicast_notification(
            tokens=tokens, title=title, body=body, data=data,
        )
        _deactivate_tokens(result.get('failed_tokens', []))
    except Exception as e:
        logger.error("FCM multicast error: %s", e)


# ─── Public helpers called from views.py ─────────────────────────────────────

def notify_pharmacies_new_request(
    nearby_pharmacies: list[dict],
    request_id: int,
    patient_name: str,
    quantity: int,
) -> None:
    """
    Push 'new_request' to every nearby pharmacy's registered devices.
    Called from MedicineRequestApiView.post() after the WebSocket broadcast.
    """
    for item in nearby_pharmacies:
        pharmacy = item['pharmacy']
        distance = item['distance']
        user = pharmacy.user
        tokens = _get_user_tokens(user)
        if not tokens:
            continue

        _safe_send_multicast(
            tokens=tokens,
            title="New Medicine Request",
            body=f"{patient_name} needs medicine — {distance:.1f} km away (Qty: {quantity})",
            data={
                'type': 'new_request',
                'request_id': str(request_id),
                'patient_name': patient_name,
                'distance_km': str(round(distance, 2)),
            },
        )


def notify_patient_pharmacy_response(
    patient_user,
    request_id: int,
    pharmacy_name: str,
    response_type: str,
    response_id: int,
    audio_url: str | None = None,
) -> None:
    """
    Push 'pharmacy_response' to the patient's devices.
    Called from PharmacyResponseApiView.post() after the WebSocket send.
    """
    tokens = _get_user_tokens(patient_user)
    if not tokens:
        return

    if response_type == 'ACCEPTED':
        title = "Pharmacy Offer Received"
        body = f"{pharmacy_name} has offered to fulfil your prescription."
    else:
        title = "Pharmacy Declined"
        body = f"{pharmacy_name} has declined your request."

    _safe_send_multicast(
        tokens=tokens,
        title=title,
        body=body,
        data={
            'type': 'pharmacy_response',
            'request_id': str(request_id),
            'response_id': str(response_id),
            'pharmacy_name': pharmacy_name,
            'response_type': response_type,
            'audio_url': audio_url or '',
        },
    )


def notify_pharmacy_selected(
    pharmacy_user,
    request_id: int,
    patient_name: str,
) -> None:
    """
    Push 'pharmacy_selected' to the chosen pharmacy's devices.
    Called from PatientSelectPharmacyView.post().
    """
    tokens = _get_user_tokens(pharmacy_user)
    if not tokens:
        return

    _safe_send_multicast(
        tokens=tokens,
        title="You were selected!",
        body=f"{patient_name} chose your pharmacy. Please prepare the medicine!",
        data={
            'type': 'pharmacy_selected',
            'request_id': str(request_id),
            'patient_name': patient_name,
        },
    )


def notify_pharmacies_request_taken(
    nearby_pharmacies: list[dict],
    selected_pharmacy_id: int,
    request_id: int,
) -> None:
    """
    Push 'request_taken' to other nearby pharmacies when a patient selects one.
    Called from PatientSelectPharmacyView.post().
    """
    for item in nearby_pharmacies:
        pharmacy = item['pharmacy']
        if pharmacy.id == selected_pharmacy_id:
            continue
        user = pharmacy.user
        tokens = _get_user_tokens(user)
        if not tokens:
            continue

        _safe_send_multicast(
            tokens=tokens,
            title="Request Filled",
            body="This medicine request has been accepted by another pharmacy.",
            data={
                'type': 'request_taken',
                'request_id': str(request_id),
            },
        )
