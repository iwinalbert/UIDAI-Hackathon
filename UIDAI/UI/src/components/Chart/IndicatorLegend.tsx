import { Eye, EyeOff, Settings2, Trash2, Code2, MoreHorizontal, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Indicator } from '../../types';

interface IndicatorLegendProps {
    onEditIndicator?: (indicator: Indicator) => void;
}

export const IndicatorLegend = ({ onEditIndicator }: IndicatorLegendProps) => {
    const { indicators, updateIndicator, removeIndicator } = useStore();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (indicators.length === 0) return null;

    const toggleExpanded = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleToggleVisibility = (indicator: Indicator) => {
        updateIndicator(indicator.id, { visible: !indicator.visible });
    };

    const handleRemove = (id: string) => {
        removeIndicator(id);
        if (expandedId === id) setExpandedId(null);
    };

    const handleEdit = (indicator: Indicator) => {
        if (onEditIndicator) {
            onEditIndicator(indicator);
        }
    };

    return (
        <div className="absolute left-2 z-20 flex flex-col gap-1" style={{ top: '52px' }}>
            {indicators.map((indicator) => (
                <div
                    key={indicator.id}
                    className="group relative"
                    onMouseEnter={() => setHoveredId(indicator.id)}
                    onMouseLeave={() => setHoveredId(null)}
                >
                    {/* Main Legend Row */}
                    <div
                        className={`
                            flex items-center gap-1.5 
                            bg-[#1e222d]/95 backdrop-blur-sm 
                            border border-[#2a2e39] rounded 
                            pl-1.5 pr-1 py-0.5
                            transition-all duration-150
                            ${!indicator.visible ? 'opacity-50' : ''}
                        `}
                    >
                        {/* Color Indicator */}
                        <div
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: indicator.color }}
                        />

                        {/* Indicator Name & Parameters */}
                        <span className="text-[11px] text-gray-300 font-medium truncate max-w-[160px]">
                            {indicator.name}
                        </span>

                        {/* Controls - visible on hover */}
                        <div
                            className={`
                                flex items-center gap-0.5 ml-1
                                transition-opacity duration-150
                                ${hoveredId === indicator.id ? 'opacity-100' : 'opacity-0'}
                            `}
                        >
                            {/* Visibility Toggle */}
                            <button
                                onClick={() => handleToggleVisibility(indicator)}
                                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title={indicator.visible ? 'Hide Indicator' : 'Show Indicator'}
                            >
                                {indicator.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>

                            {/* Settings/Edit */}
                            <button
                                onClick={() => handleEdit(indicator)}
                                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Edit Indicator Settings"
                            >
                                <Settings2 size={12} />
                            </button>

                            {/* View Code */}
                            <button
                                onClick={() => toggleExpanded(indicator.id)}
                                className={`p-1 rounded hover:bg-white/10 transition-colors ${expandedId === indicator.id ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                                title="View Script"
                            >
                                <Code2 size={12} />
                            </button>

                            {/* Delete */}
                            <button
                                onClick={() => handleRemove(indicator.id)}
                                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                title="Remove Indicator"
                            >
                                <Trash2 size={12} />
                            </button>

                            {/* More Options */}
                            <button
                                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="More Options"
                            >
                                <MoreHorizontal size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Expanded Code View */}
                    {expandedId === indicator.id && (
                        <div className="mt-1 bg-[#1e222d]/95 backdrop-blur-sm border border-[#2a2e39] rounded p-2 max-w-[320px] animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Script</span>
                                <button
                                    onClick={() => setExpandedId(null)}
                                    className="text-gray-500 hover:text-white text-xs"
                                >
                                    ×
                                </button>
                            </div>
                            <pre className="text-[10px] text-gray-400 bg-black/30 rounded p-2 overflow-auto max-h-[120px] custom-scrollbar font-mono leading-relaxed">
                                {indicator.script.trim()}
                            </pre>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default IndicatorLegend;
