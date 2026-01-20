import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OHLCData, Indicator, ChartEvent, Note } from '../types';

export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'All';

interface AppState {
    data: OHLCData[];
    setData: (data: OHLCData[]) => void;

    events: ChartEvent[];
    setEvents: (events: ChartEvent[]) => void;

    indicators: Indicator[];
    addIndicator: (indicator: Indicator) => void;
    removeIndicator: (id: string) => void;
    updateIndicator: (id: string, updates: Partial<Indicator>) => void;

    isIndicatorModalOpen: boolean;
    setIndicatorModalOpen: (open: boolean) => void;

    timeRange: TimeRange;
    setTimeRange: (range: TimeRange) => void;

    // UI State for persistence
    chartType: string;
    setChartType: (type: string) => void;

    selectedState: string;
    setSelectedState: (state: string) => void;

    selectedDistrict: string;
    setSelectedDistrict: (district: string) => void;

    primaryDataset: string;
    setPrimaryDataset: (dataset: string) => void;

    fusionList: string[];
    setFusionList: (list: string[]) => void;

    isFusionMode: boolean;
    setFusionMode: (mode: boolean) => void;

    // AI Analyst Notes
    notes: Note[];
    addNote: (note: Note) => void;
    removeNote: (id: string) => void;
    clearNotes: () => void;

    // Computed Indicator Data (Calculated Values)
    computedIndicatorData: Record<string, any[]>;
    setComputedIndicatorData: (id: string, data: any[]) => void;

    // Base Chart Data (TOON Format)
    baseChartData: any[];
    setBaseChartData: (data: any[]) => void;

    // Active News Events
    activeNewsEvents: ChartEvent[];
    setActiveNewsEvents: (events: ChartEvent[]) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            data: [],
            setData: (data) => set({ data }),

            events: [],
            setEvents: (events) => set({ events }),

            indicators: [],
            addIndicator: (indicator) => set((state) => ({ indicators: [...state.indicators, indicator] })),
            removeIndicator: (id) => set((state) => ({ indicators: state.indicators.filter((i) => i.id !== id) })),
            updateIndicator: (id, updates) => set((state) => ({
                indicators: state.indicators.map((i) => i.id === id ? { ...i, ...updates } : i)
            })),
            isIndicatorModalOpen: false,
            setIndicatorModalOpen: (open) => set({ isIndicatorModalOpen: open }),

            timeRange: 'All',
            setTimeRange: (range) => set({ timeRange: range }),

            // UI State Defaults
            chartType: 'candles',
            setChartType: (chartType) => set({ chartType }),

            selectedState: '',
            setSelectedState: (selectedState) => set({ selectedState }),

            selectedDistrict: '',
            setSelectedDistrict: (selectedDistrict) => set({ selectedDistrict }),

            primaryDataset: 'biometric',
            setPrimaryDataset: (primaryDataset) => set({ primaryDataset }),

            fusionList: [],
            setFusionList: (fusionList) => set({ fusionList }),

            isFusionMode: false,
            setFusionMode: (isFusionMode) => set({ isFusionMode }),

            notes: [],
            addNote: (note) => set((state) => {
                // Prevent duplicates
                if (state.notes.some(n => n.id === note.id)) return state;
                return { notes: [note, ...state.notes] };
            }),
            removeNote: (id) => set((state) => ({
                notes: state.notes.filter(n => n.id !== id)
            })),
            clearNotes: () => set({ notes: [] }),

            computedIndicatorData: {},
            setComputedIndicatorData: (id, data) => set((state) => ({
                computedIndicatorData: { ...state.computedIndicatorData, [id]: data }
            })),

            baseChartData: [],
            setBaseChartData: (data) => set({ baseChartData: data }),

            activeNewsEvents: [],
            setActiveNewsEvents: (events) => set({ activeNewsEvents: events }),
        }),
        {
            name: 'uidai-ui-session-store',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                indicators: state.indicators,
                timeRange: state.timeRange,
                chartType: state.chartType,
                selectedState: state.selectedState,
                selectedDistrict: state.selectedDistrict,
                primaryDataset: state.primaryDataset,
                fusionList: state.fusionList,
                isFusionMode: state.isFusionMode,
                notes: state.notes,
            }),
        }
    )
);
