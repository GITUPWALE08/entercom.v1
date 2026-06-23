import pytest
import time
import uuid
from django.db import connection
from django.utils import timezone
from datetime import timedelta
from apps.audit_logs.models import AuditLogEntry, AuditRetentionClass
from apps.audit_logs.services.retention_service import run_retention

@pytest.mark.django_db(transaction=True)
class TestRetentionScale:
    """
    Performance and scalability audit for audit log retention.
    Validates if the purge mechanism can handle 100k records within SLA.
    """

    @pytest.fixture(autouse=True)
    def enable_db_cleanup(self):
        """
        Bypass immutability triggers for test teardown.
        """
        yield
        if connection.vendor == 'sqlite':
            with connection.cursor() as cursor:
                cursor.execute("INSERT OR REPLACE INTO _audit_maintenance (key, value) VALUES ('retention_purge', 'on')")

    def test_retention_performance_at_scale(self):
        # 1. Seed 100k rows using raw SQL to bypass ORM creation blocks
        now = timezone.now()
        past = now - timedelta(days=400)
        
        print(f"\n[SCALE TEST] Seeding 100,000 records...")
        start_seed = time.time()
        
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    INSERT INTO audit_logs_entry (
                        id, created_at, occurred_at, action, resource_type, 
                        retention_class, legal_hold, actor_id_snapshot,
                        actor_email_snapshot, actor_role_snapshot, metadata,
                        user_agent, reason
                    )
                    SELECT 
                        gen_random_uuid(), 
                        %s, %s, 
                        'scale_test.action', 
                        'system', 
                        'general', 
                        false,
                        '', '', '', '{}',
                        '', ''
                    FROM generate_series(1, 100000)
                """, [past, past])
            else:
                # Fallback for SQLite/Local testing
                for i in range(100):  # 100 chunks of 1000
                    values = []
                    for _ in range(1000):
                        values.append(f"('{uuid.uuid4()}', '{past.isoformat()}', '{past.isoformat()}', 'scale_test.action', 'system', 'general', 0, '', '', '', '{{}}', '', '')")
                    
                    sql = f"""
                        INSERT INTO audit_logs_entry (
                            id, created_at, occurred_at, action, resource_type, 
                            retention_class, legal_hold, actor_id_snapshot,
                            actor_email_snapshot, actor_role_snapshot, metadata,
                            user_agent, reason
                        ) VALUES {','.join(values)}
                    """
                    cursor.execute(sql)
        
        seed_duration = time.time() - start_seed
        print(f"[SCALE TEST] Seeded 100,000 records in {seed_duration:.2f}s")

        # 2. Run retention purge
        # SLA: 100k records should be processed in < 60 seconds (including index updates)
        print(f"[SCALE TEST] Running retention service (chunk_size=5000)...")
        start_retention = time.time()
        
        try:
            summary = run_retention(chunk_size=5000)
            retention_duration = time.time() - start_retention
            
            print(f"[SCALE TEST] Retention finished in {retention_duration:.2f}s")
            print(f"[SCALE TEST] Summary: {summary}")
            
            # 3. Assertions
            assert summary["general_purged"] == 100000
            assert retention_duration < 60, f"Retention performance SLA violated: {retention_duration:.2f}s"
            
            # Verify they are actually gone
            remaining = AuditLogEntry.objects.filter(action='scale_test.action').count()
            assert remaining == 0, f"Purge failed to remove all records: {remaining} remaining"

        except Exception as e:
            retention_duration = time.time() - start_retention
            print(f"[SCALE TEST] Retention CRASHED after {retention_duration:.2f}s")
            print(f"[SCALE TEST] Error: {type(e).__name__}: {str(e)}")
            raise

    def test_security_archival_performance_at_scale(self):
        # 1. Seed 100k rows for security archiving
        now = timezone.now()
        past = now - timedelta(days=8 * 365) # 8 years ago
        
        print(f"\n[SCALE TEST] Seeding 100,000 security records...")
        start_seed = time.time()
        
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    INSERT INTO audit_logs_entry (
                        id, created_at, occurred_at, action, resource_type, 
                        retention_class, legal_hold, actor_id_snapshot,
                        actor_email_snapshot, actor_role_snapshot, metadata,
                        user_agent, reason
                    )
                    SELECT 
                        gen_random_uuid(), 
                        %s, %s, 
                        'scale_test.security', 
                        'system', 
                        'security', 
                        false,
                        '', '', '', '{}',
                        '', ''
                    FROM generate_series(1, 100000)
                """, [past, past])
            else:
                for i in range(100):
                    values = []
                    for _ in range(1000):
                        values.append(f"('{uuid.uuid4()}', '{past.isoformat()}', '{past.isoformat()}', 'scale_test.security', 'system', 'security', 0, '', '', '', '{{}}', '', '')")
                    
                    sql = f"INSERT INTO audit_logs_entry (id, created_at, occurred_at, action, resource_type, retention_class, legal_hold, actor_id_snapshot, actor_email_snapshot, actor_role_snapshot, metadata, user_agent, reason) VALUES {','.join(values)}"
                    cursor.execute(sql)
        
        seed_duration = time.time() - start_seed
        print(f"[SCALE TEST] Seeded 100,000 security records in {seed_duration:.2f}s")

        # 2. Run retention archival
        print(f"[SCALE TEST] Running retention service (archiving)...")
        start_retention = time.time()
        
        try:
            summary = run_retention(chunk_size=5000)
            retention_duration = time.time() - start_retention
            
            print(f"[SCALE TEST] Archival finished in {retention_duration:.2f}s")
            assert summary["security_archived"] == 100000
            assert retention_duration < 60
            
            # Verify they are archived
            archived_count = AuditLogEntry.objects.filter(action='scale_test.security', archived_at__isnull=False).count()
            assert archived_count == 100000
        except Exception as e:
            retention_duration = time.time() - start_retention
            print(f"[SCALE TEST] Archival CRASHED after {retention_duration:.2f}s")
            print(f"[SCALE TEST] Error: {type(e).__name__}: {str(e)}")
            raise
