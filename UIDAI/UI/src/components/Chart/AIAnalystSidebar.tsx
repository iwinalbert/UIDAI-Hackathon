import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { generateMarketReport, generateGist } from '../../services/geminiService';
import { BrainCircuit, Loader2, FileText, StickyNote, ChevronRight, ChevronDown, Save } from 'lucide-react';

export const AIAnalystSidebar = ({ onClose }: { onClose: () => void }) => {
    const {
        indicators,
        chartType,
        selectedState,
        selectedDistrict,
        primaryDataset,
        fusionList,
        isFusionMode,
        addNote,
        computedIndicatorData,
        baseChartData,
        activeNewsEvents
    } = useStore();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [gist, setGist] = useState<string | null>(null);
    const [isReportExpanded, setIsReportExpanded] = useState(false);
    const [isExported, setIsExported] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setReport(null);
        setGist(null);
        setIsExported(false);

        const sessionPayload = {
            location: { state: selectedState, district: selectedDistrict },
            chart: { type: chartType, dataset: primaryDataset },
            fusion: isFusionMode ? fusionList : 'Disabled',
            baseData: {
                format: "TOON (Time, Open, High, Low, Close, Volume)",
                last20Candles: baseChartData
            },
            newsEvents: activeNewsEvents.map(e => ({
                title: e.title,
                date: e.time,
                description: e.description
            })),
            activeIndicators: indicators.filter(i => i.visible).map(i => ({
                name: i.name,
                recentValues: computedIndicatorData[i.id] || 'No data captured'
            }))
        };

        const fullReport = await generateMarketReport(sessionPayload);
        const generatedGist = await generateGist(fullReport);

        setReport(fullReport);
        setGist(generatedGist);
        setIsAnalyzing(false);
    };

    const handleExport = () => {
        if (!report || !gist) return;

        addNote({
            id: `ai_${Date.now()}`,
            title: `AI Analysis: ${selectedState} - ${selectedDistrict || 'State Level'}`,
            description: `${gist}\n\n${report}`,
            location: `${selectedState} ${selectedDistrict ? '> ' + selectedDistrict : ''}`,
            savedAt: new Date().toISOString(),
            type: 'ai'
        });

        setIsExported(true);
        setTimeout(() => setIsExported(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-surface border-l border-border w-[320px] shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface/95 backdrop-blur">
                <div className="flex items-center gap-2 text-purple-400">
                    <BrainCircuit size={20} />
                    <h2 className="font-semibold tracking-wide">AI Analyst</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Context Card */}
                <div className="bg-[#131722] p-3 rounded-lg border border-border/50 text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                        <span>Target:</span>
                        <span className="text-white">{selectedDistrict || selectedState}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Dataset:</span>
                        <span className="text-white capitalize">{primaryDataset}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Indicators:</span>
                        <span className="text-blue-400">{indicators.filter(i => i.visible).length} Active</span>
                    </div>
                </div>

                {/* Action Area */}
                {!report && !isAnalyzing && (
                    <div className="text-center py-10 space-y-4">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400">
                            <BrainCircuit size={32} />
                        </div>
                        <p className="text-sm text-gray-400 px-4">
                            Analyze current indicators and data trends to generate insights.
                        </p>
                        <button
                            onClick={handleAnalyze}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-md font-medium transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                        >
                            Analyze Session
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isAnalyzing && (
                    <div className="text-center py-10 space-y-3">
                        <Loader2 size={32} className="animate-spin text-purple-500 mx-auto" />
                        <p className="text-sm text-purple-300 animate-pulse">Consulting Gemini 2.0...</p>
                    </div>
                )}

                {/* Results */}
                {report && gist && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Gist Card */}
                        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-150" />
                            <h3 className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                <FileText size={12} /> Observation Gist
                            </h3>
                            <p className="text-white/90 text-sm leading-relaxed font-medium">
                                {gist}
                            </p>
                        </div>

                        {/* Export Action */}
                        <button
                            onClick={handleExport}
                            disabled={isExported}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded border text-sm transition-all ${isExported
                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                : 'bg-[#131722] border-border text-gray-300 hover:border-purple-500 hover:text-white'
                                }`}
                        >
                            {isExported ? <Save size={14} /> : <StickyNote size={14} />}
                            {isExported ? 'Saved to Notes!' : 'Export to Notes'}
                        </button>

                        {/* Full Report Accordion */}
                        <div className="border border-border rounded-lg overflow-hidden bg-[#131722]/50">
                            <button
                                onClick={() => setIsReportExpanded(!isReportExpanded)}
                                className="w-full flex items-center justify-between p-3 text-sm text-gray-300 hover:bg-white/5"
                            >
                                <span>Detailed Analysis</span>
                                {isReportExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            {isReportExpanded && (
                                <div className="p-4 border-t border-border/50 text-xs text-gray-400 leading-relaxed whitespace-pre-line bg-black/20">
                                    {report}
                                </div>
                            )}
                        </div>

                        <div className="text-center pt-4">
                            <button
                                onClick={handleAnalyze}
                                className="text-xs text-purple-400 hover:text-purple-300 underline"
                            >
                                Re-Analyze
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
