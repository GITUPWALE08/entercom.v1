import pytest
import threading
from django.contrib.auth import get_user_model
from django.db import transaction, connection
from apps.requests.models import Request, LifecycleState, Assignment
from apps.requests.services.assignment_service import AssignmentService
from apps.requests.domain.exceptions import InvalidTransitionError

User = get_user_model()

@pytest.fixture
def customer_user(db):
    return User.objects.create(email="customer@test.com", role="CUSTOMER")

@pytest.fixture
def staff_user(db):
    return User.objects.create(email="staff@test.com", role="STAFF")

@pytest.fixture
def tech_user1(db):
    return User.objects.create(email="tech1@test.com", role="TECHNICIAN")

@pytest.fixture
def tech_user2(db):
    return User.objects.create(email="tech2@test.com", role="TECHNICIAN")

@pytest.fixture
def awaiting_assignment_request(customer_user):
    return Request.objects.create(
        public_id="REQ-TEST-RACE",
        customer=customer_user,
        category="installation",
        status=LifecycleState.AWAITING_ASSIGNMENT,
        description="Test race"
    )

@pytest.mark.django_db(transaction=True)
class TestConcurrency:
    
    def test_dual_assignment_race(self, staff_user, tech_user1, tech_user2, awaiting_assignment_request):
        """
        Simulates a race condition where two staff members attempt to assign
        different technicians to the same request simultaneously.
        """
        exceptions = []
        
        def assign_tech(tech_id):
            try:
                # We need to close existing connections in threads for django
                connection.close()
                AssignmentService.assign(
                    request_id=awaiting_assignment_request.id,
                    actor=staff_user,
                    technician_id=tech_id
                )
            except Exception as e:
                exceptions.append(e)

        # In SQLite, concurrent writes might throw OperationalError "database is locked"
        # or InvalidTransitionError if the state machine catches it after one thread succeeds.
        t1 = threading.Thread(target=assign_tech, args=(tech_user1.id,))
        t2 = threading.Thread(target=assign_tech, args=(tech_user2.id,))
        
        t1.start()
        t2.start()
        
        t1.join()
        t2.join()
        
        # Refresh the request
        awaiting_assignment_request.refresh_from_db()
        
        # Verify exactly one assignment succeeded
        assert Assignment.objects.filter(request=awaiting_assignment_request).count() == 1
        assert awaiting_assignment_request.status == LifecycleState.ASSIGNED
        
        # Verify the other thread failed with an expected exception
        assert len(exceptions) == 1
        # The exception could be InvalidTransitionError because the state moved from AWAITING to ASSIGNED
        # or an OperationalError from SQLite locking. Both prove the lock/transaction worked.
