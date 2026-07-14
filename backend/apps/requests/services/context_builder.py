from typing import Protocol, List
from apps.requests.models import Request, Assignment, Quote
from apps.requests.domain.context import RequestContext

class ContextProvider(Protocol):
    def build(self, request: Request, context: RequestContext) -> None:
        """Injects facts from a specific bounded context into the RequestContext."""
        pass

class CoreContextProvider:
    def build(self, request: Request, context: RequestContext) -> None:
        context.requires_technician = request.requires_technician
        context.has_valid_schema = True  # Assuming validated at creation
        context.staff_assigned = True # Used as a dummy guard for PICK_UP

class PolicyContextProvider:
    def build(self, request: Request, context: RequestContext) -> None:
        category = request.category
        # Replace hardcoded rules with category checks. 
        # In a real implementation, this would query a CategoryPolicy service.
        context.category_requires_quote = category in ['installation', 'maintenance']
        context.category_requires_payment = category in ['product_order', 'consultation']
        # If it doesn't require a technician, it typically doesn't require verification
        context.category_requires_verification = request.requires_technician

class OrderContextProvider:
    def build(self, request: Request, context: RequestContext) -> None:
        if hasattr(request, 'order') and request.order:
            context.has_order = True
            order_status = request.order.status.lower()
            if order_status in ['paid', 'fulfilled']:
                context.payment_confirmed = True
            if order_status == 'fulfilled':
                context.order_fulfilled = True
            if order_status == 'cancelled':
                context.order_cancelled = True

class QuoteContextProvider:
    def build(self, request: Request, context: RequestContext) -> None:
        quotes = Quote.objects.filter(request=request).order_by('-created_at')
        quote = quotes.first()
        context.revision_count = quotes.count()
        if quote:
            context.has_valid_quote_version = True
            context.quote_approved = quote.status.lower() == 'approved'
            context.quote_rejected = quote.status.lower() == 'rejected'
            # Assuming policy: upfront payment required if quote is approved and policy demands it
            context.upfront_payment_required = context.category_requires_payment

class AssignmentContextProvider:
    def build(self, request: Request, context: RequestContext) -> None:
        context.tech_available = Assignment.objects.filter(request=request).exclude(response_status__in=['declined', 'timeout']).exists()
        # You would calculate timeouts or decline limits based on historical Assignments
        context.within_timeout = True
        context.decline_count = request.decline_count

class VerificationContextProvider:
    def build(self, request: Request, context: RequestContext) -> None:
        try:
            from apps.requests.models.verification import Verification
            verification = Verification.objects.filter(request=request).order_by('-created_at').first()
            if verification:
                context.evidence_uploaded = bool(verification.photos)
                context.qa_pass = verification.status == 'approved'
                context.qa_fail = verification.status == 'rejected'
        except ImportError:
            pass

class AuditContextProvider:
    def build(self, request: Request, context: RequestContext) -> None:
        context.audit_justification_provided = True
        context.trigger_condition_met = request.sla_status == 'breached'
        context.manager_pre_approval_needed = request.priority == 'emergency'

class RequestContextBuilder:
    def __init__(self, request: Request):
        self.request = request
        self.providers: List[ContextProvider] = [
            CoreContextProvider(),
            PolicyContextProvider(),
            OrderContextProvider(),
            QuoteContextProvider(),
            AssignmentContextProvider(),
            VerificationContextProvider(),
            AuditContextProvider(),
        ]

    def build(self) -> RequestContext:
        context = RequestContext()
        for provider in self.providers:
            provider.build(self.request, context)
        return context
