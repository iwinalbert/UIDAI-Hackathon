import type { OHLCData, SeriesData } from '../types';

/**
 * Executes a user-defined script against the OHLC data.
 * 
 * Script context:
 * - data: OHLCData[]
 * - return: SeriesData[]
 */
export function executeIndicatorScript(script: string, data: OHLCData[]): SeriesData[] {
  try {
    // Safety: This is a hackathon project, so 'new Function' is acceptable.
    // In production, run this in a Web Worker or a sandbox.
    const fn = new Function('data', script);

    const result = fn(data);

    if (!Array.isArray(result)) {
      console.warn("Indicator script validation failed: Result is not an array");
      return [];
    }

    return result;
  } catch (e) {
    console.error("Indicator Execution Error:", e);
    return [];
  }
}

export const PRESETS = {
  'SMA': `
// Simple Moving Average (14)
// @type: overlay
const period = 14;
const result = [];
for (let i = 0; i < data.length; i++) {
  if (i < period - 1) continue;
  let sum = 0;
  for (let j = 0; j < period; j++) {
    sum += data[i - j].close;
  }
  result.push({ time: data[i].time, value: sum / period });
}
return result;
    `,
  'EMA': `
// Exponential Moving Average (14)
// @type: overlay
const period = 14;
const k = 2 / (period + 1);
const result = [];
let ema = data[0].close;

for (let i = 0; i < data.length; i++) {
  const price = data[i].close;
  ema = price * k + ema * (1 - k);
  if (i >= period - 1) {
    result.push({ time: data[i].time, value: ema });
  }
}
return result;
    `,
  'Cohort Spread (Bio)': `
// Child (5-17) vs Senior (17+) Oscillator
// @type: pane
// Positive = Younger Dominant, Negative = Older Dominant
return data.map(d => ({
  time: d.time,
  value: d.spread || 0
}));
    `,
  'Family Migration (Demo)': `
// Demographic Family Migration Index
// @type: pane
// High = Family relocation, Low = Single labor movement
return data.map(d => ({
  time: d.time,
  value: d.migration || 0
}));
    `,
  'Youth Dependency (Enrol)': `
// Ratio of Dependent Enrolments to Adult Enrolments
// @type: pane
return data.map(d => ({
  time: d.time,
  value: d.youth || 0
}));
    `,
  'Future Biometric Debt': `
// Predicted future mandatory update workload
// @type: pane
return data.map(d => ({
  time: d.time,
  value: d.workload || 0
}));
    `,
  'Cointegration (Leash)': `
// Measures if Enrolments (t-5) and Biometrics (t) are tied
// @type: pane
// High Residual = Leash Snap (Divergence/Failure)
const loopback = 4;
const result = [];
for (let i = loopback; i < data.length; i++) {
  const y = data[i].raw_bio || data[i].volume || 0;
  const x = data[i - loopback].raw_enrol || data[i - loopback].volume || 0;
  const residual = Math.abs(y - x);
  result.push({ time: data[i].time, value: residual });
}
return result;
    `,
  'Hawkes Alpha (Viral)': `
// Viral Coefficient (Self-excitation)
// @type: pane
const window = 5;
const result = [];
for (let i = window; i < data.length; i++) {
  let v_t = Math.abs(data[i].close);
  let v_prev = Math.abs(data[i-1].close);
  const alpha = (v_t > 0 && v_prev > 0) ? Math.min(1.5, v_t / v_prev) : 0;
  result.push({ time: data[i].time, value: alpha });
}
return result;
    `,
  'Hurst Exponent (H)': `
// Hurst Exponent: H > 0.5 (Trend), H < 0.5 (Mean Reversion)
// @type: pane
const window = 10;
const result = [];
for (let i = window; i < data.length; i++) {
  const subset = data.slice(i - window, i).map(d => Math.abs(d.close));
  const mean = subset.reduce((a,b) => a+b, 0) / window;
  const stdev = Math.sqrt(subset.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / window);
  const max = Math.max(...subset);
  const min = Math.min(...subset);
  const R = max - min;
  const H = (stdev > 0 && R > 0) ? (Math.log(R / stdev) / Math.log(window)) : 0.5;
  result.push({ time: data[i].time, value: isNaN(H) ? 0.5 : Math.max(0, Math.min(1, H)) });
}
return result;
    `,
  'Regime Entropy': `
// Shannon Entropy: High = Chaos/Risk, Low = Predictable
// @type: pane
return data.map(d => {
  const v1 = Math.abs(d.open) + 0.001;
  const v2 = Math.abs(d.close) + 0.001;
  const total = v1 + v2;
  const p1 = v1 / total;
  const p2 = v2 / total;
  const entropy = -(p1 * Math.log2(p1) + p2 * Math.log2(p2));
  return { time: d.time, value: isNaN(entropy) ? 0 : entropy };
});
    `,
  'Velocity Acceleration': `
// Second Derivative of Identity Volume
// @type: pane
const result = [];
for (let i = 1; i < data.length; i++) {
  const v_t = data[i].close;
  const v_prev = data[i-1].close;
  const acceleration = v_t - v_prev;
  result.push({ time: data[i].time, value: acceleration });
}
return result;
    `,
  'Pearson Correlation (Lagged)': `
// Rolling Pearson r (Lagged Enrolment vs Biometric)
// @type: pane
const window = 6;
const lag = 4;
const result = [];
for (let i = window + lag; i < data.length; i++) {
  const xArr = data.slice(i - window - lag, i - lag).map(d => d.raw_enrol || d.volume);
  const yArr = data.slice(i - window, i).map(d => d.raw_bio || d.volume);
  
  const meanX = xArr.reduce((a,b) => a+b,0) / window;
  const meanY = yArr.reduce((a,b) => a+b,0) / window;
  
  let num = 0, denX = 0, denY = 0;
  for(let j=0; j<window; j++) {
    const dx = xArr[j] - meanX;
    const dy = yArr[j] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const r = (denX > 0 && denY > 0) ? num / Math.sqrt(denX * denY) : 0;
  result.push({ time: data[i].time, value: isNaN(r) ? 0 : r });
}
return result;
    `,
  'Benford Forensic Filter': `
// Checks if counts follow Benford's Leading Digit Distribution
// @type: pane
// Output: Higher = More "Artificial" / Manipulated (MAD score)
const benford = [0, 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
const window = 12;
const result = [];
for (let i = window; i < data.length; i++) {
  const subset = data.slice(i - window, i).map(d => d.volume || 0);
  const counts = new Array(10).fill(0);
  subset.forEach(v => {
    const firstDigit = parseInt(v.toString()[0]);
    if (firstDigit > 0) counts[firstDigit]++;
  });
  
  let mad = 0;
  for (let d = 1; d <= 9; d++) {
    mad += Math.abs((counts[d] / window) - benford[d]);
  }
  result.push({ time: data[i].time, value: mad / 9 });
}
return result;
    `,
  'Residual Anomaly Map': `
// Time-Series Decomposition Residuals
// @type: pane
const window = 4; // Monthly seasonality approx
const result = [];
for (let i = window; i < data.length; i++) {
  const subset = data.slice(i - window, i).map(d => d.close);
  const trend = subset.reduce((a,b) => a+b, 0) / window;
  const residual = data[i].close - trend;
  result.push({ time: data[i].time, value: residual });
}
return result;
    `,
  'Lorentzian KNN Signal': `
// Machine Learning: Lorentzian KNN Classification
// @type: pane
// Features: Spread, Migration, Youth Ratio, Normalized Close
// Output: + = Accelerate, - = Decelerate

const neighborsCount = 8;
const maxBarsBack = Math.min(50, data.length - 5);

if (data.length < maxBarsBack + 5) return [];

const closes = data.map(d => d.close);
const minClose = Math.min(...closes);
const maxClose = Math.max(...closes);
const normalize = (v, min, max) => max === min ? 50 : ((v - min) / (max - min)) * 100;

const extractFeatures = (d) => ({
    f1: (d.spread || 0) * 100,
    f2: (d.migration || 0) * 100,
    f3: (d.youth || 0) * 10,
    f4: normalize(d.close, minClose, maxClose)
});

const getLorentzianDistance = (current, historical) => 
    Math.log(1 + Math.abs(current.f1 - historical.f1)) +
    Math.log(1 + Math.abs(current.f2 - historical.f2)) +
    Math.log(1 + Math.abs(current.f3 - historical.f3)) +
    Math.log(1 + Math.abs(current.f4 - historical.f4));

const trainingLabels = [];
for (let i = 0; i < data.length - 4; i++) {
    const futureClose = data[i + 4].close;
    const currentClose = data[i].close;
    trainingLabels.push(futureClose > currentClose * 1.01 ? 1 : futureClose < currentClose * 0.99 ? -1 : 0);
}
for (let i = 0; i < 4; i++) trainingLabels.push(0);

const featureArrays = data.map(extractFeatures);
const results = [];

for (let barIndex = maxBarsBack; barIndex < data.length; barIndex++) {
    const currentFeatures = featureArrays[barIndex];
    const distances = [];
    const predictions = [];
    let lastDistance = -1.0;

    for (let i = 0; i < maxBarsBack - 1; i++) {
        const historicalIndex = barIndex - 1 - i;
        if (historicalIndex < 0) continue;
        const d = getLorentzianDistance(currentFeatures, featureArrays[historicalIndex]);
        if (d >= lastDistance && i % 4 === 0) {
            lastDistance = d;
            distances.push(d);
            predictions.push(trainingLabels[historicalIndex]);
            if (predictions.length > neighborsCount) {
                lastDistance = distances[Math.round(neighborsCount * 0.75)];
                distances.shift();
                predictions.shift();
            }
        }
    }
    results.push({ time: data[barIndex].time, value: predictions.reduce((a, b) => a + b, 0) });
}
return results;
    `
};
