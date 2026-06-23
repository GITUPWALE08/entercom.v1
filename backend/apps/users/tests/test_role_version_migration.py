import pytest
from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()

@pytest.mark.django_db
class TestRoleVersionMigration:
    """
    Confirms that the role_version migration has been correctly applied to the database.
    """

    def test_role_version_field_exists_on_model(self):
        # 1. Verify the attribute exists on a model instance
        user = User(email="migration_test@example.com")
        assert hasattr(user, 'role_version'), "User model missing role_version attribute"
        assert user.role_version == 1, "Default role_version should be 1"

    def test_role_version_field_persists_in_db(self):
        # 2. Verify we can create, update, and retrieve the field from the database
        user = User.objects.create_user(
            email="persistence_test@example.com",
            password="password123",
            first_name="Persist",
            last_name="Test"
        )
        
        assert user.role_version == 1
        
        # Increment and save
        user.role_version += 1
        user.save(update_fields=["role_version"])
        
        # Fetch fresh from DB
        fresh_user = User.objects.get(pk=user.pk)
        assert fresh_user.role_version == 2, f"Expected role_version 2, got {fresh_user.role_version}"

    def test_role_version_column_exists_in_schema(self):
        # 3. Directly check the database schema to ensure the column is actually there
        with connection.cursor() as cursor:
            # Query table info (works for both PostgreSQL and SQLite)
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users_user' AND column_name = 'role_version'
                """)
                row = cursor.fetchone()
                assert row is not None, "Column 'role_version' not found in users_user table schema"
            else:
                # SQLite fallback
                cursor.execute("PRAGMA table_info(users_user)")
                columns = [row[1] for row in cursor.fetchall()]
                assert 'role_version' in columns, "Column 'role_version' not found in users_user table schema"
