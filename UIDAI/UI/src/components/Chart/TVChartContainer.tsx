import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries, AreaSeries, BarSeries, BaselineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type React from 'react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useDrawingStore, type Drawing, type DrawingToolType, type Point } from '../../store/useDrawingStore';
import { executeIndicatorScript } from '../../utils/indicatorEngine';
import { Zap, ChevronDown, Layers, Camera, Maximize2, Minimize2, MapPin, Newspaper } from 'lucide-react';
import { IndicatorLegend } from './IndicatorLegend';
import { ChartTypeSelector } from './ChartTypeSelector';
import type { ChartEvent, OHLCData } from '../../types';
import { fetchAndClassifyEvents } from '../../services/eventManager';
import { NewsSidebar } from './NewsSidebar';
import { AIAnalystSidebar } from './AIAnalystSidebar';

// @ts-ignore - JSON import
import locationData from '../../data/velocityDataByLocation.json';

type DatasetType = 'biometric' | 'enrolment' | 'demographic';

interface VelocityOHLCV {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface LocationDataStructure {
    states: string[];
    districts: Record<string, string[]>;
    data: Record<string, {
        biometric: VelocityOHLCV[];
        enrolment: VelocityOHLCV[];
        demographic: VelocityOHLCV[];
    }>;
}

const typedLocationData = locationData as LocationDataStructure;

export const TVChartContainer = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const {
        indicators,
        timeRange,
        chartType,
        setChartType,
        selectedState,
        setSelectedState,
        selectedDistrict,
        setSelectedDistrict,
        primaryDataset,
        setPrimaryDataset,
        fusionList,
        setFusionList,
        isFusionMode,
        setFusionMode,
        setComputedIndicatorData,
        setBaseChartData,
        setActiveNewsEvents
    } = useStore();
    const chartRef = useRef<IChartApi | null>(null);
    const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const indicatorSeriesMap = useRef(new Map<string, ISeriesApi<"Line">>());

    // UI-only local state (not persisted)
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
    const [showDatasetDropdown, setShowDatasetDropdown] = useState(false);

    // Event Overlay State
    const [visibleEvents, setVisibleEvents] = useState<{ event: ChartEvent, x: number }[]>([]);
    const [hoveredEvent, setHoveredEvent] = useState<ChartEvent | null>(null);

    // Fullscreen State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // News Fetch State
    const [isFetchingNews, setIsFetchingNews] = useState(false);
    const [newsEvents, setNewsEvents] = useState<ChartEvent[]>([]);
    const [isNewsSidebarOpen, setIsNewsSidebarOpen] = useState(false);

    // AI Sidebar State
    const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

    // Drawing state
    const {
        activeTool,
        keepDrawing,
        drawingsVisible,
        drawings,
        drawingColor,
        lineWidth,
        setActiveTool,
        setActiveCategory,
        addDrawing,
    } = useDrawingStore();

    const [isDrawing, setIsDrawing] = useState(false);
    const [draftPoints, setDraftPoints] = useState<Point[]>([]);
    const [, forceRender] = useState(0);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const isFreehandTool = (tool: DrawingToolType | null) =>
        tool === 'brush' || tool === 'highlighter' || tool === 'path' || tool === 'polyline';

    const isTextTool = (tool: DrawingToolType | null) =>
        tool === 'text' || tool === 'anchoredText' || tool === 'note' || tool === 'callout' || tool === 'priceLabel' || tool === 'pin' || tool === 'flagMark';

    const isSingleAnchorTool = (tool: DrawingToolType | null) =>
        tool === 'crossLine';

    const getDefaultTextForTool = (tool: DrawingToolType | null) => {
        switch (tool) {
            case 'note':
            case 'callout':
                return 'Note';
            case 'priceLabel':
                return 'Price';
            case 'flagMark':
                return 'Flag';
            case 'pin':
                return 'Pin';
            case 'anchoredText':
                return 'Text';
            default:
                return tool ?? 'Label';
        }
    };

    const updateContainerSize = () => {
        if (!chartContainerRef.current) return;
        setContainerSize({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });
    };

    const getPointFromEvent = (event: React.PointerEvent<HTMLDivElement>): Point | null => {
        if (!chartRef.current || !mainSeriesRef.current || !chartContainerRef.current) return null;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const time = chartRef.current.timeScale().coordinateToTime(x);
        const price = mainSeriesRef.current.coordinateToPrice(y);

        return {
            x,
            y,
            time: time ? (time as any) : undefined,
            price: price ?? undefined,
        };
    };

    const toScreenPoint = (point: Point) => {
        const x = point.time && chartRef.current ? chartRef.current.timeScale().timeToCoordinate(point.time as Time) : point.x;
        const y = point.price !== undefined && mainSeriesRef.current ? mainSeriesRef.current.priceToCoordinate(point.price) : point.y;
        return {
            x: x ?? point.x ?? 0,
            y: y ?? point.y ?? 0,
        };
    };

    const normalizePointsForTool = (tool: DrawingToolType | null, points: Point[]) => {
        if (!tool) return points;
        if (points.length === 0) return points;

        if (tool === 'horizontalLine') {
            return points.map(p => ({ ...p, y: points[0].y, price: points[0].price }));
        }

        if (tool === 'verticalLine') {
            return points.map(p => ({ ...p, x: points[0].x, time: points[0].time }));
        }

        if (tool === 'crossLine') {
            return [points[0]];
        }

        return points;
    };

    const buildPathFromPoints = (pts: { x: number; y: number; }[]) => {
        if (pts.length === 0) return '';
        const [first, ...rest] = pts;
        const move = `M ${first.x} ${first.y}`;
        const lines = rest.map(p => `L ${p.x} ${p.y}`).join(' ');
        return `${move} ${lines}`;
    };

    const renderDrawingGraphic = (drawing: Drawing, key: string | number, isDraft = false) => {
        if (!drawingsVisible && !isDraft) return null;
        const points = drawing.points.map(toScreenPoint);
        if (points.length === 0) return null;

        const stroke = drawing.color || drawingColor;
        const width = (drawing.lineWidth || lineWidth) + (isDraft ? 0.5 : 0);
        const opacity = drawing.type === 'highlighter' ? 0.45 : 0.9;

        const renderLine = (p1: { x: number; y: number; }, p2: { x: number; y: number; }, options?: { dash?: string; arrow?: boolean; }, suffix = '') => (
            <g key={`${key}-line${suffix}`}>
                <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={stroke}
                    strokeWidth={width}
                    strokeOpacity={opacity}
                    strokeDasharray={options?.dash}
                    strokeLinecap="round"
                />
                {options?.arrow && (
                    <polygon
                        points={`${p2.x},${p2.y} ${p2.x - 8},${p2.y - 4} ${p2.x - 8},${p2.y + 4}`}
                        fill={stroke}
                        fillOpacity={opacity}
                    />
                )}
            </g>
        );

        const renderMeasureLabel = (p1: { x: number; y: number; }, p2: { x: number; y: number; }) => {
            const priceA = drawing.points[0].price ?? 0;
            const priceB = drawing.points[1]?.price ?? priceA;
            const deltaPrice = priceB - priceA;

            const timeA = drawing.points[0].time ? new Date(drawing.points[0].time as any).getTime() : 0;
            const timeB = drawing.points[1]?.time ? new Date(drawing.points[1].time as any).getTime() : timeA;
            const deltaTimeHours = (timeB - timeA) / (1000 * 60 * 60);

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            return (
                <g key={`${key}-measure`}>
                    <rect
                        x={midX - 38}
                        y={midY - 18}
                        width={76}
                        height={24}
                        rx={6}
                        fill="#0f172a"
                        fillOpacity={0.9}
                        stroke={stroke}
                        strokeOpacity={0.6}
                    />
                    <text x={midX} y={midY - 4} fill="#e2e8f0" fontSize={10} textAnchor="middle">
                        ΔP: {deltaPrice.toFixed(2)}
                    </text>
                    <text x={midX} y={midY + 10} fill="#94a3b8" fontSize={9} textAnchor="middle">
                        ΔT: {deltaTimeHours.toFixed(1)}h
                    </text>
                </g>
            );
        };

        switch (drawing.type) {
            case 'trendLine':
            case 'regressionTrend':
            case 'ray':
            case 'extendedLine':
            case 'arrow':
            case 'arrowMarker':
            case 'arrowUp':
            case 'arrowDown':
            case 'measure': {
                const p1 = points[0];
                const p2 = points[1] ?? points[0];
                if (!p1 || !p2) return null;

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const slope = Math.abs(dx) < 0.001 ? 0 : dy / dx;
                const intercept = p1.y - slope * p1.x;

                let start = p1;
                let end = p2;

                if (drawing.type === 'extendedLine') {
                    start = { x: 0, y: intercept };
                    end = { x: containerSize.width, y: slope * containerSize.width + intercept };
                }

                if (drawing.type === 'ray') {
                    const targetX = dx >= 0 ? containerSize.width : 0;
                    end = { x: targetX, y: slope * targetX + intercept };
                }

                const withArrow = drawing.type === 'arrow' || drawing.type === 'arrowMarker' || drawing.type === 'arrowUp' || drawing.type === 'arrowDown';
                const lineNode = renderLine(start, end, { arrow: withArrow });

                const measureNode = drawing.type === 'measure' && points.length >= 2
                    ? renderMeasureLabel(start, end)
                    : null;

                return <g key={key}>{lineNode}{measureNode}</g>;
            }

            case 'horizontalLine': {
                const y = points[0].y;
                return renderLine({ x: 0, y }, { x: containerSize.width, y }, { dash: '6 3' });
            }

            case 'verticalLine': {
                const x = points[0].x;
                return renderLine({ x, y: 0 }, { x, y: containerSize.height }, { dash: '6 3' });
            }

            case 'crossLine': {
                const anchor = points[0];
                return (
                    <g key={key}>
                        {renderLine({ x: 0, y: anchor.y }, { x: containerSize.width, y: anchor.y }, { dash: '4 2' }, '-h')}
                        {renderLine({ x: anchor.x, y: 0 }, { x: anchor.x, y: containerSize.height }, { dash: '4 2' }, '-v')}
                    </g>
                );
            }

            case 'parallelChannel': {
                if (points.length < 2) return null;
                const p1 = points[0];
                const p2 = points[1];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.hypot(dx, dy) || 1;
                const offsetX = (-dy / len) * 30;
                const offsetY = (dx / len) * 30;

                const topA = { x: p1.x + offsetX, y: p1.y + offsetY };
                const topB = { x: p2.x + offsetX, y: p2.y + offsetY };
                const bottomA = { x: p1.x - offsetX, y: p1.y - offsetY };
                const bottomB = { x: p2.x - offsetX, y: p2.y - offsetY };

                return (
                    <g key={key}>
                        {renderLine(topA, topB)}
                        {renderLine(bottomA, bottomB)}
                        <polygon
                            points={`${topA.x},${topA.y} ${topB.x},${topB.y} ${bottomB.x},${bottomB.y} ${bottomA.x},${bottomA.y}`}
                            fill={stroke}
                            fillOpacity={0.06}
                            stroke="none"
                        />
                    </g>
                );
            }

            case 'brush':
            case 'highlighter':
            case 'path':
            case 'polyline': {
                const path = buildPathFromPoints(points);
                return (
                    <path
                        key={key}
                        d={path}
                        fill="none"
                        stroke={stroke}
                        strokeOpacity={opacity}
                        strokeWidth={drawing.type === 'highlighter' ? width * 1.6 : width}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                );
            }

            case 'rectangle': {
                const p1 = points[0];
                const p2 = points[1] ?? points[0];
                const x = Math.min(p1.x, p2.x);
                const y = Math.min(p1.y, p2.y);
                const w = Math.abs(p2.x - p1.x);
                const h = Math.abs(p2.y - p1.y);
                return (
                    <rect
                        key={key}
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill={stroke}
                        fillOpacity={0.08}
                        stroke={stroke}
                        strokeWidth={width}
                    />
                );
            }

            case 'circle':
            case 'ellipse': {
                const p1 = points[0];
                const p2 = points[1] ?? points[0];
                const cx = (p1.x + p2.x) / 2;
                const cy = (p1.y + p2.y) / 2;
                const rx = Math.abs(p2.x - p1.x) / 2;
                const ry = drawing.type === 'circle' ? rx : Math.abs(p2.y - p1.y) / 2;
                return (
                    <ellipse
                        key={key}
                        cx={cx}
                        cy={cy}
                        rx={rx}
                        ry={ry}
                        fill={stroke}
                        fillOpacity={0.08}
                        stroke={stroke}
                        strokeWidth={width}
                    />
                );
            }

            case 'triangle': {
                const p1 = points[0];
                const p2 = points[1] ?? points[0];
                const top = { x: (p1.x + p2.x) / 2, y: Math.min(p1.y, p2.y) };
                const left = { x: Math.min(p1.x, p2.x), y: Math.max(p1.y, p2.y) };
                const right = { x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y) };
                return (
                    <polygon
                        key={key}
                        points={`${top.x},${top.y} ${left.x},${left.y} ${right.x},${right.y}`}
                        fill={stroke}
                        fillOpacity={0.08}
                        stroke={stroke}
                        strokeWidth={width}
                    />
                );
            }

            case 'text':
            case 'anchoredText':
            case 'note':
            case 'callout':
            case 'priceLabel':
            case 'pin':
            case 'flagMark': {
                const anchor = points[0];
                const label = drawing.text || getDefaultTextForTool(drawing.type);
                return (
                    <g key={key}>
                        <rect
                            x={anchor.x - 4}
                            y={anchor.y - 18}
                            rx={6}
                            ry={6}
                            width={Math.max(48, label.length * 7)}
                            height={24}
                            fill="#0f172a"
                            fillOpacity={0.9}
                            stroke={stroke}
                            strokeOpacity={0.6}
                        />
                        <text
                            x={anchor.x + 4}
                            y={anchor.y - 2}
                            fill="#e2e8f0"
                            fontSize={11}
                            fontWeight={600}
                        >
                            {label}
                        </text>
                    </g>
                );
            }

            default:
                return null;
        }
    };

    // Get available districts for selected state
    const availableDistricts = useMemo(() => {
        return typedLocationData.districts[selectedState] || [];
    }, [selectedState]);

    // Initialize default state if empty
    useEffect(() => {
        if (!selectedState && typedLocationData.states.length > 0) {
            setSelectedState(typedLocationData.states[0]);
        }
    }, [selectedState, setSelectedState]);

    // Auto-select first district when state changes
    useEffect(() => {
        if (selectedState && availableDistricts.length > 0) {
            if (!selectedDistrict || !availableDistricts.includes(selectedDistrict)) {
                setSelectedDistrict(availableDistricts[0]);
            }
        }
    }, [availableDistricts, selectedState, selectedDistrict, setSelectedDistrict]);

    // Update chart events when newsEvents changes
    useEffect(() => {
        console.log('[Chart] newsEvents changed:', newsEvents.length, 'events');
        if (!chartRef.current || newsEvents.length === 0) {
            console.log('[Chart] Skipping - chartRef:', !!chartRef.current, 'newsEvents:', newsEvents.length);
            return;
        }

        const timeScale = chartRef.current.timeScale();

        const calculated = newsEvents.map(evt => {
            const x = timeScale.timeToCoordinate(evt.time);
            console.log('[Chart] Event:', evt.title?.substring(0, 30), 'time:', evt.time, 'x:', x);
            return { event: evt, x };
        }).filter(item => item.x !== null) as { event: ChartEvent, x: number }[];

        console.log('[Chart] Calculated events with valid coordinates:', calculated.length);

        setVisibleEvents(prev => {
            const filtered = prev.filter(e => !newsEvents.some(n => n.id === e.event.id));
            console.log('[Chart] Setting visibleEvents:', filtered.length, '+', calculated.length, '= total');
            return [...filtered, ...calculated];
        });
    }, [newsEvents]);

    // Get data for selected location
    const chartData = useMemo(() => {
        const locKey = `${selectedState}|${selectedDistrict}`;
        const locData = typedLocationData.data[locKey];

        if (!locData) return [];

        const datasetsToProcess = isFusionMode
            ? Array.from(new Set([primaryDataset, ...fusionList]))
            : [primaryDataset];

        const combined: Record<string, VelocityOHLCV> = {};

        datasetsToProcess.forEach(type => {
            const sourceData: VelocityOHLCV[] = (locData as any)[type] || [];
            sourceData.forEach(d => {
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
    }, [selectedState, selectedDistrict, primaryDataset, fusionList, isFusionMode]);

    // Filter data by time range
    const filteredChartData = useMemo(() => {
        if (timeRange === 'All' || chartData.length === 0) {
            return chartData;
        }

        const latestDate = new Date(chartData[chartData.length - 1].time);
        let cutoffDate = new Date(latestDate);

        switch (timeRange) {
            case '1D':
                cutoffDate.setDate(latestDate.getDate() - 1);
                break;
            case '5D':
                cutoffDate.setDate(latestDate.getDate() - 5);
                break;
            case '1M':
                cutoffDate.setMonth(latestDate.getMonth() - 1);
                break;
            case '3M':
                cutoffDate.setMonth(latestDate.getMonth() - 3);
                break;
            case '6M':
                cutoffDate.setMonth(latestDate.getMonth() - 6);
                break;
            case 'YTD':
                cutoffDate = new Date(latestDate.getFullYear(), 0, 1);
                break;
            case '1Y':
                cutoffDate.setFullYear(latestDate.getFullYear() - 1);
                break;
            default:
                return chartData;
        }

        return chartData.filter(d => new Date(d.time) >= cutoffDate);
    }, [chartData, timeRange]);

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#131722' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#1f222d' },
                horzLines: { color: '#1f222d' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                borderColor: '#2B2B43',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#2B2B43',
            },
            leftPriceScale: {
                borderColor: '#2B2B43',
                visible: true,
            },
            crosshair: {
                mode: 1,
            }
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            color: '#3B82F680',
        });

        chart.priceScale('').applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        });

        chart.priceScale('left').applyOptions({
            scaleMargins: { top: 0.7, bottom: 0.05 },
        });

        chartRef.current = chart;
        volumeSeriesRef.current = volumeSeries;

        const updateEventPositions = () => {
            if (!chartRef.current) return;
            const timeScale = chartRef.current.timeScale();
            const storeEvents = useStore.getState().events;
            // Combine store events with fetched news events
            const allEvents = [...storeEvents];

            const calculated = allEvents.map(evt => {
                const x = timeScale.timeToCoordinate(evt.time);
                return { event: evt, x };
            }).filter(item => item.x !== null) as { event: ChartEvent, x: number }[];

            setVisibleEvents(calculated);
            forceRender(v => v + 1);
        };

        const timeScale = chart.timeScale();
        timeScale.subscribeVisibleTimeRangeChange(updateEventPositions);
        timeScale.subscribeVisibleLogicalRangeChange(updateEventPositions);

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
                updateEventPositions();
                updateContainerSize();
                forceRender(v => v + 1);
            }
        };

        window.addEventListener('resize', handleResize);

        updateContainerSize();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            mainSeriesRef.current = null;
            volumeSeriesRef.current = null;
            indicatorSeriesMap.current.clear();
        };
    }, []);

    // Update Chart Series based on Chart Type
    useEffect(() => {
        if (!chartRef.current || filteredChartData.length === 0) return;

        // Remove existing main series
        // Remove existing main series
        if (mainSeriesRef.current) {
            try {
                chartRef.current.removeSeries(mainSeriesRef.current);
            } catch (e) {
                // Ignore removal errors (e.g. if chart was reset)
            }
            mainSeriesRef.current = null;
        }

        // Create new series based on chart type
        let newSeries: ISeriesApi<any>;

        switch (chartType) {
            case 'candles':
            case 'hollow_candles':
            case 'heikin_ashi':
                newSeries = chartRef.current.addSeries(CandlestickSeries, {
                    upColor: chartType === 'hollow_candles' ? 'transparent' : '#26a69a',
                    downColor: chartType === 'hollow_candles' ? 'transparent' : '#ef5350',
                    borderVisible: true,
                    borderUpColor: '#26a69a',
                    borderDownColor: '#ef5350',
                    wickUpColor: '#26a69a',
                    wickDownColor: '#ef5350',
                });
                break;

            case 'bars':
                newSeries = chartRef.current.addSeries(BarSeries, {
                    upColor: '#26a69a',
                    downColor: '#ef5350',
                });
                break;

            case 'line':
            case 'line_markers':
            case 'step_line':
                newSeries = chartRef.current.addSeries(LineSeries, {
                    color: '#2962FF',
                    lineWidth: 2,
                    crosshairMarkerVisible: chartType === 'line_markers',
                    crosshairMarkerRadius: chartType === 'line_markers' ? 4 : 0,
                    lineType: chartType === 'step_line' ? 1 : 0, // 1 = step line
                });
                break;

            case 'area':
            case 'hlc_area':
                newSeries = chartRef.current.addSeries(AreaSeries, {
                    lineColor: '#2962FF',
                    topColor: 'rgba(41, 98, 255, 0.4)',
                    bottomColor: 'rgba(41, 98, 255, 0.0)',
                    lineWidth: 2,
                });
                break;

            case 'baseline':
                const avgClose = filteredChartData.reduce((sum, d) => sum + d.close, 0) / filteredChartData.length;
                newSeries = chartRef.current.addSeries(BaselineSeries, {
                    baseValue: { type: 'price', price: avgClose },
                    topLineColor: '#26a69a',
                    topFillColor1: 'rgba(38, 166, 154, 0.4)',
                    topFillColor2: 'rgba(38, 166, 154, 0.0)',
                    bottomLineColor: '#ef5350',
                    bottomFillColor1: 'rgba(239, 83, 80, 0.0)',
                    bottomFillColor2: 'rgba(239, 83, 80, 0.4)',
                    lineWidth: 2,
                });
                break;

            case 'columns':
            case 'high_low':
                newSeries = chartRef.current.addSeries(HistogramSeries, {
                    color: '#2962FF',
                });
                break;

            default:
                newSeries = chartRef.current.addSeries(CandlestickSeries, {
                    upColor: '#26a69a',
                    downColor: '#ef5350',
                    borderVisible: false,
                    wickUpColor: '#26a69a',
                    wickDownColor: '#ef5350',
                });
        }

        mainSeriesRef.current = newSeries;

        // Set data based on chart type
        if (['candles', 'hollow_candles', 'bars', 'heikin_ashi'].includes(chartType)) {
            // OHLC data for candlestick/bar charts
            let dataToSet = filteredChartData;

            // Calculate Heikin Ashi if needed
            if (chartType === 'heikin_ashi') {
                dataToSet = filteredChartData.map((d, i) => {
                    const prev = i > 0 ? filteredChartData[i - 1] : d;
                    const haClose = (d.open + d.high + d.low + d.close) / 4;
                    const haOpen = i === 0 ? (d.open + d.close) / 2 : (prev.open + prev.close) / 2;
                    return {
                        time: d.time,
                        open: haOpen,
                        high: Math.max(d.high, haOpen, haClose),
                        low: Math.min(d.low, haOpen, haClose),
                        close: haClose,
                        volume: d.volume,
                    };
                });
            }

            newSeries.setData(dataToSet as any);
        } else if (['columns', 'high_low'].includes(chartType)) {
            // Histogram data
            const histData = filteredChartData.map(d => ({
                time: d.time,
                value: chartType === 'high_low' ? d.high - d.low : d.close,
                color: d.close >= d.open ? '#26a69a' : '#ef5350',
            }));
            newSeries.setData(histData as any);
        } else {
            // Line/Area data (close price)
            const lineData = filteredChartData.map(d => ({
                time: d.time,
                value: d.close,
            }));
            newSeries.setData(lineData as any);
        }

        // Update volume data
        if (volumeSeriesRef.current) {
            const volumeData = filteredChartData.map(d => ({
                time: d.time,
                value: d.volume,
                color: d.close >= d.open ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)'
            }));
            volumeSeriesRef.current.setData(volumeData as any);
        }

        chartRef.current?.timeScale().fitContent();
    }, [filteredChartData, chartType]);

    // Update Indicators
    useEffect(() => {
        if (!chartRef.current || filteredChartData.length === 0) return;

        const activeIds = new Set(indicators.map(i => i.id));
        indicatorSeriesMap.current.forEach((series, id) => {
            if (!activeIds.has(id)) {
                chartRef.current!.removeSeries(series);
                indicatorSeriesMap.current.delete(id);
            }
        });

        indicators.forEach(ind => {
            if (!ind.visible) return;

            const isPane = ind.script.includes('@type: pane');
            let series = indicatorSeriesMap.current.get(ind.id);

            if (!series) {
                series = chartRef.current!.addSeries(LineSeries, {
                    color: ind.color,
                    lineWidth: 2,
                    title: ind.name,
                    priceScaleId: isPane ? 'left' : 'right',
                });
                indicatorSeriesMap.current.set(ind.id, series);
            }

            if (series) {
                const ohlcForIndicator: OHLCData[] = filteredChartData.map(d => ({
                    ...d,
                    time: d.time as Time
                }));
                const calculatedData = executeIndicatorScript(ind.script, ohlcForIndicator);
                series.setData(calculatedData);
                series.applyOptions({
                    color: ind.color,
                    priceScaleId: isPane ? 'left' : 'right'
                });

                // Capture data for AI Analyst (Store last 20 points)
                const recentData = calculatedData.slice(-20);
                setComputedIndicatorData(ind.id, recentData);
            }
        });
    }, [indicators, filteredChartData]);

    // Sync Base Data to Store for AI (TOON Format - Last 20)
    useEffect(() => {
        if (filteredChartData.length > 0) {
            const recentOHLCV = filteredChartData.slice(-20).map(d => ({
                t: d.time,
                o: d.open,
                h: d.high,
                l: d.low,
                c: d.close,
                v: d.volume
            }));
            setBaseChartData(recentOHLCV);
        }
    }, [filteredChartData]);

    const toggleFusionItem = (type: string) => {
        setFusionList(
            fusionList.includes(type) ? fusionList.filter(t => t !== type) : [...fusionList, type]
        );
    };

    const takeSnapshot = () => {
        if (!chartContainerRef.current) return;
        const canvas = chartContainerRef.current.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `aadhaar-velocity-${selectedState}-${selectedDistrict}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    const toggleFullscreen = () => {
        if (!wrapperRef.current) return;

        if (!document.fullscreenElement) {
            wrapperRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => console.error('Fullscreen error:', err));
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            }).catch(err => console.error('Exit fullscreen error:', err));
        }
    };

    const resetDraft = () => {
        setIsDrawing(false);
        setDraftPoints([]);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!activeTool || !chartRef.current) return;
        const start = getPointFromEvent(event);
        if (!start) return;
        setIsDrawing(true);
        setDraftPoints([start]);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDrawing || !activeTool) return;
        const next = getPointFromEvent(event);
        if (!next) return;

        setDraftPoints(prev => {
            if (isFreehandTool(activeTool)) {
                return [...prev, next];
            }
            return [prev[0] ?? next, next];
        });
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDrawing || !activeTool) return resetDraft();
        const endPoint = getPointFromEvent(event);
        if (!endPoint) return resetDraft();

        const basePoints = isFreehandTool(activeTool)
            ? [...draftPoints, endPoint]
            : (isTextTool(activeTool) || isSingleAnchorTool(activeTool))
                ? [draftPoints[0] ?? endPoint]
                : [draftPoints[0] ?? endPoint, endPoint];

        if (basePoints.length === 0) return resetDraft();

        const normalized = normalizePointsForTool(activeTool, basePoints);
        const textValue = isTextTool(activeTool)
            ? (window.prompt('Enter text', getDefaultTextForTool(activeTool)) || '').trim()
            : undefined;

        addDrawing({
            type: activeTool,
            points: normalized,
            color: drawingColor,
            lineWidth: activeTool === 'highlighter' ? Math.max(lineWidth * 1.4, 4) : lineWidth,
            text: textValue || undefined,
            visible: true,
            locked: false,
        });

        resetDraft();

        if (!keepDrawing) {
            setActiveTool(null);
            setActiveCategory(null);
        }
    };

    const draftGraphic = isDrawing && draftPoints.length > 0 && activeTool
        ? renderDrawingGraphic({
            id: 'draft',
            type: activeTool,
            points: normalizePointsForTool(activeTool, draftPoints),
            color: drawingColor,
            lineWidth,
            text: undefined,
            visible: true,
            locked: false,
            createdAt: new Date(),
        } as Drawing, 'draft', true)
        : null;

    return (
        <div ref={wrapperRef} className={`w-full h-full relative group ${isFullscreen ? 'bg-[#131722]' : ''}`}>
            {/* Controls Overlay */}
            <div className="absolute top-2 left-2 z-30 flex items-center gap-2 flex-wrap">
                {/* Chart Type Selector */}
                <ChartTypeSelector value={chartType as any} onChange={setChartType} />

                <div className="w-[1px] h-6 bg-border" />

                {/* State Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setShowStateDropdown(!showStateDropdown); setShowDistrictDropdown(false); }}
                        className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm border border-border rounded px-3 py-1.5 text-sm text-white hover:bg-white/10 transition"
                    >
                        <MapPin size={14} className="text-primary" />
                        <span className="max-w-[100px] truncate">{selectedState || 'State'}</span>
                        <ChevronDown size={14} className={`transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showStateDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded shadow-xl overflow-hidden min-w-[160px] max-h-[300px] overflow-y-auto z-50">
                            {typedLocationData.states.map(state => (
                                <button
                                    key={state}
                                    onClick={() => { setSelectedState(state); setShowStateDropdown(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${selectedState === state ? 'bg-primary/20 text-primary' : 'text-white'}`}
                                >
                                    {state}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* District Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setShowDistrictDropdown(!showDistrictDropdown); setShowStateDropdown(false); }}
                        className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm border border-border rounded px-3 py-1.5 text-sm text-white hover:bg-white/10 transition"
                    >
                        <span className="max-w-[120px] truncate">{selectedDistrict || 'District'}</span>
                        <ChevronDown size={14} className={`transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDistrictDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded shadow-xl overflow-hidden min-w-[180px] max-h-[300px] overflow-y-auto z-50">
                            {availableDistricts.map(district => (
                                <button
                                    key={district}
                                    onClick={() => { setSelectedDistrict(district); setShowDistrictDropdown(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${selectedDistrict === district ? 'bg-primary/20 text-primary' : 'text-white'}`}
                                >
                                    {district}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-[1px] h-6 bg-border" />

                {/* Dataset Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowDatasetDropdown(!showDatasetDropdown)}
                        className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-sm border border-border rounded px-3 py-1.5 text-sm text-white hover:bg-white/10 transition"
                    >
                        <span className="capitalize">{primaryDataset}</span>
                        <ChevronDown size={14} className={`transition-transform ${showDatasetDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDatasetDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded shadow-xl overflow-hidden min-w-[140px]">
                            {(['biometric', 'enrolment', 'demographic'] as DatasetType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => { setPrimaryDataset(type); setShowDatasetDropdown(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 capitalize ${primaryDataset === type ? 'bg-primary/20 text-primary' : 'text-white'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fusion Toggle */}
                <button
                    onClick={() => setFusionMode(!isFusionMode)}
                    className={`flex items-center gap-1.5 border rounded px-3 py-1.5 text-sm transition ${isFusionMode
                        ? 'bg-purple-600/80 border-purple-500 text-white'
                        : 'bg-surface/90 backdrop-blur-sm border-border text-gray-400 hover:text-white'
                        }`}
                >
                    <Layers size={14} />
                    Fusion
                </button>

                {/* Fusion Chips */}
                {isFusionMode && (
                    <div className="flex gap-1">
                        {(['biometric', 'enrolment', 'demographic'] as DatasetType[])
                            .filter(t => t !== primaryDataset)
                            .map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleFusionItem(type)}
                                    className={`px-2 py-1 text-xs rounded border transition ${fusionList.includes(type)
                                        ? 'bg-blue-600/50 border-blue-400 text-white'
                                        : 'bg-surface/80 border-border text-gray-500 hover:text-white'
                                        }`}
                                >
                                    + {type.slice(0, 3).toUpperCase()}
                                </button>
                            ))}
                    </div>
                )}
            </div>

            {/* Metric Legend + Action Buttons */}
            <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                    <span className="bg-surface/80 px-2 py-1 rounded text-gray-400">O: Start Vel</span>
                    <span className="bg-surface/80 px-2 py-1 rounded text-green-400">H: Max Vel</span>
                    <span className="bg-surface/80 px-2 py-1 rounded text-red-400">L: Min Vel</span>
                    <span className="bg-surface/80 px-2 py-1 rounded text-gray-400">C: End Vel</span>
                    <span className="bg-surface/80 px-2 py-1 rounded text-blue-400">V: Updates</span>
                </div>

                <button
                    onClick={async () => {
                        setIsFetchingNews(true);
                        setIsNewsSidebarOpen(true);
                        try {
                            const fetchedEvents = await fetchAndClassifyEvents(selectedState, selectedDistrict);
                            setNewsEvents(fetchedEvents);
                            setActiveNewsEvents(fetchedEvents);
                        } catch (e) {
                            console.error('News fetch error:', e);
                        } finally {
                            setIsFetchingNews(false);
                        }
                    }}
                    disabled={isFetchingNews}
                    title="Fetch Aadhaar News Events"
                    className={`flex items-center gap-1 bg-surface/90 backdrop-blur-sm border border-border rounded px-2 py-1.5 text-sm transition ${isFetchingNews ? 'text-gray-500' : isNewsSidebarOpen ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'text-orange-400 hover:text-orange-300 hover:bg-white/10'}`}
                >
                    <Newspaper size={14} />
                    {isFetchingNews ? 'Fetching...' : 'News'}
                </button>

                <button
                    onClick={() => {
                        setIsAISidebarOpen(!isAISidebarOpen);
                        setIsNewsSidebarOpen(false);
                    }}
                    title="AI Analyst"
                    className={`flex items-center gap-1 bg-surface/90 backdrop-blur-sm border border-border rounded px-2 py-1.5 text-sm transition ${isAISidebarOpen ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'text-purple-400 hover:text-purple-300 hover:bg-white/10'}`}
                >
                    <Zap size={14} className={isAISidebarOpen ? "text-purple-400" : ""} />
                    AI
                </button>

                <button
                    onClick={takeSnapshot}
                    title="Download Snapshot"
                    className="bg-surface/90 backdrop-blur-sm border border-border rounded p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                    <Camera size={16} />
                </button>

                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    className="bg-surface/90 backdrop-blur-sm border border-border rounded p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* Indicator Legend Overlay */}
            <IndicatorLegend />

            <div ref={chartContainerRef} className="w-full h-full" />

            {/* Drawing Overlay */}
            <div
                className="absolute inset-0 z-20"
                style={{ pointerEvents: activeTool ? 'auto' : 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <svg
                    width={containerSize.width}
                    height={containerSize.height}
                    className="absolute inset-0 pointer-events-none"
                >
                    {drawings.map(d => renderDrawingGraphic(d, d.id))}
                    {draftGraphic}
                </svg>
            </div>

            {/* AI Analyst Sidebar - Overlay */}
            {isAISidebarOpen && (
                <div className="absolute top-0 right-0 h-full z-40 animate-in slide-in-from-right duration-300">
                    <AIAnalystSidebar onClose={() => setIsAISidebarOpen(false)} />
                </div>
            )}

            {/* News Sidebar - Overlay existing chart */}
            {isNewsSidebarOpen && (
                <div className="absolute top-0 right-0 h-full z-40 animate-in slide-in-from-right duration-300">
                    <NewsSidebar
                        isOpen={isNewsSidebarOpen}
                        state={selectedState}
                        district={selectedDistrict}
                        isLoading={isFetchingNews}
                        events={newsEvents}
                        onClose={() => setIsNewsSidebarOpen(false)}
                        onEventClick={(event) => {
                            // Find event x coordinate
                            if (chartRef.current) {
                                const x = chartRef.current.timeScale().timeToCoordinate(event.time);
                                if (x !== null) {
                                    // Scroll to time if needed (optional)
                                    // chartRef.current.timeScale().scrollToPosition(0, false); 
                                }
                            }
                        }}
                    />
                </div>
            )}
            {/* Events Overlay Layer */}
            <div className="absolute inset-x-0 bottom-[30px] h-8 pointer-events-none overflow-hidden"
                style={{ width: chartContainerRef.current?.clientWidth }}>
                {visibleEvents.map(({ event, x }, i) => {
                    const bgColor = event.color || (event.type === 'news' ? '#eab308' : '#f97316');
                    const icon = event.icon || (event.type === 'news' ? '⚡' : 'S');
                    return (
                        <div
                            key={`${event.id}-${i}`}
                            className="absolute bottom-0 w-6 h-6 -ml-3 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto transition hover:scale-110 z-20 text-white font-bold text-xs"
                            style={{ left: x, backgroundColor: bgColor }}
                            onMouseEnter={() => setHoveredEvent(event)}
                            onMouseLeave={() => setHoveredEvent(null)}
                        >
                            {icon}
                        </div>
                    );
                })}
            </div>

            {/* Popovers */}
            {hoveredEvent && (
                <div className="absolute z-50 bg-surface border border-border rounded-lg shadow-xl p-4 w-72 animate-in fade-in zoom-in duration-150 bottom-16"
                    style={{
                        left: visibleEvents.find(e => e.event.id === hoveredEvent.id)?.x ?? 0,
                        transform: 'translateX(-50%)'
                    }}>

                    <div className="flex items-center space-x-2 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hoveredEvent.type === 'news' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-orange-500/20 text-orange-500'}`}>
                            {hoveredEvent.type === 'news' ? <Zap size={18} /> : <span className="font-bold">S</span>}
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">{hoveredEvent.title}</h4>
                            <p className="text-xs text-textSecondary">{hoveredEvent.description}</p>
                        </div>
                    </div>

                    {hoveredEvent.details && (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {hoveredEvent.details.map((detail, idx) => (
                                <div key={idx} className="bg-background rounded p-2 border border-border/50">
                                    <p className="text-xs text-textSecondary flex justify-between">
                                        <span>{detail.dateStr}</span>
                                        <span className="font-semibold text-primary">{detail.source}</span>
                                    </p>
                                    <p className="text-sm mt-1 leading-tight">{detail.headline}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {hoveredEvent.type === 'split' && (
                        <button className="mt-3 w-full bg-white/5 hover:bg-white/10 text-sm py-1.5 rounded transition">
                            More financials
                        </button>
                    )}

                    {hoveredEvent.type === 'news' && (
                        <button className="mt-3 w-full bg-white/5 hover:bg-white/10 text-sm py-1.5 rounded transition">
                            More events
                        </button>
                    )}
                </div>
            )}

            {/* News Sidebar */}
            <NewsSidebar
                isOpen={isNewsSidebarOpen}
                onClose={() => setIsNewsSidebarOpen(false)}
                events={newsEvents}
                state={selectedState}
                district={selectedDistrict}
                isLoading={isFetchingNews}
            />
        </div>
    );
};
