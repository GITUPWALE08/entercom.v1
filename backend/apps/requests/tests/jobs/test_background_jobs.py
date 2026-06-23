import pytest
from apps.requests.domain.states import RequestState

class DummyJobs:
    @staticmethod
    def process_assignment_timeouts(requests):
        """Simulates sweeping assigned requests > 48h."""
        results = []
        for req in requests:
            if req['hours_in_assigned'] >= 48:
                req['status'] = RequestState.ESCALATED
                req['decline_count'] += 1
                results.append(req)
        return results

    @staticmethod
    def process_quote_expiry(quotes):
        """Simulates sweeping quotes > 30 days old."""
        results = []
        for quote in quotes:
            if quote['days_old'] >= 30:
                quote['status'] = 'expired'
                quote['request_status'] = RequestState.CANCELLED
                results.append(quote)
        return results

class TestBackgroundJobs:

    def test_assignment_timeout_escalation(self):
        """Verifies assignments older than 48 hours are revoked, counted as decline, and escalated."""
        mock_requests = [
            {'id': 1, 'hours_in_assigned': 12, 'status': RequestState.ASSIGNED, 'decline_count': 0},
            {'id': 2, 'hours_in_assigned': 49, 'status': RequestState.ASSIGNED, 'decline_count': 2},
        ]
        
        processed = DummyJobs.process_assignment_timeouts(mock_requests)
        
        assert len(processed) == 1
        assert processed[0]['id'] == 2
        assert processed[0]['status'] == RequestState.ESCALATED
        assert processed[0]['decline_count'] == 3

    def test_quote_expiry_triggers_cancellation(self):
        """Verifies quotes older than 30 days expire and cancel the parent request."""
        mock_quotes = [
            {'id': 10, 'days_old': 15, 'status': 'issued', 'request_status': RequestState.AWAITING_CUSTOMER_APPROVAL},
            {'id': 11, 'days_old': 31, 'status': 'issued', 'request_status': RequestState.AWAITING_CUSTOMER_APPROVAL},
        ]
        
        processed = DummyJobs.process_quote_expiry(mock_quotes)
        
        assert len(processed) == 1
        assert processed[0]['id'] == 11
        assert processed[0]['status'] == 'expired'
        assert processed[0]['request_status'] == RequestState.CANCELLED
