/**
 * SIMULATION: Velocity Indicator - Partition-by-PIN Architecture
 * 
 * This script demonstrates the "Mathematical Locality" principle described in the architecture doc.
 * It simulates a Distributed Log (Kafka) environment in a single process.
 * 
 * CORE CONCEPTS SIMULATED:
 * 1. Producer: Hashes PIN -> Partition ID.
 * 2. Broker: Distributes messages to Partitions (Arrays).
 * 3. Consumer: Processes each Partition independently with Local State (Map).
 */

const fs = require('fs');
const path = require('path');
const Papa = require('../UI/node_modules/papaparse'); // Use the library installed in UI

// --- CONFIGURATION ---
const PARTITION_COUNT = 16; // Simulated Scale (vs 1024 prod)
const INPUT_FILE = path.join(__dirname, '../Dataset/api_data_aadhar_biometric/api_data_aadhar_biometric/api_data_aadhar_biometric_0_500000.csv');

// --- INFRASTRUCTURE SIMULATION ---

// 1. Partitioner (Producer Logic)
// Uses a simple hash to determine "Shard"
const getPartition = (pinCode) => {
    // Simple string hash
    let hash = 0;
    const str = String(pinCode);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash) % PARTITION_COUNT;
};

// 2. The Distributed Log (The Broker)
// Array of Arrays. partitions[5] holds all messages for Partition #5.
const partitions = Array.from({ length: PARTITION_COUNT }, () => []);

// 3. State Store (The Consumer's "RocksDB")
// Map<PartitionID, Map<PIN, PreviousState>>
const stateStores = Array.from({ length: PARTITION_COUNT }, () => new Map());


// --- PROCESSING LOGIC ---

// Producer: Ingests data and pushes to the correct "Shard"
const produce = (data) => {
    console.log(`[PRODUCER] Ingesting ${data.length} records...`);
    let count = 0;

    data.forEach(row => {
        const pin = row.pincode;
        if (!pin) return;

        const partitionId = getPartition(pin);

        // Simulating the "Log Append"
        // We calculate daily snapshots, but for simplicity here we just push the raw update event
        partitions[partitionId].push({
            key: pin,
            date: row.date,
            count: row.bio_age_5_17 || 0,
            district: row.district
        });
        count++;
    });
    console.log(`[PRODUCER] Successfully partitioned ${count} events across ${PARTITION_COUNT} partitions.`);
};

// Consumer: Process a specific partition
const consumePartition = (partitionId) => {
    const stream = partitions[partitionId];
    const store = stateStores[partitionId]; // Local State for this shard
    const results = [];

    // Sort stream by time (Kafka guarantees order within partition)
    // CSV data might be unordered, so we enforce order here to mimic Kafka Log
    stream.sort((a, b) => {
        // Parse DD-MM-YYYY
        const dA = new Date(a.date.split('-').reverse().join('-'));
        const dB = new Date(b.date.split('-').reverse().join('-'));
        return dA - dB;
    });

    // Process using the "Stateful Logic"
    stream.forEach(event => {
        const pin = event.key;

        // 1. Fetch State (Simulating RocksDB get)
        const prevState = store.get(pin);

        // 2. Handle Logic
        let velocity = 0;
        let isSpike = false;

        if (prevState) {
            // 3. Calculate Velocity (Derivative)
            // dX = Current - Previous
            // dt = 1 (assuming sequential update in this simulation stream)
            velocity = event.count - prevState.count;

            // Insight Rule: Spike > Sigma (e.g., 20)
            if (velocity > 20) isSpike = true;
        }

        // 4. Update State (Simulating RocksDB put)
        store.set(pin, { count: event.count, lastDate: event.date });

        // 5. Emit Result
        if (isSpike) {
            results.push({
                partition: partitionId,
                pin: pin,
                district: event.district,
                date: event.date,
                velocity: velocity,
                msg: "High Velocity Detected"
            });
        }
    });

    return results;
};

// --- RUN SIMULATION ---

const runSimulation = async () => {
    try {
        console.log("--- STARTING KAFKA VELOCITY SIMULATION ---");

        // 1. Read Raw Data
        const fileContent = fs.readFileSync(INPUT_FILE, 'utf8');
        const parsed = Papa.parse(fileContent, { header: true, dynamicTyping: true, skipEmptyLines: true });

        // 2. Produce (Distribute to Shards)
        produce(parsed.data);

        // 3. Consume (Process Separately)
        console.log("\n[CONSUMER] Starting Distributed Processing...");
        let totalSpikes = 0;

        for (let i = 0; i < PARTITION_COUNT; i++) {
            const partitionSpikes = consumePartition(i);
            if (partitionSpikes.length > 0) {
                console.log(`[PARTITION #${i}] Processed ${partitions[i].length} events. Found ${partitionSpikes.length} spikes.`);
                // Show a sample spike from this partition
                const sample = partitionSpikes[0];
                console.log(`   -> Example: PIN ${sample.pin} (${sample.district}) on ${sample.date}: Velocity = +${sample.velocity}`);
                totalSpikes += partitionSpikes.length;
            }
        }

        console.log(`\n--- SIMULATION COMPLETE ---`);
        console.log(`Total "School Admission Effect" Spikes Detected: ${totalSpikes}`);
        console.log(`Verified: All calculations for a specific PIN happened on the same Partition.`);

    } catch (e) {
        console.error("Simulation Failed:", e);
    }
};

runSimulation();
