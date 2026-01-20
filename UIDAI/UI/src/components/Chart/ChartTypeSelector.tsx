import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export type ChartType =
    | 'candles'
    | 'hollow_candles'
    | 'bars'
    | 'line'
    | 'line_markers'
    | 'step_line'
    | 'area'
    | 'hlc_area'
    | 'baseline'
    | 'columns'
    | 'high_low'
    | 'heikin_ashi';

interface ChartTypeOption {
    value: ChartType;
    label: string;
    icon: React.ReactNode;
    group?: string;
}

// Custom SVG icons for chart types
const ChartIcons = {
    bars: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="6" y1="4" x2="6" y2="20" />
            <line x1="4" y1="8" x2="6" y2="8" />
            <line x1="6" y1="16" x2="8" y2="16" />
            <line x1="12" y1="6" x2="12" y2="18" />
            <line x1="10" y1="10" x2="12" y2="10" />
            <line x1="12" y1="14" x2="14" y2="14" />
            <line x1="18" y1="3" x2="18" y2="21" />
            <line x1="16" y1="7" x2="18" y2="7" />
            <line x1="18" y1="17" x2="20" y2="17" />
        </svg>
    ),
    candles: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="8" width="4" height="8" fill="currentColor" />
            <line x1="6" y1="4" x2="6" y2="8" />
            <line x1="6" y1="16" x2="6" y2="20" />
            <rect x="10" y="6" width="4" height="10" />
            <line x1="12" y1="3" x2="12" y2="6" />
            <line x1="12" y1="16" x2="12" y2="21" />
            <rect x="16" y="9" width="4" height="6" fill="currentColor" />
            <line x1="18" y1="5" x2="18" y2="9" />
            <line x1="18" y1="15" x2="18" y2="19" />
        </svg>
    ),
    hollow_candles: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="8" width="4" height="8" />
            <line x1="6" y1="4" x2="6" y2="8" />
            <line x1="6" y1="16" x2="6" y2="20" />
            <rect x="10" y="6" width="4" height="10" />
            <line x1="12" y1="3" x2="12" y2="6" />
            <line x1="12" y1="16" x2="12" y2="21" />
            <rect x="16" y="9" width="4" height="6" />
            <line x1="18" y1="5" x2="18" y2="9" />
            <line x1="18" y1="15" x2="18" y2="19" />
        </svg>
    ),
    line: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="2,18 7,12 12,15 17,7 22,10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    line_markers: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="2,18 7,12 12,15 17,7 22,10" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="15" r="2" fill="currentColor" />
            <circle cx="17" cy="7" r="2" fill="currentColor" />
        </svg>
    ),
    step_line: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2,18 H7 V12 H12 V15 H17 V7 H22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    area: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2,18 L7,12 L12,15 L17,7 L22,10 V20 H2 Z" fill="currentColor" fillOpacity="0.3" />
            <polyline points="2,18 7,12 12,15 17,7 22,10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    hlc_area: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2,14 L7,8 L12,11 L17,5 L22,8 V16 L17,12 L12,15 L7,12 L2,18 Z" fill="currentColor" fillOpacity="0.3" />
            <polyline points="2,14 7,8 12,11 17,5 22,8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="2,18 7,12 12,15 17,12 22,16" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
    ),
    baseline: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="2,2" opacity="0.5" />
            <path d="M2,12 L5,8 L8,10 L11,6 L14,9" stroke="#26a69a" />
            <path d="M14,9 L17,14 L20,16 L22,13" stroke="#ef5350" />
        </svg>
    ),
    columns: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="10" width="3" height="10" fill="currentColor" fillOpacity="0.5" />
            <rect x="8" y="6" width="3" height="14" fill="currentColor" fillOpacity="0.5" />
            <rect x="13" y="12" width="3" height="8" fill="currentColor" fillOpacity="0.5" />
            <rect x="18" y="4" width="3" height="16" fill="currentColor" fillOpacity="0.5" />
        </svg>
    ),
    high_low: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="6" width="4" height="12" rx="1" fill="none" />
            <rect x="10" y="4" width="4" height="16" rx="1" fill="none" />
            <rect x="16" y="8" width="4" height="8" rx="1" fill="none" />
        </svg>
    ),
    heikin_ashi: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="8" width="4" height="8" fill="currentColor" rx="0.5" />
            <line x1="6" y1="6" x2="6" y2="8" />
            <line x1="6" y1="16" x2="6" y2="18" />
            <rect x="10" y="7" width="4" height="9" rx="0.5" />
            <line x1="12" y1="5" x2="12" y2="7" />
            <line x1="12" y1="16" x2="12" y2="19" />
            <rect x="16" y="6" width="4" height="10" rx="0.5" />
            <line x1="18" y1="4" x2="18" y2="6" />
            <line x1="18" y1="16" x2="18" y2="20" />
        </svg>
    ),
};

const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
    { value: 'bars', label: 'Bars', icon: ChartIcons.bars, group: 'ohlc' },
    { value: 'candles', label: 'Candles', icon: ChartIcons.candles, group: 'ohlc' },
    { value: 'hollow_candles', label: 'Hollow candles', icon: ChartIcons.hollow_candles, group: 'ohlc' },
    { value: 'line', label: 'Line', icon: ChartIcons.line, group: 'line' },
    { value: 'line_markers', label: 'Line with markers', icon: ChartIcons.line_markers, group: 'line' },
    { value: 'step_line', label: 'Step line', icon: ChartIcons.step_line, group: 'line' },
    { value: 'area', label: 'Area', icon: ChartIcons.area, group: 'area' },
    { value: 'hlc_area', label: 'HLC area', icon: ChartIcons.hlc_area, group: 'area' },
    { value: 'baseline', label: 'Baseline', icon: ChartIcons.baseline, group: 'area' },
    { value: 'columns', label: 'Columns', icon: ChartIcons.columns, group: 'other' },
    { value: 'high_low', label: 'High-low', icon: ChartIcons.high_low, group: 'other' },
    { value: 'heikin_ashi', label: 'Heikin Ashi', icon: ChartIcons.heikin_ashi, group: 'other' },
];

interface ChartTypeSelectorProps {
    value: ChartType;
    onChange: (type: ChartType) => void;
}

export const ChartTypeSelector = ({ value, onChange }: ChartTypeSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = CHART_TYPE_OPTIONS.find(opt => opt.value === value) || CHART_TYPE_OPTIONS[1];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (type: ChartType) => {
        onChange(type);
        setIsOpen(false);
    };

    // Group options by their group
    const groupedOptions = CHART_TYPE_OPTIONS.reduce((acc, option) => {
        const group = option.group || 'other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
    }, {} as Record<string, ChartTypeOption[]>);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm border border-border rounded px-2 py-1.5 text-sm text-white hover:bg-white/10 transition"
                title="Chart Type"
            >
                <span className="text-primary">{selectedOption.icon}</span>
                <ChevronDown size={14} className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden min-w-[180px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {Object.entries(groupedOptions).map(([group, options], groupIdx) => (
                        <div key={group}>
                            {groupIdx > 0 && <div className="border-t border-border/50 my-1" />}
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2 text-sm text-left
                                        hover:bg-white/10 transition-colors
                                        ${value === option.value ? 'bg-primary/15 text-primary' : 'text-gray-300'}
                                    `}
                                >
                                    <span className={value === option.value ? 'text-primary' : 'text-gray-400'}>
                                        {option.icon}
                                    </span>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChartTypeSelector;
