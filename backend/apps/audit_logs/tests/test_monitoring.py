import pytest
from unittest.mock import patch
from apps.audit_logs.services.monitoring import emit_audit_write_failure, _adapters

def test_monitoring_adapter_pattern():
    error = ValueError("Test error")
    
    with patch('apps.audit_logs.services.monitoring.logger.error') as mock_logger:
        emit_audit_write_failure(
            action="user.login",
            resource_type="system",
            critical=False,
            error=error,
            extra={"custom": "data"}
        )
        
        assert mock_logger.called
        args, kwargs = mock_logger.call_args
        assert "Non-critical audit write failure" in args[0]
        assert kwargs["extra"]["error_message"] == "Test error"
        assert kwargs["extra"]["custom"] == "data"
