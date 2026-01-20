const fs = require('fs');
const path = require('path');
const Papa = require('../UI/node_modules/papaparse');

// Config
const DATASET_DIR = path.resolve(__dirname, '../Dataset');
const OUTPUT_FILE = path.resolve(__dirname, '../UI/src/data/velocityDataOHLCV.json');
const TARGET_DISTRICT = 'Bengaluru Urban';

// Files
const FILES = {
    enrolment: path.join(DATASET_DIR, 'api_data_aadhar_enrolment/api_data_aadhar_enrolment/api_data_aadhar_enrolment_0_500000.csv'),
    biometric: path.join(DATASET_DIR, 'api_data_aadhar_biometric/api_data_aadhar_biometric/api_data_aadhar_biometric_0_500000.csv'),
    demographic: path.join(DATASET_DIR, 'api_data_aadhar_demographic/api_data_aadhar_demographic/api_data_aadhar_demographic_0_500000.csv')
};

// Helper
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            resolve([]);
            return;
        }
        const fileContent = fs.readFileSync(filePath, 'utf8');
        Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

/*
    Logic:
    1. Group Raw Data by Date -> { date: { biometric: count, enrolment: count, demographic: count } }
    2. Sort by Date.
    3. Calculate Daily Velocity (V_t = Count_t - Count_t-1).
    4. Aggregate Daily Velocity into Weekly Candles (OHLC).
       Open: Velocity on Day 1 of week
       High: Max Daily Velocity in week
       Low: Min Daily Velocity in week
       Close: Velocity on Last Day of week
       Volume: Sum of counts (Total Updates) in week
*/

const processData = async () => {
    try {
        console.log('Reading Datasets...');

        const [enrolData, bioData, demoData] = await Promise.all([
            readCSV(FILES.enrolment),
            readCSV(FILES.biometric),
            readCSV(FILES.demographic)
        ]);

        console.log(`Initial Counts -> Enro: ${enrolData.length}, Bio: ${bioData.length}, Demo: ${demoData.length}`);

        // 1. Daily Aggregation
        const dailyStats = {};

        // Helper to aggregate
        const aggregateType = (data, typeKey, countField) => {
            data.forEach(row => {
                if (row.district === TARGET_DISTRICT && row.date) {
                    if (!dailyStats[row.date]) {
                        dailyStats[row.date] = { date: row.date, enrolment: 0, biometric: 0, demographic: 0 };
                    }
                    dailyStats[row.date][typeKey] += (row[countField] || 0);
                }
            });
        };

        aggregateType(enrolData, 'enrolment', 'age_0_5');
        aggregateType(bioData, 'biometric', 'bio_age_5_17');
        aggregateType(demoData, 'demographic', 'demo_age_5_17'); // Assuming column name based on others

        // Sort Data
        const sortedDays = Object.values(dailyStats).sort((a, b) => {
            const dateA = new Date(a.date.split('-').reverse().join('-'));
            const dateB = new Date(b.date.split('-').reverse().join('-'));
            return dateA - dateB;
        });

        // 2. Calculate Daily Velocities
        const dailyVelocities = [];
        for (let i = 1; i < sortedDays.length; i++) {
            const cur = sortedDays[i];
            const prev = sortedDays[i - 1];

            dailyVelocities.push({
                date: cur.date,
                isoDate: cur.date.split('-').reverse().join('-'), // YYYY-MM-DD

                v_enrolment: cur.enrolment - prev.enrolment,
                c_enrolment: cur.enrolment,

                v_biometric: cur.biometric - prev.biometric,
                c_biometric: cur.biometric,

                v_demographic: cur.demographic - prev.demographic,
                c_demographic: cur.demographic
            });
        }

        // 3. Weekly Aggregation (OHLC)
        // Group by Week Start
        const weeklyData = {}; // key: "YYYY-Www"

        dailyVelocities.forEach(day => {
            const d = new Date(day.isoDate);
            // Get Week Number (simple approximation or ISO)
            const onejan = new Date(d.getFullYear(), 0, 1);
            const weekNum = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
            const yearWeek = `${d.getFullYear()}-W${weekNum}`;

            if (!weeklyData[yearWeek]) {
                weeklyData[yearWeek] = {
                    time: day.isoDate, // Use start date of week for chart
                    raw_enrolment: [],
                    raw_biometric: [],
                    raw_demographic: [],
                    vol_enrolment: 0,
                    vol_biometric: 0,
                    vol_demographic: 0
                };
            }

            const w = weeklyData[yearWeek];
            w.raw_enrolment.push(day.v_enrolment);
            w.raw_biometric.push(day.v_biometric);
            w.raw_demographic.push(day.v_demographic);

            w.vol_enrolment += day.c_enrolment;
            w.vol_biometric += day.c_biometric;
            w.vol_demographic += day.c_demographic;
        });

        // Convert to OHLC Structure
        const generateOHLC = (rawArr) => {
            if (rawArr.length === 0) return { open: 0, high: 0, low: 0, close: 0 };
            return {
                open: rawArr[0],
                high: Math.max(...rawArr),
                low: Math.min(...rawArr),
                close: rawArr[rawArr.length - 1]
            };
        };

        const finalOutput = {
            biometric: [],
            enrolment: [],
            demographic: []
        };

        Object.values(weeklyData).forEach(w => {
            const ohlc_bio = generateOHLC(w.raw_biometric);
            const ohlc_enrol = generateOHLC(w.raw_enrolment);
            const ohlc_demo = generateOHLC(w.raw_demographic);

            finalOutput.biometric.push({
                time: w.time, ...ohlc_bio, volume: w.vol_biometric
            });
            finalOutput.enrolment.push({
                time: w.time, ...ohlc_enrol, volume: w.vol_enrolment
            });
            finalOutput.demographic.push({
                time: w.time, ...ohlc_demo, volume: w.vol_demographic
            });
        });

        // Ensure Output Dir
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput, null, 2));
        console.log(`Generated OHLCV Data: Bio(${finalOutput.biometric.length}), Enrol(${finalOutput.enrolment.length}), Demo(${finalOutput.demographic.length})`);

    } catch (error) {
        console.error('Error:', error);
    }
};

processData();
