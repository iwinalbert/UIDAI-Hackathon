export interface VelocityDataPoint {
    date: string;
    enrolment_0_5: number;
    biometric_5_17: number;
}

export interface VelocityResult {
    date: string;
    velocity_enrolment: number;
    velocity_biometric: number;
    is_school_admission_spike: boolean;
    is_exclusion_zone: boolean;
}

// Calculate First Derivative: Velocity = (Current - Previous) / Delta_t (Assuming dt=1 day for this dataset)
export const calculateVelocity = (data: VelocityDataPoint[]): VelocityResult[] => {
    const results: VelocityResult[] = [];
    const SPIKE_THRESHOLD = 20; // Sigma threshold for "School Admission Effect"

    for (let i = 1; i < data.length; i++) {
        const current = data[i];
        const previous = data[i - 1];

        const velocity_enrolment = current.enrolment_0_5 - previous.enrolment_0_5;
        const velocity_biometric = current.biometric_5_17 - previous.biometric_5_17;

        // Rule 1: Positive Spike (> Sigma) -> School Admission Effect
        // We look for sudden acceleration in biometric updates for age 5-17
        const is_school_admission_spike = velocity_biometric > SPIKE_THRESHOLD;

        // Rule 2: Zero Velocity -> Exclusion Zone
        // If enrolment velocity is near 0 
        const is_exclusion_zone = Math.abs(velocity_enrolment) < 2;

        results.push({
            date: current.date,
            velocity_enrolment,
            velocity_biometric,
            is_school_admission_spike,
            is_exclusion_zone
        });
    }
    return results;
};
