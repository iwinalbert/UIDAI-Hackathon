import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { X, Newspaper, ExternalLink, Clock, MapPin, ChevronRight, FileText, Check } from 'lucide-react';
import type { ChartEvent } from '../../types';

interface NewsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    events: ChartEvent[];
    state: string;
    district: string;
    isLoading: boolean;
    onEventClick?: (event: ChartEvent) => void;
}

export const NewsSidebar = ({
    isOpen,
    onClose,
    events,
    state,
    district,
    isLoading,
    onEventClick
}: NewsSidebarProps) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [exportedIds, setExportedIds] = useState<Set<string>>(new Set());
    const { addNote, notes: globalNotes } = useStore();

    if (!isOpen) return null;

    // Export article to notes (Global Store)
    const exportToNotes = (event: ChartEvent) => {
        addNote({
            id: `news_${event.id}`,
            title: event.title,
            description: event.description || '',
            url: event.url,
            location: `${state}${district ? ' > ' + district : ''}`,
            savedAt: new Date().toISOString(),
            type: 'news'
        });

        // Mark as exported
        setExportedIds(prev => new Set([...prev, event.id]));

        console.log('[NewsSidebar] Exported to notes:', event.title);
    };

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                <div className="flex items-center gap-2">
                    <Newspaper size={18} className="text-orange-500" />
                    <h2 className="font-semibold text-white">News Events</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Location Badge */}
            <div className="px-4 py-3 border-b border-border/50 bg-surface/50">
                <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-primary" />
                    <span className="text-gray-300">{state}</span>
                    {district && (
                        <>
                            <ChevronRight size={12} className="text-gray-500" />
                            <span className="text-white font-medium">{district}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mb-3" />
                        <p className="text-sm">Fetching news...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 p-4 text-center">
                        <Newspaper size={32} className="mb-3 opacity-50" />
                        <p className="text-sm">No news articles found</p>
                        <p className="text-xs mt-1">Try selecting a different location</p>
                    </div>
                ) : (
                    <div className="p-3 space-y-3">
                        {events.map((event, index) => (
                            <div
                                key={`${event.id}-${index}`}
                                className={`bg-background rounded-lg border transition-all duration-200 ${expandedId === event.id
                                    ? 'border-orange-500/50 shadow-lg'
                                    : 'border-border hover:border-border/80 hover:bg-white/5'
                                    }`}
                            >
                                {/* Article Header */}
                                <div
                                    className="p-3 cursor-pointer"
                                    onClick={() => {
                                        setExpandedId(expandedId === event.id ? null : event.id);
                                        if (expandedId !== event.id && onEventClick) {
                                            onEventClick(event);
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                                            style={{ backgroundColor: `${event.color}20`, color: event.color }}
                                        >
                                            {event.icon || '📰'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-white leading-tight line-clamp-2">
                                                {event.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                                                <Clock size={10} />
                                                <span>{formatEventDate(event.time as string)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedId === event.id && (
                                    <div className="px-3 pb-3 pt-0 border-t border-border/50">
                                        <p className="text-xs text-gray-300 leading-relaxed mt-2">
                                            {event.description}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 mt-3">
                                            {/* Open Article Link */}
                                            {event.url && (
                                                <a
                                                    href={event.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs transition"
                                                >
                                                    <ExternalLink size={12} />
                                                    Open Article
                                                </a>
                                            )}

                                            {/* Export to Notes */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    exportToNotes(event);
                                                }}
                                                disabled={exportedIds.has(event.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition ${exportedIds.has(event.id)
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                                                    }`}
                                            >
                                                {exportedIds.has(event.id) ? (
                                                    <>
                                                        <Check size={12} />
                                                        Saved
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText size={12} />
                                                        Save to Notes
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {events.length > 0 && (
                <div className="p-3 border-t border-border bg-background text-center">
                    <span className="text-xs text-gray-400">
                        {events.length} article{events.length !== 1 ? 's' : ''} found
                    </span>
                </div>
            )}
        </div>
    );
};

// Helper function to format event date
function formatEventDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}
