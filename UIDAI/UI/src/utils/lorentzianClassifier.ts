import type { OHLCData } from '../types';

/**
 * Lorentzian Classification for Aadhaar Identity Velocity Prediction
 * 
 * Adapted from jdehorty's PineScript indicator.
 * Uses Lorentzian Distance to measure proximity in "Identity-Time" space,
 * dampening the effect of Black Swan administrative events.
 * 
 * Features used:
 * - f1: Spread Index (Cohort)
 * - f2: Migration Index (Demo)
 * - f3: Youth Ratio (Enrol)
 * - f4: Normalized Close (Velocity)
 */

// --- Configuration ---
interface LorentzianSettings {
    neighborsCount: number;
    maxBarsBack: number;
    featureCount: number;
}

// --- Feature Extraction ---
interface FeatureSeries {
    f1: number; // Spread Index
    f2: number; // Migration Index
    f3: number; // Youth Ratio
    f4: number; // Normalized Velocity
}

/**
 * Calculates the Lorentzian Distance between two feature vectors.
 * Lorentzian: d = Σ log(1 + |x_i - y_i|)
 * This metric is more robust to outliers than Euclidean distance.
 */
function getLorentzianDistance(current: FeatureSeries, historical: FeatureSeries, featureCount: number): number {
    let distance = 0;
    distance += Math.log(1 + Math.abs(current.f1 - historical.f1));
    distance += Math.log(1 + Math.abs(current.f2 - historical.f2));
    if (featureCount >= 3) distance += Math.log(1 + Math.abs(current.f3 - historical.f3));
    if (featureCount >= 4) distance += Math.log(1 + Math.abs(current.f4 - historical.f4));
    return distance;
}

/**
 * Normalizes a value to a 0-100 range based on the min/max in the dataset.
 */
function normalize(value: number, min: number, max: number): number {
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 100;
}

/**
 * Extracts features from a single OHLC data point.
 */
function extractFeatures(d: OHLCData, stats: { minClose: number; maxClose: number }): FeatureSeries {
    return {
        f1: (d.spread || 0) * 100, // Scale to 0-100 range
        f2: (d.migration || 0) * 100,
        f3: (d.youth || 0) * 10, // Scale down for balance
        f4: normalize(d.close, stats.minClose, stats.maxClose),
    };
}

/**
 * Main Lorentzian Classification Function.
 * Returns an array of predictions (-1: Short/Decline, 0: Neutral, 1: Long/Accelerate)
 */
export function lorentzianClassify(
    data: OHLCData[],
    settings: LorentzianSettings = { neighborsCount: 8, maxBarsBack: 50, featureCount: 4 }
): { time: any; value: number; signal: 'accelerate' | 'decelerate' | 'neutral' }[] {
    if (data.length < settings.maxBarsBack + 5) {
        return [];
    }

    // --- Pre-calculate Statistics ---
    const closes = data.map(d => d.close);
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    const stats = { minClose, maxClose };

    // --- Training Labels: Direction over next 4 bars ---
    const trainingLabels: number[] = [];
    for (let i = 0; i < data.length - 4; i++) {
        const futureClose = data[i + 4].close;
        const currentClose = data[i].close;
        if (futureClose > currentClose * 1.01) {
            trainingLabels.push(1); // Accelerate
        } else if (futureClose < currentClose * 0.99) {
            trainingLabels.push(-1); // Decelerate
        } else {
            trainingLabels.push(0); // Neutral
        }
    }
    // Pad remaining labels
    for (let i = 0; i < 4; i++) trainingLabels.push(0);

    // --- Feature Arrays ---
    const featureArrays: FeatureSeries[] = data.map(d => extractFeatures(d, stats));

    // --- Run Classification ---
    const results: { time: any; value: number; signal: 'accelerate' | 'decelerate' | 'neutral' }[] = [];

    for (let barIndex = settings.maxBarsBack; barIndex < data.length; barIndex++) {
        const currentFeatures = featureArrays[barIndex];

        const distances: number[] = [];
        const predictions: number[] = [];
        let lastDistance = -1.0;

        // Approximate Nearest Neighbors Search with Lorentzian Distance
        const loopSize = Math.min(settings.maxBarsBack - 1, barIndex);

        for (let i = 0; i < loopSize; i++) {
            const historicalIndex = barIndex - 1 - i;
            if (historicalIndex < 0) continue;

            const historicalFeatures = featureArrays[historicalIndex];
            const d = getLorentzianDistance(currentFeatures, historicalFeatures, settings.featureCount);

            // Only consider every 4th bar (chronological spacing)
            if (d >= lastDistance && i % 4 === 0) {
                lastDistance = d;
                distances.push(d);
                predictions.push(trainingLabels[historicalIndex]);

                if (predictions.length > settings.neighborsCount) {
                    // Keep the threshold at the 75th percentile of distances
                    lastDistance = distances[Math.round(settings.neighborsCount * 0.75)];
                    distances.shift();
                    predictions.shift();
                }
            }
        }

        // Sum of predictions determines the signal
        const predictionSum = predictions.reduce((a, b) => a + b, 0);

        let signal: 'accelerate' | 'decelerate' | 'neutral' = 'neutral';
        if (predictionSum > 0) signal = 'accelerate';
        if (predictionSum < 0) signal = 'decelerate';

        results.push({
            time: data[barIndex].time,
            value: predictionSum,
            signal: signal,
        });
    }

    return results;
}

/**
 * Indicator Script Preset for the Lorentzian Classifier.
 * Returns the raw prediction sum for plotting.
 */
export const LORENTZIAN_PRESET = `
// Lorentzian KNN Classification Signal
// @type: pane
const neighborsCount = 8;
const maxBarsBack = Math.min(50, data.length - 5);
const featureCount = 4;

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
`;
