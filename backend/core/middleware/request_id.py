import uuid
from contextvars import ContextVar
from typing import Optional

from django.utils.deprecation import MiddlewareMixin

# Global context for audit-related request metadata
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")
ip_address_ctx: ContextVar[str] = ContextVar("ip_address", default="")
user_agent_ctx: ContextVar[str] = ContextVar("user_agent", default="")


def get_client_ip(request) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip or ""


class RequestIdMiddleware(MiddlewareMixin):
    """
    Captures request/correlation IDs and client metadata into context variables.
    Enables service-layer auditing without passing the request object everywhere.
    """
    
    request_id_header = "HTTP_X_REQUEST_ID"
    correlation_id_header = "HTTP_X_CORRELATION_ID"

    def process_request(self, request):
        # Request ID: unique per HTTP call
        rid = request.META.get(self.request_id_header) or str(uuid.uuid4())
        request.request_id = rid
        request_id_ctx.set(rid)
        
        # Correlation ID: persistent across multiple service calls/retries
        cid = request.META.get(self.correlation_id_header) or rid
        request.correlation_id = cid
        correlation_id_ctx.set(cid)
        
        # Client metadata
        ip = get_client_ip(request)
        ip_address_ctx.set(ip)
        
        ua = request.META.get("HTTP_USER_AGENT", "")
        user_agent_ctx.set(ua)

    def process_response(self, request, response):
        rid = getattr(request, "request_id", "") or request_id_ctx.get("")
        if rid:
            response["X-Request-ID"] = rid
            
        cid = getattr(request, "correlation_id", "") or correlation_id_ctx.get("")
        if cid:
            response["X-Correlation-ID"] = cid
            
        # Clear context to prevent leakage across threads (if reuse occurs)
        request_id_ctx.set("")
        correlation_id_ctx.set("")
        ip_address_ctx.set("")
        user_agent_ctx.set("")

        return response
