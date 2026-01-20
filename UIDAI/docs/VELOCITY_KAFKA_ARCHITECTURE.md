# Velocity Indicator: Distributed Log Architecture (Kafka)

This document outlines the **"Partition-by-PIN"** strategy for the Velocity Indicator component. It is designed to solve the problem of calculating **Time-Series Derivatives (Velocity)** at a national scale (1.4 billion people, ~19,000 PIN codes) using Apache Kafka and Kafka Streams.

## Core Principle: "Mathematical Locality"

To calculate velocity ($V = \frac{dX}{dt}$), we need $X_t$ (current updates) and $X_{t-1}$ (previous updates) to be processed **by the same CPU core** and **in the exact order of occurrence**.

Partitioning by PIN guarantees that **all history for a specific location exists on a single "shard" (Partition)**, enabling efficient stateful processing without network shuffling.

## Phase 1: Topic Engineering & Topology

### 1. Topic Configuration

| Parameter | Value | Reason |
| :--- | :--- | :--- |
| **Topic Name** | `aadhaar.biometric.updates.v1` | Explicit versioning. |
| **Partition Count** | **1,024** | Handles ~19,100 PINs (~18 PINs/partition). High parallelism. |
| **Replication Factor** | **3** | Standard High Availability. |
| **Cleanup Policy** | `delete` | Time-based retention (NOT `compact`) to preserve history for velocity calc. |
| **Retention Period** | **1 Year** | Allows year-over-year seasonality comparison. |

### 2. The Keying Strategy

This is the most critical logic in the Producer.

- **Message Key**: `PIN_CODE` (String, e.g., "110001")
- **Partitioner**: `DefaultPartitioner` (Murmur2 Hash)
- **Logic**: `Target_Partition = hash("110001") % 1024`
- **Result**: PIN 110001 **always** lands on the same partition (e.g., Partition #5).

## Phase 2: The "Stateful" Stream Processor

We use **Kafka Streams** (Java/Scala) with **RocksDB** for local state management.

### Processing Topology

1.  **Source**: Consumes from `aadhaar.biometric.updates.v1`.
2.  **Grouping**: Already keyed by `PIN_CODE` (Zero Network Overhead).
3.  **State Store**: Persistent `KeyValueStore` named `prev_month_store`.
    - **Key**: PIN Code
    - **Value**: Integer (Previous month's count)

### Logic Flow (Pseudocode)

```java
// For every incoming event: Event(current_date, current_count, pin)

// 1. Fetch State
Integer prev_count = stateStore.get(pin);

// 2. Handle "Cold Start"
if (prev_count == null) {
    velocity = 0.0;
    stateStore.put(pin, current_count);
    return;
}

// 3. Calculate Velocity (The Derivative)
Double velocity = (current_count - prev_count) / 1.0; // Monthly frequency

// 4. Update State
stateStore.put(pin, current_count);

// 5. Context Enrichment (Stock Fusion)
// Join with KTable("aadhaar.enrolment.static")
Double total_population = populationTable.get(pin);
Double relative_velocity = velocity / total_population;

// 6. Sink
context.forward(pin, new VelocityResult(velocity, relative_velocity));
```

## Phase 5: Frontend Integration (The "Last Mile")

The **Velocity Component** in the UI currently consumes a static JSON file (`velocityData.json`). In a production environment connected to Kafka, this is replaced by a **Real-Time Data Layer**.

### The Architecture Bridge

1.  **Kafka Streams Output**: Pushes calculated velocity events to a topic `aadhaar.velocity.output.v1`.
2.  **API / WebSocket Server**: A Node.js service consumes this output topic.
3.  **Frontend (React)**: 
    - Replaces `import velocityData from ...` with a **WebSocket Hook**.
    - Subscribes to updates: `socket.subscribe('velocity/updates')`.
    - Updates the Chart state dynamically as new packets arrive.

#### React Component Adaptation
The `VelocityIndicator.tsx` visual logic remains largely the same, but the data source changes:

```typescript
// Current (Static)
import velocityData from '../../data/velocityData.json';

// Future (Kafka Connected)
useEffect(() => {
    const socket = new WebSocket('wss://api.uidai.gov/velocity-stream');
    socket.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        // Append to local state or update chart series
        chartRef.current.series.update(newData);
    };
}, []);
```

## Phase 3: Handling Data Skew

For "Mega-City PINs" (e.g., Delhi, Mumbai) generating massive traffic:

**Strategy**: "Salted" Keys
1.  **Producer**: Append random suffix `1-5` to key (e.g., `110001-1`, `110001-2`).
2.  **Consumer**: This spreads load across 5 partitions.
3.  **Aggregation**: Add a second aggregation step to sum partial velocities: $V_{total} = \sum V_{partial}$.

## Phase 4: Fault Tolerance

- **Consumer Failure**: Kafka rebalances Partition #5 to a healthy node.
- **State Recovery**: The healthy node rebuilds `prev_month_store` from the changelog topic (backed by RocksDB).
- **Result**: Processing resumes exactly where it left off. **Exactly-Once** semantics ensure financial/identity grade accuracy.
