"""
JWT Authentication middleware for Django Channels WebSocket connections
"""
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from accounts.models import CustomUser
from urllib.parse import parse_qs


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens
    Token can be passed as query parameter: ws://localhost:8000/ws/customer/?token=<jwt_token>
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        
        if token:
            try:
                # Validate token and get user
                access_token = AccessToken(token)
                user = await self.get_user_from_token(access_token)
                scope['user'] = user
            except (InvalidToken, TokenError):
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, access_token):
        """Get user from validated JWT token"""
        try:
            user_id = access_token['user_id']
            return CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return AnonymousUser()


def JWTAuthMiddlewareStack(inner):
    """Helper function to wrap with JWT auth middleware"""
    return JWTAuthMiddleware(inner)
