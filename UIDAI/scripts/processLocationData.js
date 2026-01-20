const fs = require('fs');
const path = require('path');
const Papa = require('../UI/node_modules/papaparse');

// Config
const DATASET_DIR = path.resolve(__dirname, '../Dataset');
const OUTPUT_FILE = path.resolve(__dirname, '../UI/src/data/velocityDataByLocation.json');

// Files
const FILES = {
    enrolment: path.join(DATASET_DIR, 'api_data_aadhar_enrolment/api_data_aadhar_enrolment/api_data_aadhar_enrolment_0_500000.csv'),
    biometric: path.join(DATASET_DIR, 'api_data_aadhar_biometric/api_data_aadhar_biometric/api_data_aadhar_biometric_0_500000.csv'),
    demographic: path.join(DATASET_DIR, 'api_data_aadhar_demographic/api_data_aadhar_demographic/api_data_aadhar_demographic_0_500000.csv')
};

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

// State Name Alias Normalization
// Maps all known aliases (case-insensitive) to official names
const STATE_ALIASES = {
    // Andaman and Nicobar Islands
    'andaman & nicobar islands': 'Andaman and Nicobar Islands',
    'andaman and nicobar islands': 'Andaman and Nicobar Islands',

    // Andhra Pradesh
    'andhra pradesh': 'Andhra Pradesh',

    // Arunachal Pradesh
    'arunachal pradesh': 'Arunachal Pradesh',

    // Assam
    'assam': 'Assam',

    // Bihar
    'bihar': 'Bihar',

    // Chandigarh
    'chandigarh': 'Chandigarh',

    // Chhattisgarh
    'chattisgarh': 'Chhattisgarh',
    'chhatisgarh': 'Chhattisgarh',
    'chhattisgarh': 'Chhattisgarh',

    // Dadra and Nagar Haveli and Daman and Diu (merged UT)
    'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'the dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'the dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',

    // Delhi
    'delhi': 'Delhi',

    // Goa
    'goa': 'Goa',

    // Gujarat
    'gujarat': 'Gujarat',

    // Haryana
    'haryana': 'Haryana',

    // Himachal Pradesh
    'himachal pradesh': 'Himachal Pradesh',

    // Jammu and Kashmir
    'jammu & kashmir': 'Jammu and Kashmir',
    'jammu and kashmir': 'Jammu and Kashmir',
    'jammu and kashmir': 'Jammu and Kashmir',

    // Jharkhand
    'jharkhand': 'Jharkhand',

    // Karnataka
    'karnataka': 'Karnataka',

    // Kerala
    'kerala': 'Kerala',

    // Ladakh
    'ladakh': 'Ladakh',

    // Lakshadweep
    'lakshadweep': 'Lakshadweep',

    // Madhya Pradesh
    'madhya pradesh': 'Madhya Pradesh',

    // Maharashtra
    'maharashtra': 'Maharashtra',

    // Manipur
    'manipur': 'Manipur',

    // Meghalaya
    'meghalaya': 'Meghalaya',

    // Mizoram
    'mizoram': 'Mizoram',

    // Nagaland
    'nagaland': 'Nagaland',

    // Odisha
    'odisha': 'Odisha',
    'ODISHA': 'Odisha',
    'orissa': 'Odisha',

    // Puducherry
    'pondicherry': 'Puducherry',
    'puducherry': 'Puducherry',

    // Punjab
    'punjab': 'Punjab',

    // Rajasthan
    'rajasthan': 'Rajasthan',

    // Sikkim
    'sikkim': 'Sikkim',

    // Tamil Nadu
    'tamil nadu': 'Tamil Nadu',

    // Telangana
    'telangana': 'Telangana',

    // Tripura
    'tripura': 'Tripura',

    // Uttar Pradesh
    'uttar pradesh': 'Uttar Pradesh',

    // Uttarakhand
    'uttaranchal': 'Uttarakhand',
    'uttarakhand': 'Uttarakhand',

    // West Bengal
    'west bengal': 'West Bengal',
    'WEST BENGAL': 'West Bengal',
    'WESTBENGAL': 'West Bengal',
    'westbengal': 'West Bengal',
    'west  bengal': 'West Bengal',  // double space
    'west bangal': 'West Bengal',
    'west bangla': 'West Bengal',
    'west bengli': 'West Bengal',

    // Invalid data - filter out by returning null
    '100000': null,
    'darbhanga': null,  // This is a district in Bihar
    'puttenahalli': null,  // This is a locality
};

// District Name Alias Normalization
// Maps all known district aliases (case-insensitive) to official names
const DISTRICT_ALIASES = {
    // Case normalization - All-Caps to Proper Case
    'ANGUL': 'Angul',
    'ANUGUL': 'Anugul',
    'BALANGIR': 'Balangir',
    'HOOGHLY': 'Hooghly',
    'HOWRAH': 'Howrah',
    'JAJPUR': 'Jajpur',
    'KOLKATA': 'Kolkata',
    'MALDA': 'Malda',
    'NADIA': 'Nadia',
    'NUAPADA': 'Nuapada',

    // Case normalization - lowercase to Proper Case
    'angul': 'Angul',
    'chittoor': 'Chittoor',
    'east midnapore': 'East Midnapore',
    'hooghly': 'Hooghly',
    'jajpur': 'Jajpur',
    'nadia': 'Nadia',
    'rangareddi': 'Rangareddy',
    'udhampur': 'Udhampur',
    'yadgir': 'Yadgir',

    // Spelling variations & alternative names
    'anugul': 'Angul',
    'baleshwar': 'Balasore',
    'baleswar': 'Balasore',
    'bangalore': 'Bengaluru Urban',
    'bangalore rural': 'Bengaluru Rural',
    'belagavi': 'Belagavi',
    'belgaum': 'Belagavi',
    'bellary': 'Ballari',
    'bijapur(kar)': 'Vijayapura',
    'bulandshahar': 'Bulandshahr',
    'chamarajanagar': 'Chamarajanagar',
    'chamrajanagar': 'Chamarajanagar',
    'chamrajnagar': 'Chamarajanagar',
    'chickmagalur': 'Chikkamagaluru',
    'chikmagalur': 'Chikkamagaluru',
    'coochbehar': 'Cooch Behar',
    'koch bihar': 'Cooch Behar',
    'cuddapah': 'YSR Kadapa',
    'davangere': 'Davanagere',
    'gulbarga': 'Kalaburagi',
    'gurgaon': 'Gurugram',
    'haora': 'Howrah',
    'hawrah': 'Howrah',
    'hasan': 'Hassan',
    'hazaribag': 'Hazaribagh',
    'hooghiy': 'Hooghly',
    'hugli': 'Hooghly',
    'koderma': 'Kodarma',
    'mysore': 'Mysuru',
    'shimoga': 'Shivamogga',
    'tumkur': 'Tumakuru',

    // Remove special characters (asterisks and trailing spaces)
    'bagalkot *': 'Bagalkot',
    'baghpat *': 'Baghpat',
    'bokaro *': 'Bokaro',
    'chamarajanagar *': 'Chamarajanagar',
    'dhalai  *': 'Dhalai',
    'gadag *': 'Gadag',
    'garhwa *': 'Garhwa',
    'gondiya *': 'Gondiya',
    'harda *': 'Harda',
    'haveri *': 'Haveri',
    'hingoli *': 'Hingoli',
    'jajapur  *': 'Jajpur',
    'jhajjar *': 'Jhajjar',
    'kushinagar *': 'Kushinagar',
    'mahoba *': 'Mahoba',
    'namakkal   *': 'Namakkal',
    'nandurbar *': 'Nandurbar',
    'north east   *': 'North East Delhi',
    'udupi *': 'Udupi',
    'washim *': 'Washim',
    'deeg ': 'Deeg',

    // Unicode/encoding issues
    'medchal?malkajgiri': 'Medchal-Malkajgiri',
    'medchal−malkajgiri': 'Medchal-Malkajgiri',
    'medchal–malkajgiri': 'Medchal-Malkajgiri',
    'medchal-malkajgiri': 'Medchal-Malkajgiri',
    'medchal malkajgiri': 'Medchal-Malkajgiri',

    // Spacing and compound name variations
    'south 24 pargana': 'South 24 Parganas',
    'south 24 parganas': 'South 24 Parganas',
    '24 paraganas south': 'South 24 Parganas',
    'south twenty four parganas': 'South 24 Parganas',
    '24 paraganas north': 'North 24 Parganas',
    'north twenty four parganas': 'North 24 Parganas',
    'north 24 parganas': 'North 24 Parganas',
    'ahmadabad': 'Ahmedabad',
    'ahmed nagar': 'Ahmednagar',
    'ahmadnagar': 'Ahmednagar',
    'ahilyanagar': 'Ahmednagar',
    'ananthapur': 'Anantapur',
    'ananthapuramu': 'Anantapur',
    'aurangabad(bh)': 'Aurangabad',
    'aurangabad(BH)': 'Aurangabad',
    'bara banki': 'Barabanki',
    'barddhaman': 'Bardhaman',
    'burdwan': 'Bardhaman',
    'buldhana': 'Buldhana',
    'buldana': 'Buldhana',
    'darjiling': 'Darjeeling',
    'dinajpur dakshin': 'Dakshin Dinajpur',
    'dinajpur uttar': 'Uttar Dinajpur',
    'east singhbum': 'East Singhbhum',
    'gaurella pendra marwahi': 'Gaurela-Pendra-Marwahi',
    'gaurela pendra marwahi': 'Gaurela-Pendra-Marwahi',
    'gaurela-pendra-marwahi': 'Gaurela-Pendra-Marwahi',
    'jagatsinghapur': 'Jagatsinghpur',
    'jajapur': 'Jajpur',
    'jangoan': 'Jangaon',
    'janjgir - champa': 'Janjgir-Champa',
    'janjgir champa': 'Janjgir-Champa',
    'janjgir-champa': 'Janjgir-Champa',
    'jhunjhunun': 'Jhunjhunu',
    'k.v.rangareddy': 'Rangareddy',
    'k.v. rangareddy': 'Rangareddy',
    'kabeerdham': 'Kabirdham',
    'kancheepuram': 'Kanchipuram',
    'kanniyakumari': 'Kanyakumari',
    'karim nagar': 'Karimnagar',
    'kasargod': 'Kasaragod',
    'khorda': 'Khordha',
    'kushi nagar': 'Kushinagar',
    'lahul & spiti': 'Lahaul and Spiti',
    'lahul and spiti': 'Lahaul and Spiti',
    'leh (ladakh)': 'Leh',
    'mahabub nagar': 'Mahabubnagar',
    'mahbubnagar': 'Mahabubnagar',
    'mahrajganj': 'Maharajganj',
    'maldah': 'Malda',
    'mammit': 'Mamit',
    'manendragarhchirmiri bharatpur': 'Manendragarh-Chirmiri-Bharatpur',
    'manendragarh–chirmiri–bharatpur': 'Manendragarh-Chirmiri-Bharatpur',
    'marigaon': 'Morigaon',
    'medinipur west': 'Paschim Medinipur',
    'mohalla-manpur-ambagarh chowki': 'Mohla-Manpur-Ambagarh Chouki',
    'mohla-manpur-ambagarh chouki': 'Mohla-Manpur-Ambagarh Chouki',
    'monghyr': 'Munger',
    'mumbai( sub urban )': 'Mumbai Suburban',
    'mumbai city': 'Mumbai',
    'nabarangpur': 'Nabarangapur',
    'narmadapuram': 'Narmadapuram',
    'narsinghpur': 'Narsimhapur',
    'nawanshahr': 'Shaheed Bhagat Singh Nagar',
    'nicobar': 'Nicobars',
    'andamans': 'North and Middle Andaman',
    'north and middle andaman': 'North and Middle Andaman',
    'pakaur': 'Pakur',
    'palamu': 'Palamau',
    'panch mahals': 'Panchmahal',
    'panchmahals': 'Panchmahal',
    'pashchim champaran': 'West Champaran',
    'pashchimi singhbhum': 'West Singhbhum',
    'purba champaran': 'Purba Champaran',
    'purbi champaran': 'Purba Champaran',
    'purbi singhbhum': 'Purba Singhbhum',
    'puruliya': 'Purulia',
    'rae bareli': 'Raebareli',
    'raigarh(mh)': 'Raigad',
    'rajauri': 'Rajouri',
    'ramanagar': 'Ramanagara',
    's.a.s nagar': 'Sahibzada Ajit Singh Nagar',
    's.a.s nagar(mohali)': 'Sahibzada Ajit Singh Nagar',
    'sas nagar (mohali)': 'Sahibzada Ajit Singh Nagar',
    'mohali': 'Sahibzada Ajit Singh Nagar',
    'sabar kantha': 'Sabarkantha',
    'banas kantha': 'Banaskantha',
    'sahebganj': 'Sahibganj',
    'samstipur': 'Samastipur',
    'sarangarh-bilaigarh': 'Sarangarh-Bilaigarh',
    'seraikela-kharsawan': 'Seraikela-Kharsawan',
    'seraikela-kharsawan': 'Seraikela-Kharsawan',
    'sheikhpura': 'Sheikhpura',
    'sheikpura': 'Sheikhpura',
    'shrawasti': 'Shravasti',
    'shupiyan': 'Shopian',
    'sibsagar': 'Sivasagar',
    'siddharth nagar': 'Siddharthnagar',
    'south dumdum(m)': 'South Dum Dum',
    'spsr nellore': 'Sri Potti Sriramulu Nellore',
    'sri sathya sai': 'Sri Sathya Sai',
    'sundergarh': 'Sundargarh',
    'surendra nagar': 'Surendranagar',
    'tamulpur district': 'Tamulpur',
    'tarn taran': 'Tarn Taran',
    'tuticorin': 'Thoothukudi',
    'thoothukkudi': 'Thoothukudi',
    'viluppuram': 'Villupuram',
    'visakhapatanam': 'Visakhapatnam',
    'warangal (urban)': 'Warangal Urban',
    'west midnapore': 'Paschim Medinipur',
    'y. s. r': 'YSR Kadapa',
    'yadadri.': 'Yadadri Bhuvanagiri',
    'yamuna nagar': 'Yamunanagar',
    'chatrapati sambhaji nagar': 'Chhatrapati Sambhajinagar',
    'chhatrapati sambhajinagar': 'Chhatrapati Sambhajinagar',
    'dharashiv': 'Dharashiv',
    'n. t. r': 'NTR',
    'didwana-kuchaman': 'Didwana-Kuchaman',
    'khairagarh chhuikhadan gandai': 'Khairagarh-Chhuikhadan-Gandai',
    'khairthal-tijara': 'Khairthal-Tijara',
    'kotputli-behror': 'Kotputli-Behror',
    'salumbar': 'Salumbar',
    'badgam': 'Budgam',
    'bandipur': 'Bandipore',
    'bhabua': 'Kaimur',
    'kaimur (bhabua)': 'Kaimur',
    'budaun': 'Budaun',
    'bulandshahr': 'Bulandshahr',
    'allahabad': 'Prayagraj',
    'ayodhya': 'Ayodhya',
    'faizabad': 'Ayodhya',
    'bagpat': 'Baghpat',
    'balotra': 'Balotra',
    'beawar': 'Beawar',
    'bid': 'Beed',
    'bishnupur': 'Bishnupur',
    'budgam': 'Budgam',
    'dadra & nagar haveli': 'Dadra and Nagar Haveli',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli',
    'darbhanga': 'Darbhanga',
    'dohad': 'Dahod',
    'dahod': 'Dahod',
    'debagarh': 'Deogarh',
    'dhaulpur': 'Dholpur',
    'dholpur': 'Dholpur',
    'dist : thane': 'Thane',
    'jyotiba phule nagar': 'Amroha',
    'kachchh': 'Kachchh',
    'phalodi': 'Phalodi',
    'punch': 'Poonch',
    'purnea': 'Purnia',

    // Invalid/data quality issues - map to null
    '100000': null,
    '5th cross': null,
    'near university thana': null,
    'bally jagachha': null,
    'domjur': null,
    'sonapur': null,
    'balianta': null,
    'puttenahalli': null,
    'east': null,
    'west': null,
    'north': null,
    'south': null,
};

// Normalize state name to official name
const normalizeState = (stateName) => {
    if (!stateName) return stateName;
    const stateStr = String(stateName).trim();
    const normalized = stateStr.toLowerCase();
    const result = STATE_ALIASES[normalized];

    // If mapped to null, it's invalid data
    if (result === null) return null;

    // Return official name or original if no mapping found
    return result !== undefined ? result : stateStr;
};

// Normalize district name to official name
const normalizeDistrict = (districtName) => {
    if (!districtName) return districtName;
    const districtStr = String(districtName).trim();
    const normalized = districtStr.toLowerCase();
    const result = DISTRICT_ALIASES[normalized];

    // If mapped to null, it's invalid data
    if (result === null) return null;

    // Return official name or original if no mapping found
    return result !== undefined ? result : districtStr;
};

/*
    Output Structure:
    {
        states: ["Karnataka", "Maharashtra", ...],
        districts: {
            "Karnataka": ["Bengaluru Urban", "Mysuru", ...],
            ...
        },
        data: {
            "Karnataka|Bengaluru Urban": {
                biometric: [{time, open, high, low, close, volume}, ...],
                enrolment: [...],
                demographic: [...]
            },
            ...
        }
    }
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

        // Extract unique States and Districts
        const stateDistrictMap = {}; // { state: Set<district> }

        const extractLocations = (data) => {
            data.forEach(row => {
                if (row.state && row.district) {
                    const normalizedState = normalizeState(row.state);
                    const normalizedDistrict = normalizeDistrict(row.district);

                    // Skip if either state or district is invalid (mapped to null)
                    if (!normalizedState || normalizedState === null ||
                        !normalizedDistrict || normalizedDistrict === null) {
                        return;
                    }

                    if (!stateDistrictMap[normalizedState]) {
                        stateDistrictMap[normalizedState] = new Set();
                    }
                    stateDistrictMap[normalizedState].add(normalizedDistrict);
                }
            });
        };

        extractLocations(enrolData);
        extractLocations(bioData);
        extractLocations(demoData);

        const states = Object.keys(stateDistrictMap).sort();
        const districts = {};
        states.forEach(state => {
            districts[state] = Array.from(stateDistrictMap[state]).sort();
        });

        console.log(`Found ${states.length} states with districts.`);

        // Group daily data by State|District
        const locationDailyStats = {}; // { "State|District": { date: { enrolment, biometric, demographic } } }

        const aggregateType = (data, typeKey, fields) => {
            data.forEach(row => {
                if (!row.state || !row.district || !row.date) return;

                const normalizedState = normalizeState(row.state);
                const normalizedDistrict = normalizeDistrict(row.district);

                // Skip invalid data
                if (!normalizedState || normalizedState === null ||
                    !normalizedDistrict || normalizedDistrict === null) {
                    return;
                }

                const locKey = `${normalizedState}|${normalizedDistrict}`;

                if (!locationDailyStats[locKey]) {
                    locationDailyStats[locKey] = {};
                }

                if (!locationDailyStats[locKey][row.date]) {
                    locationDailyStats[locKey][row.date] = {
                        date: row.date,
                        enrolment: {},
                        biometric: {},
                        demographic: {}
                    };
                }

                fields.forEach(field => {
                    locationDailyStats[locKey][row.date][typeKey][field] =
                        (locationDailyStats[locKey][row.date][typeKey][field] || 0) + (row[field] || 0);
                });
            });
        };

        aggregateType(enrolData, 'enrolment', ['age_0_5', 'age_5_17', 'age_18_greater']);
        aggregateType(bioData, 'biometric', ['bio_age_5_17', 'bio_age_17_']);
        aggregateType(demoData, 'demographic', ['demo_age_5_17', 'demo_age_17_']);

        // Process each location to weekly OHLC
        const generateOHLC = (rawArr) => {
            if (rawArr.length === 0) return { open: 0, high: 0, low: 0, close: 0 };
            return {
                open: rawArr[0],
                high: Math.max(...rawArr),
                low: Math.min(...rawArr),
                close: rawArr[rawArr.length - 1]
            };
        };

        const locationData = {}; // Final data grouped by location

        Object.entries(locationDailyStats).forEach(([locKey, dateMap]) => {
            // Sort by date
            const sortedDays = Object.values(dateMap).sort((a, b) => {
                const dateA = new Date(a.date.split('-').reverse().join('-'));
                const dateB = new Date(b.date.split('-').reverse().join('-'));
                return dateA - dateB;
            });

            // Calculate daily velocities and fusion metrics
            const dailyMetrics = [];
            for (let i = 1; i < sortedDays.length; i++) {
                const cur = sortedDays[i];
                const prev = sortedDays[i - 1];

                // --- Biometric Fusion ---
                const bioCur = cur.biometric;
                const bioPrev = prev.biometric;
                const bio5_V = (bioCur.bio_age_5_17 || 0) - (bioPrev.bio_age_5_17 || 0);
                const bio17_V = (bioCur.bio_age_17_ || 0) - (bioPrev.bio_age_17_ || 0);

                const complianceScore = (1.5 * bio5_V) + (1.0 * bio17_V);
                const totalBioVol = (bioCur.bio_age_5_17 || 0) + (bioCur.bio_age_17_ || 0);
                const spreadIndex = totalBioVol > 0 ? (bioCur.bio_age_5_17 - bioCur.bio_age_17_) / totalBioVol : 0;

                // --- Demographic Fusion ---
                const demoCur = cur.demographic;
                const demoPrev = prev.demographic;
                const demoYoungV = (demoCur.demo_age_5_17 || 0) - (demoPrev.demo_age_5_17 || 0);
                const demoAdultV = (demoCur.demo_age_17_ || 0) - (demoPrev.demo_age_17_ || 0);

                const totalMobility = demoYoungV + demoAdultV;
                const migrationIndex = (demoCur.demo_age_17_ || 0) > 0
                    ? (demoCur.demo_age_5_17 || 0) / (demoCur.demo_age_17_ || 0)
                    : 0;

                // --- Enrolment Fusion ---
                const enrolCur = cur.enrolment;
                const enrolPrev = prev.enrolment;
                const e0_5V = (enrolCur.age_0_5 || 0) - (enrolPrev.age_0_5 || 0);
                const e5_17V = (enrolCur.age_5_17 || 0) - (enrolPrev.age_5_17 || 0);
                const e18V = (enrolCur.age_18_greater || 0) - (enrolPrev.age_18_greater || 0);

                const totalEnrolVol = e0_5V + e5_17V + e18V;
                const totalEnrolled = (enrolCur.age_18_greater || 0);
                const youthRatio = totalEnrolled > 0 ? ((enrolCur.age_0_5 || 0) + (enrolCur.age_5_17 || 0)) / totalEnrolled : 0;
                const workloadIndex = (1.0 * e0_5V) + (0.5 * e5_17V) + (0.1 * e18V);

                dailyMetrics.push({
                    date: cur.date,
                    isoDate: cur.date.split('-').reverse().join('-'),

                    biometric: {
                        main: complianceScore,
                        spread: spreadIndex,
                        volume: totalBioVol
                    },
                    demographic: {
                        main: totalMobility,
                        migration: migrationIndex,
                        volume: (demoCur.demo_age_5_17 || 0) + (demoCur.demo_age_17_ || 0)
                    },
                    enrolment: {
                        main: totalEnrolVol,
                        youth: youthRatio,
                        workload: workloadIndex,
                        volume: (enrolCur.age_0_5 || 0) + (enrolCur.age_5_17 || 0) + (enrolCur.age_18_greater || 0)
                    }
                });
            }

            // Weekly Aggregation
            const weeklyData = {};

            dailyMetrics.forEach(day => {
                const d = new Date(day.isoDate);
                const onejan = new Date(d.getFullYear(), 0, 1);
                const weekNum = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
                const yearWeek = `${d.getFullYear()}-W${weekNum}`;

                if (!weeklyData[yearWeek]) {
                    weeklyData[yearWeek] = {
                        time: day.isoDate,
                        biometric: { raw: [], volume: 0, spreads: [] },
                        demographic: { raw: [], volume: 0, migrations: [] },
                        enrolment: { raw: [], volume: 0, youths: [], workloads: [] }
                    };
                }

                const w = weeklyData[yearWeek];

                w.biometric.raw.push(day.biometric.main);
                w.biometric.volume += day.biometric.volume;
                w.biometric.spreads.push(day.biometric.spread);

                w.demographic.raw.push(day.demographic.main);
                w.demographic.volume += day.demographic.volume;
                w.demographic.migrations.push(day.demographic.migration);

                w.enrolment.raw.push(day.enrolment.main);
                w.enrolment.volume += day.enrolment.volume;
                w.enrolment.youths.push(day.enrolment.youth);
                w.enrolment.workloads.push(day.enrolment.workload);
            });

            // Generate OHLC output
            const ohlcOutput = {
                biometric: [],
                enrolment: [],
                demographic: []
            };

            Object.values(weeklyData).forEach(w => {
                const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

                ohlcOutput.biometric.push({
                    time: w.time,
                    ...generateOHLC(w.biometric.raw),
                    volume: w.biometric.volume,
                    spread: avg(w.biometric.spreads),
                    raw_bio: w.biometric.volume
                });
                ohlcOutput.demographic.push({
                    time: w.time,
                    ...generateOHLC(w.demographic.raw),
                    volume: w.demographic.volume,
                    migration: avg(w.demographic.migrations)
                });
                ohlcOutput.enrolment.push({
                    time: w.time,
                    ...generateOHLC(w.enrolment.raw),
                    volume: w.enrolment.volume,
                    youth: avg(w.enrolment.youths),
                    workload: avg(w.enrolment.workloads),
                    raw_enrol: w.enrolment.volume
                });
            });

            locationData[locKey] = ohlcOutput;
        });

        // Final Output
        const output = {
            states,
            districts,
            data: locationData
        };

        // Write
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

        console.log(`Generated location-based OHLCV data for ${Object.keys(locationData).length} state-district combinations.`);

    } catch (error) {
        console.error('Error:', error);
    }
};

processData();
