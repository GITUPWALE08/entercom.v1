# WebSocket Monitoring Implementation

## Purpose
The purpose of this document is to define the technical observability metrics required to operate the WebSocket domain safely. Due to the long-lived nature of the connections, standard HTTP metrics (like request per second) are insufficient.

## Scope
- Core metrics to track (Connection counts, Broadcast Latency).
- Alerting thresholds.
- Data capture mechanisms.

## Out of Scope
- Implementation of the specific APM dashboards (e.g., Datadog/Prometheus UI setup).

## Definitions
- **Broadcast Latency**: The time elapsed between a Core Domain publishing an event and the final ASGI consumer dispatching it to the TCP socket.

## Architecture

### 1. Key Metrics
- **Concurrent Connections**: Total active TCP sockets, partitioned by ASGI node. Used for horizontal auto-scaling.
- **Broadcast Latency**: Measured by injecting a timestamp into the payload at the publisher, and calculating the delta at the consumer.
- **Connection Churn Rate**: The number of connects/disconnects per minute. High churn indicates network instability or widespread client crashes.
- **Subscription Density**: As per the resolved decision, capture metrics on which specific channels are the most heavily subscribed to aid in future capacity planning.

### 2. Alerting Thresholds
As per the resolved business decision, alerts must be fired for the SRE team under specific conditions.
- **Latency Alert**: Triggered if Broadcast Latency exceeds **250ms for 5 consecutive minutes**.
- **Density Alert**: Triggered if a single ASGI node exceeds 85% of its 5,000 connection limit.

### 3. Metric Export
- Metrics should be aggregated in memory within the ASGI worker and periodically exported to the telemetry layer (e.g., via a Prometheus `/metrics` endpoint or a StatsD daemon) to avoid blocking the async event loop with heavy I/O.

## Responsibilities
- **Event Router & Consumer**: Responsible for accurately calculating and recording latency deltas.
- **SRE Team**: Responsible for configuring the pager alerts based on the established thresholds.

## Dependencies
- **Telemetry Provider**: Standard tools like Prometheus, Datadog, or New Relic.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- The core metrics required for WebSocket observability are defined.
- The 250ms latency alert threshold is codified.
