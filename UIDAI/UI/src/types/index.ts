import type { Time } from 'lightweight-charts';

export interface OHLCData {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    spread?: number;
    migration?: number;
    youth?: number;
    workload?: number;
    raw_bio?: number;
    raw_enrol?: number;
}

export interface SeriesData {
    time: Time;
    value: number;
}

export type IndicatorType = 'overlay' | 'pane';

export interface Indicator {
    id: string;
    name: string;
    type: IndicatorType;
    script: string;
    visible: boolean;
    color: string;
    lineWidth?: number;
}

export interface ChartEvent {
    id: string;
    time: Time;
    type: 'news' | 'split' | 'election' | 'technology' | 'policy' | 'camp' | 'other';
    title: string;
    description: string;
    url?: string;
    icon?: string;
    color?: string;
    details?: {
        source?: string;
        dateStr?: string;
        headline?: string;
    }[];
}

export interface Note {
    id: string;
    title: string;
    description: string;
    location?: string;
    url?: string;
    savedAt: string;
    type: 'ai' | 'news' | 'user';
}
