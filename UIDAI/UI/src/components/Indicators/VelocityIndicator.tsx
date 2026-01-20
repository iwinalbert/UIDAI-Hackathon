import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
// @ts-ignore
import velocityData from '../../data/velocityDataOHLCV.json';

type DatasetType = 'biometric' | 'enrolment' | 'demographic';

interface OHLCVData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export const VelocityIndicator: React.FC = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    const [primaryDataset, setPrimaryDataset] = useState<DatasetType>('biometric');
    const [fusionList, setFusionList] = useState<DatasetType[]>([]);
    const [isFusionMode, setIsFusionMode] = useState(false);

    // Fuse Data Logic
    const fusedData = useMemo(() => {
        // Correct logic: If NOT fusion mode, just use primary.
        // If Fusion Mode, use [primary, ...fusionList]
        const simpleList = [primaryDataset];
        const combinedList = Array.from(new Set([primaryDataset, ...fusionList]));

        const datasetsToProcess = isFusionMode ? combinedList : simpleList;

        const combined: Record<string, OHLCVData> = {};

        datasetsToProcess.forEach(type => {
            const data: OHLCVData[] = (velocityData as any)[type] || [];
            data.forEach(d => {
                if (!combined[d.time]) {
                    combined[d.time] = { ...d };
                } else {
                    combined[d.time].open += d.open;
                    combined[d.time].high += d.high;
                    combined[d.time].low += d.low;
                    combined[d.time].close += d.close;
                    combined[d.time].volume += d.volume;
                }
            });
        });

        return Object.values(combined).sort((a, b) => a.time.localeCompare(b.time));
    }, [primaryDataset, fusionList, isFusionMode]);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9CA3AF',
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            grid: {
                vertLines: { color: '#374151', visible: false },
                horzLines: { color: '#374151', visible: false },
            },
            rightPriceScale: {
                borderColor: '#4B5563',
            },
            timeScale: {
                borderColor: '#4B5563',
            },
        });
        chartRef.current = chart;

        // Candlestick Series (Velocity)
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#10B981',
            downColor: '#EF4444',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
        });
        candleSeriesRef.current = candleSeries;

        // Volume Series (Total Updates)
        const volumeSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: '', // Overlay
            color: '#3B82F6',
        });
        volumeSeriesRef.current = volumeSeries;

        chart.priceScale('').applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Update Data Effect
    useEffect(() => {
        if (candleSeriesRef.current && volumeSeriesRef.current) {
            candleSeriesRef.current.setData(fusedData as any);

            const volumeData = fusedData.map(d => ({
                time: d.time,
                value: d.volume,
                color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            }));

            volumeSeriesRef.current.setData(volumeData as any);
        }
    }, [fusedData]);

    const toggleFusionItem = (type: DatasetType) => {
        setFusionList(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl relative">
            {/* Header Controls */}
            <div className="z-10 relative mb-4 flex flex-wrap justify-between items-center gap-4 bg-gray-800/40 p-3 rounded-lg backdrop-blur-sm">
                <div>
                    <h3 className="text-gray-200 font-semibold mb-1">Velocity Indicator</h3>
                    <div className="text-xs text-gray-500 font-mono">
                        Metric: Rate of Updates ($dx/dt$)
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Primary Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Primary Dataset</label>
                        <select
                            value={primaryDataset}
                            onChange={(e) => setPrimaryDataset(e.target.value as DatasetType)}
                            className="bg-gray-900 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="biometric">Biometric</option>
                            <option value="enrolment">Enrolment</option>
                            <option value="demographic">Demographic</option>
                        </select>
                    </div>

                    {/* Fusion Toggle */}
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Data Fusion</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFusionMode(!isFusionMode)}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${isFusionMode
                                        ? 'bg-purple-600 border-purple-500 text-white'
                                        : 'bg-gray-800 border-gray-600 text-gray-400'
                                    }`}
                            >
                                {isFusionMode ? 'Fusion ON' : 'Fusion OFF'}
                            </button>

                            {isFusionMode && (
                                <div className="flex gap-1">
                                    {(['biometric', 'enrolment', 'demographic'] as DatasetType[])
                                        .filter(t => t !== primaryDataset)
                                        .map(t => (
                                            <button
                                                key={t}
                                                onClick={() => toggleFusionItem(t)}
                                                className={`px-2 py-1 text-[10px] uppercase rounded border ${fusionList.includes(t)
                                                        ? 'bg-blue-600/50 border-blue-400 text-white'
                                                        : 'bg-gray-800 border-gray-600 text-gray-500'
                                                    }`}
                                            >
                                                + {t.slice(0, 3)}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Legend (The Metric Mapping) */}
            <div className="grid grid-cols-5 gap-2 mb-2 text-center text-xs">
                <div className="p-2 bg-gray-800 rounded">
                    <div className="text-gray-500">Starts @</div>
                    <div className="text-white font-mono">Open</div>
                </div>
                <div className="p-2 bg-gray-800 rounded">
                    <div className="text-gray-500">Max Speed</div>
                    <div className="text-green-400 font-mono">High</div>
                </div>
                <div className="p-2 bg-gray-800 rounded">
                    <div className="text-gray-500">Min Speed</div>
                    <div className="text-red-400 font-mono">Low</div>
                </div>
                <div className="p-2 bg-gray-800 rounded">
                    <div className="text-gray-500">Ends @</div>
                    <div className="text-white font-mono">Close</div>
                </div>
                <div className="p-2 bg-gray-800 rounded border border-blue-900/50">
                    <div className="text-blue-400">Total Updates</div>
                    <div className="text-blue-200 font-mono">Volume</div>
                </div>
            </div>

            {/* Chart */}
            <div ref={chartContainerRef} className="w-full h-[350px]" />
        </div>
    );
};
