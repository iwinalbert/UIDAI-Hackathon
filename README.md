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
# United India - UIDAI Hackathon 🇮🇳

A comprehensive data analytics and visualization platform for analyzing Aadhaar (UIDAI) metrics including biometric authentication, demographic data, and enrolment statistics across India.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Data Pipeline](#data-pipeline)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

## 🎯 Overview

This project was developed for the UIDAI Hackathon to provide insightful visualizations and analytics on Aadhaar data. It enables users to explore trends in: 

- **Biometric Authentication**: Track successful biometric authentications across age groups (5-17, 17+)
- **Demographic Authentication**: Monitor demographic authentication patterns
- **Enrolment Statistics**: Analyze new Aadhaar enrolments by age groups (0-5, 5-17, 18+)
- **Geographic Analysis**: Filter and visualize data by state, district, and pincode

## ✨ Features

- 📊 **Interactive TradingView-style Charts** - Professional-grade candlestick and line charts for data visualization
- 🗺️ **Geographic Filtering** - Filter data by state and district
- 📈 **Custom Indicators** - Add and configure custom analytical indicators
- 🔄 **Data Fusion Mode** - Combine multiple datasets for comprehensive analysis
- 📰 **Event Markers** - Track policy changes, technology updates, and news events
- 🤖 **AI Analyst Notes** - Save and manage analytical insights
- 🌙 **Dark Theme** - Eye-friendly dark mode interface
- 📱 **Responsive Design** - Works across desktop and mobile devices

## 📁 Project Structure

```
United-India---UIDAI---Hackathon/
├── UIDAI/
│   └── UI/                     # Frontend React Application
│       ├── src/
│       │   ├── components/     # React components
│       │   │   ├── Chart/      # Chart visualization components
│       │   │   ├── Docs/       # Help and documentation
│       │   │   ├── Indicators/ # Indicator management
│       │   │   └── Layout/     # Layout components
│       │   ├── store/          # Zustand state management
│       │   ├── types/          # TypeScript type definitions
│       │   ├── utils/          # Utility functions
│       │   └── data/           # Static data files
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
├── Datascience/                # Data processing pipeline
│   ├── aadhaar_metrics_pipeline.ipynb  # Main data pipeline
│   └── processed/              # Processed output data
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Zustand** - State management
- **Lightweight Charts** - TradingView charting library
- **Lucide React** - Icon library
- **PapaParse** - CSV parsing

### Data Science
- **Python** - Data processing
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing
- **Jupyter Notebook** - Interactive development
<img width="8192" height="7951" alt="Mermaid-diagram" src="https://github.com/user-attachments/assets/5fb8815e-18f1-4a4b-a71e-d795ee35eb42" />

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Python 3.8+** (for data pipeline)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VarunKumar-05/United-India---UIDAI---Hackathon.git
   cd United-India---UIDAI---Hackathon
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd UIDAI/UI
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

### Data Pipeline Setup (Optional)

1. **Install Python dependencies**
   ```bash
   pip install pandas numpy jupyter
   ```

2. **Run the data pipeline**
   ```bash
   cd Datascience
   jupyter notebook aadhaar_metrics_pipeline.ipynb
   ```

## 📊 Usage

1. **Launch the Application**:  Start the dev server and open `http://localhost:5173`

2. **Select Data View**: 
   - Choose a state and district from the filters
   - Select the primary dataset (Biometric, Demographic, or Enrolment)

3. **Customize Charts**:
   - Toggle between different chart types (candles, line)
   - Add custom indicators
   - Enable fusion mode to overlay multiple datasets

4. **Explore Events**:  Click on event markers to view policy changes, technology updates, and news affecting Aadhaar metrics

5. **Access Help**: Navigate to `#help` for detailed documentation

## 🔄 Data Pipeline

The data pipeline processes raw Aadhaar data from multiple sources:

| Data Type | Description | Age Groups |
|-----------|-------------|------------|
| Biometric | Successful biometric authentications | 5-17, 17+ |
| Demographic | Successful demographic authentications | 5-17, 17+ |
| Enrolment | New Aadhaar enrolments | 0-5, 5-17, 18+ |

**Output Metrics:**
- Daily enrolment trends
- Biometric vs Demographic usage comparison
- Share ratios and child-share analysis
- State and district-level aggregations

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Team

- **Varun Kumar** - [@VarunKumar-05](https://github.com/VarunKumar-05)
- **Thomas Albert** -[@iwinalbert](https://github.com/iwinalbert)
- **Rishi Lakshan** 
## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for the UIDAI Hackathon
</p># United-India---UIDAI---Hackathon
