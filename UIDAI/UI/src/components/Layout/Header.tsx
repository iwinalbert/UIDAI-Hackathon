import { useRef } from 'react';
import { Activity, Upload } from 'lucide-react';
import { useStore } from '../../store/useStore';
import Papa from 'papaparse';
import type { OHLCData } from '../../types';

export const Header = () => {
    const { setIndicatorModalOpen, setData, timeRange, setTimeRange } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData: OHLCData[] = [];
                const rows = results.data as any[];

                // Simple heuristics to find columns
                if (rows.length === 0) return;
                const keys = Object.keys(rows[0]).map(k => k.toLowerCase());

                // Map common names
                const map = {
                    time: keys.find(k => k.includes('time') || k.includes('date')),
                    open: keys.find(k => k === 'open'),
                    high: keys.find(k => k === 'high'),
                    low: keys.find(k => k === 'low'),
                    close: keys.find(k => k === 'close'),
                };

                if (!map.open || !map.close || !map.time) {
                    alert("Could not identify Time, Open, Close columns in CSV");
                    return;
                }

                rows.forEach(row => {
                    // Case-insensitive lookup
                    const getVal = (key: string | undefined) => {
                        if (!key) return 0;
                        // Find the actual key that matched the lowercase key
                        const realKey = Object.keys(row).find(k => k.toLowerCase() === key);
                        return parseFloat(row[realKey!] || '0');
                    };

                    // Time parsing
                    const timeKey = Object.keys(row).find(k => k.toLowerCase() === map.time);
                    let timeVal = row[timeKey!];
                    let time: any;

                    // If it looks like a date string, convert to Unix timestamp
                    const date = new Date(timeVal);
                    if (!isNaN(date.getTime())) {
                        time = date.getTime() / 1000;
                    } else if (!isNaN(parseFloat(timeVal))) {
                        time = parseFloat(timeVal); // Assume unix timestamp
                    }

                    if (time) {
                        parsedData.push({
                            time: time as any,
                            open: getVal(map.open),
                            high: getVal(map.high),
                            low: getVal(map.low),
                            close: getVal(map.close),
                        });
                    }
                });

                // Sort by time
                parsedData.sort((a, b) => (a.time as number) - (b.time as number));

                setData(parsedData);
            }
        });
    };

    return (
        <div className="h-14 bg-surface border-b border-border flex items-center px-4 justify-between select-none shadow-sm">
            <div className="flex items-center space-x-4">
                {/* Symbol/Brand */}
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-1 rounded transition group">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                        UI
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm leading-none">United India</div>
                        <span className="text-[10px] text-textSecondary uppercase font-medium">Velocity</span>
                    </div>
                </div>

                <div className="w-[1px] h-6 bg-border mx-2" />

                <div className="flex space-x-1">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1 text-textSecondary hover:text-white hover:bg-white/10 px-3 py-1.5 rounded transition text-sm font-medium"
                        title="Upload CSV"
                    >
                        <Upload size={16} />
                        <span>Upload Data</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv,.json"
                        onChange={handleFileUpload}
                    />
                </div>

                <div className="w-[1px] h-6 bg-border mx-2" />

                {/* Time Range Selector Panel */}
                <div className="flex items-center space-x-1 text-sm font-medium text-textSecondary">
                    {(['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'All'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-2 py-1 rounded transition ${timeRange === range
                                ? 'text-primary bg-primary/10'
                                : 'hover:text-primary hover:bg-white/5'
                                }`}
                            title={`Show ${range} data`}
                        >
                            {range}
                        </button>
                    ))}
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <button
                        onClick={() => setTimeRange('All')}
                        className="hover:text-primary hover:bg-white/5 p-1 rounded transition"
                        title="Reset View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                    </button>
                </div>

                <div className="w-[1px] h-6 bg-border mx-2" />

                {/* Indicators Button */}
                <button
                    onClick={() => setIndicatorModalOpen(true)}
                    className="flex items-center space-x-2 text-textSecondary hover:text-primary hover:bg-white/5 px-3 py-1.5 rounded transition text-sm font-medium"
                >
                    <Activity size={18} />
                    <span>Indicators</span>
                </button>
            </div>

            <div className="flex items-center space-x-2">
                <button className="bg-primary hover:bg-blue-600 text-white px-5 py-1.5 rounded text-sm font-bold transition shadow-lg shadow-blue-500/20 active:scale-95 transform">
                    Publish
                </button>
            </div>
        </div>
    );
};
