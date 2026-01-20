const fs = require('fs');
const path = require('path');
const Papa = require('../UI/node_modules/papaparse');

// Config
const DATASET_DIR = path.resolve(__dirname, '../Dataset');
const OUTPUT_FILE = path.resolve(__dirname, '../UI/src/data/velocityData.json');
const TARGET_DISTRICT = 'Bengaluru Urban'; // Focusing on a specific district for the demo

// File Paths
const ENROLMENT_FILE = path.join(DATASET_DIR, 'api_data_aadhar_enrolment/api_data_aadhar_enrolment/api_data_aadhar_enrolment_0_500000.csv');
const BIOMETRIC_FILE = path.join(DATASET_DIR, 'api_data_aadhar_biometric/api_data_aadhar_biometric/api_data_aadhar_biometric_0_500000.csv');

// Helper to read CSV
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
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

const processData = async () => {
    try {
        console.log('Reading Datasets...');

        // Ensure output dir exists
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const [enrolmentData, biometricData] = await Promise.all([
            readCSV(ENROLMENT_FILE),
            readCSV(BIOMETRIC_FILE)
        ]);

        console.log(`Loaded ${enrolmentData.length} enrolment records and ${biometricData.length} biometric records.`);

        // Aggregate Data by Date for the Target District
        const aggregated = {};

        // Process Enrolment (age_0_5 for School Admission Effect/Exclusion Zone context)
        enrolmentData.forEach(row => {
            if (row.district === TARGET_DISTRICT && row.date) {
                if (!aggregated[row.date]) aggregated[row.date] = { date: row.date, enrolment_0_5: 0, biometric_5_17: 0 };
                aggregated[row.date].enrolment_0_5 += (row.age_0_5 || 0);
            }
        });

        // Process Biometric (bio_age_5_17 for School Admission Effect)
        biometricData.forEach(row => {
            if (row.district === TARGET_DISTRICT && row.date) {
                if (!aggregated[row.date]) aggregated[row.date] = { date: row.date, enrolment_0_5: 0, biometric_5_17: 0 };
                aggregated[row.date].biometric_5_17 += (row.bio_age_5_17 || 0);
            }
        });

        // Sort by Date
        const sortedData = Object.values(aggregated).sort((a, b) => {
            const dateA = new Date(a.date.split('-').reverse().join('-')); // DD-MM-YYYY to YYYY-MM-DD
            const dateB = new Date(b.date.split('-').reverse().join('-'));
            return dateA - dateB;
        });

        console.log(`Generated data for ${sortedData.length} days for district: ${TARGET_DISTRICT}`);

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedData, null, 2));
        console.log(`Successfully wrote velocity data to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error processing data:', error);
    }
};

processData();
