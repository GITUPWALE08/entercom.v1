import pytest
from django.core.management import call_command
from django.db.migrations.executor import MigrationExecutor
from django.db import connection

from apps.roles.models import RoleDefinition, PermissionDefinition, UserRole


@pytest.mark.django_db
@pytest.mark.skip(reason="Legacy migration tests are incompatible with current test executor")
class TestMigrations:
    def test_0001_initial_applies_cleanly(self):
        """Test that the initial migration applies without errors."""
        executor = MigrationExecutor(connection)
        executor.migrate(["roles", "0001_initial"])
        
        # Verify tables exist
        assert RoleDefinition._meta.db_table in connection.introspection.table_names()
        assert PermissionDefinition._meta.db_table in connection.introspection.table_names()
        assert UserRole._meta.db_table in connection.introspection.table_names()

    def test_0002_rolechangerequest_applies_cleanly(self):
        """Test that the second migration applies without errors."""
        executor = MigrationExecutor(connection)
        executor.migrate(["roles", "0002_rolechangerequest_alter_userrole_expires_at_and_more"])
        
        # Verify RoleChangeRequest table exists
        from apps.roles.models import RoleChangeRequest
        assert RoleChangeRequest._meta.db_table in connection.introspection.table_names()
        
        # Verify constraint exists
        constraints = connection.introspection.get_constraints(
            connection.cursor(),
            RoleChangeRequest._meta.db_table
        )
        assert "role_change_initiator_not_approver" in constraints

    def test_migrations_are_reversible(self):
        """Test that migrations can be rolled back."""
        executor = MigrationExecutor(connection)
        
        # Migrate forward
        executor.migrate(["roles", "0002_rolechangerequest_alter_userrole_expires_at_and_more"])
        
        # Migrate backward
        executor.migrate(["roles", "0001_initial"])
        
        # Verify RoleChangeRequest table no longer exists
        from apps.roles.models import RoleChangeRequest
        assert RoleChangeRequest._meta.db_table not in connection.introspection.table_names()
