from rest_framework.response import Response
from rest_framework import status


class ResponseMixin:
    def success_response(self, data=None, message="Success", status_code=status.HTTP_200_OK):
        return Response({
            "status": "success",
            "message": message,
            "data": data,
        }, status=status_code)

    def error_response(self, error=None, message="Error occurred", status_code=status.HTTP_400_BAD_REQUEST):
        return Response({
            "status": "error",
            "message": message,
            "error": error,
        }, status=status_code)

    def not_found_response(self, message="Resource not found"):
        return self.error_response(
            message=message,
            error="not_found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    def unauthorized_response(self, message="Unauthorized"):
        return self.error_response(
            message=message,
            error="unauthorized",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    def forbidden_response(self, message="Forbidden"):
        return self.error_response(
            message=message,
            error="forbidden",
            status_code=status.HTTP_403_FORBIDDEN
        )

    def validation_error_response(self, errors="", message="Validation failed"):
        return self.error_response(
            message=message,
            error=errors,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    def server_error_response(self, message="Internal server error"):
        return self.error_response(
            message=message,
            error="internal_server_error",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )