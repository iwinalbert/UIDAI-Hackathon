**UIDAI Velocity Dashboard (Frontend)**
=======================================

The **UIDAI Velocity Dashboard** is a high-performance, financial-grade visualization platform designed to monitor the "pulse" of the Aadhaar ecosystem. Built using **React 19** and **TypeScript**, it renders millions of data points with 60fps fluidity using hardware-accelerated charting libraries.

**⚡ Tech Stack**
----------------

*   **Core:** React 19, TypeScript, Vite
    
*   **Visualization:** lightweight-charts (TradingView Engine)
    
*   **State Management:** zustand
    
*   **Styling:** Tailwind CSS
    
*   **AI Integration:** Google Gemini 2.0 Flash (via REST API)
    
*   **Icons:** Lucide React
    

**🚀 Getting Started**
----------------------

### **1\. Installation**

Install the dependencies using npm:

npm install

### **2\. Configuration (AI Features)**

To enable the "AI Analyst" sidebar features, you need a Google Gemini API Key.

1.  Open src/services/geminiService.ts.
    
2.  Insert your key in the const API\_KEY = "..." variable.
    

*   _(Note: In a production build, this would use .env variables)._
    

### **3\. Running the Dev Server**

Start the local development server:

npm run dev

The application will launch at http://localhost:5173.

**📂 Architecture & Folder Structure**
--------------------------------------

We organize the frontend by Feature Domain rather than just technical role.

src/├── components/│   ├── Chart/            # The core TradingView wrapper & Chart logic│   ├── Indicators/       # UI controls for specific indicators (Velocity, etc.)│   ├── Docs/             # Integrated documentation viewer│   └── Layout/           # Main application shell (Sidebar, Header)├── data/                 # Static JSON datasets (processed by scripts/)├── services/│   ├── geminiService.ts  # Interface to Google Gemini 2.0 for market reports│   └── newsService.ts    # Fetches context-aware news for spikes├── store/                # Global state (Zustand) for active district/chart mode└── utils/                # THE BRAIN: Mathematical & ML Logic    ├── velocityMath.ts   # Calculus logic (Derivative calculation)    ├── indicatorEngine.ts # Indicator calculation pipeline    └── lorentzianClassifier.ts # KNN Machine Learning implementation

**🧠 Key Modules Explained**
----------------------------

### **1\. The Chart Engine (components/Chart)**

We wrap the lightweight-charts library to create a custom "Candlestick" view of administrative data. Unlike standard administrative dashboards (bar charts), this allows technical analysis (Trendlines, Support/Resistance) on Identity Data.

### **2\. The Math "Brain" (utils/)**

*   **velocityMath.ts:** Calculates the first derivative of enrolment updates.
    
*   **lorentzianClassifier.ts:** Implements a K-Nearest Neighbors algorithm using Lorentzian Distance (simpler and more robust than Euclidean distance) to predict if enrolment velocity will accelerate or decelerate based on 4D historical patterns.
    

### **3\. AI Analyst (services/geminiService.ts)**

We capture the current chart state (Zoom level, visible indicators, selected district) and send a compressed prompt to Gemini 2.0 Flash. The AI returns a "Market Report" explaining the administrative movements as if they were financial assets.

**🧪 Scripts**
--------------

*   npm run build: Compiles TypeScript and builds for production.
    
*   npm run lint: Runs ESLint to ensure code quality.
