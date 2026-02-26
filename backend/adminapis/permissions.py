from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to users with role ADMIN.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"