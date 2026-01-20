# UIDAI Velocity: Indicator Technical Reference

This document provides a comprehensive technical breakdown of every indicator available in the United India Velocity platform. It details the mathematical logic, underlying data sources, and interpretation frameworks for both standard and proprietary signals.

---

## 1. Core System Indicator

### Velocity Indicator (Main Chart)
**Type:** Candlestick & Volume Histogram  
**Data Source:** Aggregated Update Streams (Biometric + Enrolment + Demographic)

The primary visualization of the platform, representing the "speed" of the Aadhaar ecosystem.

*   **Metric:** Rate of Updates ($dx/dt$)
*   **Open:** Update rate at the start of the time window.
*   **High:** Maximum update rate observed during the window.
*   **Low:** Minimum update rate observed during the window.
*   **Close:** Update rate at the end of the window.
*   **Volume:** Total distinct updates processed in that period.

**Fusion Mode:**
Allows the superposition of multiple datasets. When enabled, the OHLCV values are the scalar sum of selected datasets:
$$ Velocity_{total} = Velocity_{bio} + Velocity_{enrol} + Velocity_{demo} $$

---

## 2. Standard Technical Indicators

### Simple Moving Average (SMA)
**Type:** Overlay  
**Period:** 14

The arithmetic mean of the closing velocity over the last $n$ periods.
$$ SMA_t = \frac{1}{n} \sum_{i=0}^{n-1} C_{t-i} $$
*   **Use:** Smooths out noise to identify the underlying trend direction.

### Exponential Moving Average (EMA)
**Type:** Overlay  
**Period:** 14

A weighted moving average that gives more importance to recent velocity data.
$$ EMA_t = C_t \cdot k + EMA_{t-1} \cdot (1-k) $$
*   **Where** $k = \frac{2}{n+1}$
*   **Use:** Reacts faster to sudden shifts in ecosystem activity (e.g., a sudden policy change).

---

## 3. Proprietary Ecosystem Indicators

### Cohort Spread (Bio)
**Type:** Pane (Oscillator)  
**Input:** `d.spread` (Pre-calculated field)

Measures the divergence between Child (5-17) and Senior (17+) biometric updates.
*   **Logic:** $Value = Spread$
*   **Interpretation:**
    *   **Positive (+):** Younger demographic is driving the velocity (e.g., school admission season).
    *   **Negative (-):** Older demographic is dominant (e.g., pension verification cycles).

### Family Migration (Demo)
**Type:** Pane  
**Input:** `d.migration` (Pre-calculated field)

A composite index tracking simultaneous address updates across linked family identities.
*   **Interpretation:**
    *   **High:** Indicates mass family relocation (urbanization waves).
    *   **Low:** Indicates individual labor movement.

### Youth Dependency (Enrol)
**Type:** Pane  
**Input:** `d.youth`

The ratio of dependent enrolments (requiring guardian auth) to adult independent enrolments.
*   **Interpretation:** High values suggest a surge in new-born or child enrolments, often correlated with birth registration drives.

### Future Biometric Debt
**Type:** Pane  
**Input:** `d.workload`

A predictive metric estimating the future mandatory update workload based on current age structures.
*   **Use:** Capacity planning for Enrolment Centers.

### Cointegration (Leash)
**Type:** Pane  
**Formula:** $|Bio_t - Enrol_{t-4}|$

Measures the "tether" between new enrolments and subsequent biometric updates.
*   **Logic:** Assumes a 4-period lag between enrolment and first biometric update.
*   **Interpretation:**
    *   **Low:** Healthy organic growth.
    *   **High (Spike):** "Leash Snap" — A divergence indicating system failure or backlog processing.

### Hawkes Alpha (Viral)
**Type:** Pane  
**Formula:** $\alpha = \min(1.5, \frac{v_t}{v_{t-1}})$

Measures the "self-excitation" or viral nature of the update velocity.
*   **Logic:** Modeled on Hawkes Processes used in seismology and social media virality.
*   **Interpretation:**
    *   $\alpha > 1$: Super-critical state (Viral/Cascading updates).
    *   $\alpha < 1$: Sub-critical state (Decaying activity).

### Hurst Exponent (H)
**Type:** Pane  
**Window:** 10 periods

Analyzes the long-term memory of the time series using Rescaled Range (R/S) analysis.
*   **Logic:** $H = \frac{\log(R/S)}{\log(n)}$
*   **Interpretation:**
    *   $0.5 < H \le 1$: **Persistent Trend** (Velocity is trending).
    *   $0 \le H < 0.5$: **Mean Reverting** (Velocity will snap back to average).
    *   $H = 0.5$: Random Walk (Brownian Motion).

### Regime Entropy
**Type:** Pane  
**Formula:** Shannon Entropy ($H$)

Measures the disorder or unpredictability of the velocity changes.
*   **Logic:**
    $$ H = - \sum p_i \log_2 p_i $$
    Where $p_i$ is derived from normalized Open and Close velocities.
*   **Interpretation:**
    *   **High:** Chaos / High Risk / Unstable ecosystem state.
    *   **Low:** Predictable / Stable operations.

### Velocity Acceleration
**Type:** Pane  
**Formula:** $\frac{d^2x}{dt^2} = v_t - v_{t-1}$

The second derivative of identity volume (rate of change of the rate of change).
*   **Use:** Identifies inflection points before the velocity actually turns.

### Pearson Correlation (Lagged)
**Type:** Pane  
**Window:** 6 | **Lag:** 4

Calculates the rolling correlation between current Biometric updates and *lagged* Enrolment updates.
*   **Logic:** Pearson Correlation Coefficient ($r$) on sliding windows.
*   **Interpretation:**
    *   $+1$: Perfect correlation (System is processing backlog efficiently).
    *   $0$: No correlation.
    *   $-1$: Inverse correlation (Bottlenecks).

### Benford Forensic Filter
**Type:** Pane  
**Window:** 12

A forensic accounting tool that checks if update volumes follow **Benford's Law** (Law of Anomalous Numbers).
*   **Logic:** Calculates the Mean Absolute Deviation (MAD) between observed leading first digits (1-9) and the theoretical Benford distribution ($P(d) = \log_{10}(1 + 1/d)$).
*   **Interpretation:**
    *   **High Value:** The data looks "artificial" or manipulated. Potential fraud or system glitch.
    *   **Low Value:** Natural, organic growth.

### Residual Anomaly Map
**Type:** Pane  
**Window:** 4 (Seasonality)

Decomposes the time series to find values that deviate from the expected seasonal trend.
*   **Logic:** $Residual = Value_t - Trend_t$
*   **Use:** Spotting "Black Swan" events or outliers that seasonal trends cannot explain.

### Lorentzian KNN Signal
**Type:** Pane (Machine Learning)  
**Algorithm:** K-Nearest Neighbors in Lorentzian Distance Space

A sophisticated predictive signal using 4-dimensional feature space to predict future acceleration.
*   **Features:**
    1.  Spread (Bio)
    2.  Migration (Demo)
    3.  Youth Ratio
    4.  Normalized Price (Close)
*   **Distance Metric:** Lorentzian Distance (Robust to outliers)
    $$ d(x,y) = \sum \ln(1 + |x_i - y_i|) $$
*   **Logic:** Finds the 8 most similar historical market states and votes on the future direction.
*   **Interpretation:** 
    *   **Positive:** Predicted Acceleration.
    *   **Negative:** Predicted Deceleration.
