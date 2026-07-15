"""
Tests for PolicyContextProvider and QuoteContextProvider.
Covers canonical category sets and upfront_payment_required logic.
Ref: docs/architecture/request/request-lifecycle.md
"""
import pytest
from unittest.mock import MagicMock, patch

from apps.requests.domain.context import RequestContext
from apps.requests.services.context_builder import (
    PolicyContextProvider,
    QuoteContextProvider,
    RequestContextBuilder,
    PAYMENT_REQUIRED_CATEGORIES,
    VERIFICATION_REQUIRED_CATEGORIES,
    QUOTE_REQUIRED_CATEGORIES,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
def _make_request(category: str, has_quote: bool = False, quote_amount: float = 0.0):
    """Build a mock Request with minimal attributes."""
    req = MagicMock()
    req.category = category
    req.requires_technician = False
    req.status = "staff_review"

    # Simulate the quotes queryset
    quote = MagicMock()
    quote.amount = str(quote_amount)

    qs = MagicMock()
    qs.filter.return_value.order_by.return_value.first.return_value = quote if has_quote else None
    req.quotes = qs
    return req


# ---------------------------------------------------------------------------
# PolicyContextProvider: category sets
# ---------------------------------------------------------------------------
class TestPolicyContextProviderCategoryMatrices:

    def test_payment_required_categories(self):
        """Canonical payment-required category set must match docs."""
        assert "installation" in PAYMENT_REQUIRED_CATEGORIES
        assert "maintenance" in PAYMENT_REQUIRED_CATEGORIES
        assert "product_order" in PAYMENT_REQUIRED_CATEGORIES
        assert "consultation" in PAYMENT_REQUIRED_CATEGORIES
        # should NOT include no-payment categories
        assert "information" not in PAYMENT_REQUIRED_CATEGORIES
        assert "support" not in PAYMENT_REQUIRED_CATEGORIES

    def test_verification_required_categories(self):
        """Canonical verification-required category set must match docs."""
        assert "installation" in VERIFICATION_REQUIRED_CATEGORIES
        assert "maintenance" in VERIFICATION_REQUIRED_CATEGORIES
        assert "consultation" in VERIFICATION_REQUIRED_CATEGORIES
        assert "device_outage" in VERIFICATION_REQUIRED_CATEGORIES
        assert "warranty" in VERIFICATION_REQUIRED_CATEGORIES
        # no-verification categories
        assert "information" not in VERIFICATION_REQUIRED_CATEGORIES
        assert "support" not in VERIFICATION_REQUIRED_CATEGORIES

    def test_quote_required_categories(self):
        """Canonical quote-required category set must match docs."""
        assert "installation" in QUOTE_REQUIRED_CATEGORIES
        assert "maintenance" in QUOTE_REQUIRED_CATEGORIES
        # consultation uses fixed pricing, no quote needed
        assert "consultation" not in QUOTE_REQUIRED_CATEGORIES

    def test_payment_required_flag_set_for_installation(self):
        req = _make_request("installation")
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        assert ctx.category_requires_payment is True

    def test_payment_required_flag_not_set_for_information(self):
        req = _make_request("information")
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        assert ctx.category_requires_payment is False

    def test_verification_required_flag_set_for_maintenance(self):
        req = _make_request("maintenance")
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        assert ctx.category_requires_verification is True

    def test_verification_not_required_for_information(self):
        req = _make_request("information")
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        assert ctx.category_requires_verification is False

    def test_quote_required_flag_set_for_installation(self):
        req = _make_request("installation")
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        assert ctx.category_requires_quote is True

    def test_quote_not_required_for_support(self):
        req = _make_request("support")
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        assert ctx.category_requires_quote is False


# ---------------------------------------------------------------------------
# QuoteContextProvider: upfront_payment_required
# ---------------------------------------------------------------------------
class TestQuoteContextProviderUpfrontPayment:

    def test_upfront_payment_required_when_policy_requires_payment_no_quote(self):
        """upfront_payment_required must be True if policy requires payment, even without a quote."""
        req = _make_request("consultation", has_quote=False)  # no quote yet
        ctx = RequestContext()
        # Policy sets category_requires_payment = True for consultation
        PolicyContextProvider().build(req, ctx)
        QuoteContextProvider().build(req, ctx)
        assert ctx.upfront_payment_required is True

    def test_upfront_payment_required_with_quote_and_payment_policy(self):
        """upfront_payment_required must be True if policy requires payment, with a quote."""
        req = _make_request("installation", has_quote=True, quote_amount=15000.0)
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        QuoteContextProvider().build(req, ctx)
        assert ctx.upfront_payment_required is True

    def test_upfront_payment_not_required_for_information(self):
        """upfront_payment_required must be False for non-payment categories."""
        req = _make_request("information", has_quote=False)
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        QuoteContextProvider().build(req, ctx)
        assert ctx.upfront_payment_required is False

    def test_upfront_payment_not_required_for_support(self):
        req = _make_request("support", has_quote=True, quote_amount=0.0)
        ctx = RequestContext()
        PolicyContextProvider().build(req, ctx)
        QuoteContextProvider().build(req, ctx)
        assert ctx.upfront_payment_required is False


# ---------------------------------------------------------------------------
# Category field propagation
# ---------------------------------------------------------------------------
class TestCoreContextProviderCategory:

    def test_category_propagated_to_context(self):
        """RequestContext.category must match the request category."""
        req = _make_request("warranty")
        ctx = RequestContext()
        from apps.requests.services.context_builder import CoreContextProvider
        CoreContextProvider().build(req, ctx)
        assert ctx.category == "warranty"

    def test_category_propagated_for_information(self):
        req = _make_request("information")
        ctx = RequestContext()
        from apps.requests.services.context_builder import CoreContextProvider
        CoreContextProvider().build(req, ctx)
        assert ctx.category == "information"
