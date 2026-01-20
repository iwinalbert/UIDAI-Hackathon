# UIDAI Velocity: Ecosystem Intelligence Platform

![React](https://img.shields.io/badge/React-v19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue) ![Gemini](https://img.shields.io/badge/AI-Gemini%202.0-orange) ![Status](https://img.shields.io/badge/Status-Prototype-green)

**UIDAI Velocity** is an advanced analytics dashboard that treats Aadhaar ecosystem updates (Enrolments, Biometrics, Demographics) as high-frequency financial market data.

By applying **quantitative finance metrics** (Velocity, Momentum, Volatility) and **Machine Learning** to administrative data, we can detect anomalies, predict "School Admission Spikes," and identify exclusion zones in real-time.

---

## 🚀 Key Features

### 1. The "Velocity" Metric
Instead of looking at static counts, we calculate the **first derivative of data** ($dx/dt$).
- **High Velocity:** Indicates rapid adoption or mandatory update drives.
- **Zero Velocity:** Indicates potential "Exclusion Zones" or service outages.
- **Spike Detection:** Automatically flags events (like School Admission Season) when velocity exceeds $20\sigma$.

### 2. AI-Powered Analyst (Gemini)
Integrated with **Google Gemini 2.0 Flash**:
- The system takes the current chart view (indicators, timeframe, location).
- Generates a professional "Market Report" explaining *why* a spike is happening (e.g., correlating data with news events).
- [Code Reference]: `UIDAI/UI/src/services/geminiService.ts`

### 3. Predictive "Lorentzian" Classifier
A custom Machine Learning signal adapted from quantitative trading:
- Uses **Lorentzian Distance** (simpler and more robust to outliers than Euclidean distance) to find historical patterns similar to the current state.
- Predicts if enrolment velocity will **Accelerate** or **Decelerate** in the next 4 days.
- [Code Reference]: `UIDAI/UI/src/utils/lorentzianClassifier.ts`

---

## 🏗️ Architecture & Simulation

### The "Partition-by-PIN" Strategy
To calculate velocity for 1.4 billion people effectively, we designed a **Distributed Log Architecture**.

* **Principle:** Mathematical Locality.
* **Logic:** By hashing the PIN code (`110001`), we ensure all updates for a specific location land on the same partition. This allows us to calculate the derivative (Current - Previous) in-memory without expensive database lookups.

> **Hackathon Note:** For this prototype, we have implemented this architecture as a **Simulation**.
> The script `scripts/simulateKafkaVelocity.js` mimics a Kafka Consumer group, demonstrating how stateful processing handles out-of-order data and spike detection locally.

See full design: [VELOCITY_KAFKA_ARCHITECTURE.md](./UIDAI/docs/VELOCITY_KAFKA_ARCHITECTURE.md)

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Google Gemini API Key (Optional, for AI features)

### 1. Data Processing
Transform the raw CSV datasets into the JSON format required by the visualization engine.

```bash
cd UIDAI/scripts
node processData.js
# This generates: UIDAI/UI/src/data/velocityData.json
