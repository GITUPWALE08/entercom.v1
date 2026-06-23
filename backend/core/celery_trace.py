"""Celery signal hooks to propagate audit trace context."""

from __future__ import annotations

from celery.signals import before_task_publish, task_postrun, task_prerun

from core.trace_context import (
    TRACE_HEADER_CORRELATION_ID,
    TRACE_HEADER_IP_ADDRESS,
    TRACE_HEADER_REQUEST_ID,
    TRACE_HEADER_USER_AGENT,
    clear_trace_context,
    restore_trace_context,
    snapshot_trace_context,
)


@before_task_publish.connect
def inject_trace_headers(headers=None, **kwargs) -> None:
    if headers is None:
        return
    trace = snapshot_trace_context()
    for key, value in trace.items():
        if value:
            headers[key] = value


@task_prerun.connect
def restore_trace_from_task(task=None, **kwargs) -> None:
    if task is None:
        return
    raw_headers = getattr(task.request, "headers", None) or {}
    if hasattr(raw_headers, "items"):
        headers = dict(raw_headers)
    else:
        headers = {}

    if not headers.get(TRACE_HEADER_REQUEST_ID):
        headers = snapshot_trace_context()

    restore_trace_context(headers)


@task_postrun.connect
def clear_trace_after_task(**kwargs) -> None:
    clear_trace_context()
