from rest_framework import generics, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db import models
from django.contrib.auth import get_user_model
from pharmacy.models import Pharmacy, PharmacyDocument
from pharmacy.serializers import PharmacyProfileSerializer, PharmacyDocumentSerializer
from .permissions import IsAdminUser

CustomUser = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'name', 'phone_number', 'role', 'is_active', 'date_joined']


# ─── Custom Pagination ─────────────────────────────────────────────────────────
class AdminPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'status': 'success',
            'message': 'Data retrieved successfully',
            'data': {
                'results': data,
                'pagination': {
                    'count': self.page.paginator.count,
                    'total_pages': self.page.paginator.num_pages,
                    'current_page': self.page.number,
                    'page_size': self.get_page_size(self.request),
                    'next': self.get_next_link(),
                    'previous': self.get_previous_link(),
                }
            }
        })


# ─── List all pharmacies with pagination ───────────────────────────────────────
class AdminPharmacyListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = Pharmacy.objects.all().order_by('-created_at')
    serializer_class = PharmacyProfileSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(document__status=status_filter.upper())
        
        # Search by name or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(user__name__icontains=search)
            )
        
        return queryset


# ─── Retrieve pharmacy details ────────────────────────────────────────────────
class AdminPharmacyDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminUser]
    queryset = Pharmacy.objects.all()
    serializer_class = PharmacyProfileSerializer
    lookup_field = 'id'


# ─── List pharmacy documents with pagination ──────────────────────────────────
class AdminPharmacyDocumentsView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PharmacyDocumentSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        queryset = PharmacyDocument.objects.all().order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        # Build custom response with pharmacy info
        results = []
        for doc in (page if page is not None else queryset):
            pharmacy = doc.pharmacy
            results.append({
                'id': doc.id,
                'pharmacy_id': pharmacy.id,
                'pharmacy_name': pharmacy.name or pharmacy.user.name,
                'email': pharmacy.user.email,
                'phone_number': pharmacy.phone_number or pharmacy.user.phone_number,
                'document_url': request.build_absolute_uri(doc.document.url) if doc.document else None,
                'status': doc.status,
                'is_active': doc.is_active,
                'created_at': doc.created_at,
                'updated_at': doc.updated_at,
            })
        
        if page is not None:
            return self.get_paginated_response(results)
        
        return Response({
            'status': 'success',
            'message': 'Data retrieved successfully',
            'data': results
        })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_kyc_action(request, pharmacy_id):
    """
    Admin approves or rejects a pharmacy KYC.
    Payload:
      - action: "APPROVE" or "REJECT"
      - message: optional reason (required only for REJECT)
    """
    try:
        pharmacy = Pharmacy.objects.get(id=pharmacy_id)
        pharmacy_doc, _ = PharmacyDocument.objects.get_or_create(pharmacy=pharmacy)
    except Pharmacy.DoesNotExist:
        return Response({"status": "error", "message": "Pharmacy not found"}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action', '').upper()
    message = request.data.get('message', '').strip()  # optional but required for rejection

    if action not in ['APPROVE', 'REJECT']:
        return Response({"status": "error", "message": "Invalid action. Use 'APPROVE' or 'REJECT'."}, status=status.HTTP_400_BAD_REQUEST)

    if action == 'APPROVE':
        pharmacy_doc.status = 'APPROVED'
        pharmacy_doc.is_active = True
        pharmacy.user.is_active = True
        pharmacy_doc.save()
        pharmacy.user.save()
    else:
        if not message:
            return Response({"status": "error", "message": "Rejection requires a message explaining the reason."}, status=status.HTTP_400_BAD_REQUEST)
        pharmacy_doc.status = 'REJECTED'
        pharmacy_doc.is_active = False
        pharmacy.user.is_active = False
        pharmacy_doc.save()
        pharmacy.user.save()

    return Response({
        "status": "success",
        "message": f"Pharmacy KYC {action.lower()}d successfully",
        "data": {
            "pharmacy_id": pharmacy.id,
            "pharmacy_name": pharmacy.name or pharmacy.user.name,
            "status": pharmacy_doc.status,
            "is_active": pharmacy_doc.is_active
        }
    })


# ─── List all users ───────────────────────────────────────────────────────────
class AdminUsersListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        queryset = CustomUser.objects.all().order_by('-date_joined')

        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role.upper())

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(name__icontains=search)
            )

        return queryset