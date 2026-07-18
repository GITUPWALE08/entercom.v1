# Notification Metrics Documentation

This document describes the observability metrics implemented for the MVP notification system and how they are computed.

## Core Metrics

All metrics are aggregated via the `NotificationMetricsService.get_metrics()` backend method, which retrieves up-to-date values using Django ORM aggregations to ensure performance and accuracy.

1. **Total Sent (`total_sent`)**
   - The total number of notification deliveries successfully verified by the provider (status is `SENT`).

2. **Total Failed (`total_failed`)**
   - The total number of notification deliveries that encountered errors (statuses `FAILED` or `DEAD_LETTERED`).

3. **Delivery Success Rate (`success_rate`)**
   - Percentage of successful deliveries compared to the total number of deliveries generated.
   - Formula: `(total_sent / total_deliveries) * 100`

4. **Dead-Letter Count (`dead_letter_count`)**
   - The number of deliveries that permanently failed and exhausted all retries (status `DEAD_LETTERED`). These require manual intervention.

5. **Average Retry Count (`average_retry_count`)**
   - The average number of retries per delivery. A high number may indicate provider flakiness or an aggressive retry strategy against permanent failures.

## Latency Metrics

To guarantee SLAs and monitor provider performance, we track three distinct latencies across the delivery lifecycle.

1. **Average Queue Latency (`average_queue_latency_seconds`)**
   - Measures how long a delivery stays in the `PENDING` state inside the Celery queue before a worker picks it up.
   - Formula: `processing_started_at - created_at`
   - High queue latency indicates worker starvation or queue congestion.

2. **Average Processing Latency (`average_processing_latency_seconds`)**
   - Measures the internal execution time for a worker to process the template, evaluate contexts, and prepare the payload before it gets finalized.
   - Formula: `updated_at - processing_started_at`
   - High processing latency could indicate inefficient database queries or template rendering bottlenecks.

3. **Average Provider Latency (`average_provider_latency_seconds`)**
   - Measures the round-trip latency of the HTTP call to the external provider (e.g., Resend).
   - Formula: `response_timestamp - request_timestamp`
   - High provider latency indicates network issues, external service degradation, or aggressive rate-limiting.

## Implementation Notes
- **No Exporters:** Per MVP constraints, these metrics are exclusively exposed via backend service methods for the administrative dashboard or internal querying. We do not export these to Prometheus or Grafana.
- **Precision:** Durations are calculated natively via the database `DurationField` and aggregated centrally.
