import { useState, useRef, useEffect } from 'react';
import {
    MousePointer2, TrendingUp, Minus, ArrowRight, Move,
    PenTool, Highlighter, Square, Circle, Triangle, Type,
    StickyNote, MessageSquare, Tag, Eye, EyeOff, Pencil,
    Trash2, ChevronRight, ArrowUp, ArrowDown, Hash
} from 'lucide-react';
import { useDrawingStore, type DrawingToolType, type DrawingCategory } from '../../store/useDrawingStore';

interface ToolItem {
    id: DrawingToolType;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
}

interface ToolCategory {
    id: DrawingCategory;
    label: string;
    icon: React.ReactNode;
    tools: ToolItem[];
}

// Tool definitions organized by category
const toolCategories: ToolCategory[] = [
    {
        id: 'lines',
        label: 'Lines',
        icon: <TrendingUp size={18} />,
        tools: [
            { id: 'trendLine', label: 'Trend Line', icon: <TrendingUp size={16} />, shortcut: 'Alt+T' },
            { id: 'ray', label: 'Ray', icon: <ArrowRight size={16} /> },
            { id: 'horizontalLine', label: 'Horizontal Line', icon: <Minus size={16} />, shortcut: 'Alt+H' },
            { id: 'verticalLine', label: 'Vertical Line', icon: <div className="w-[2px] h-4 bg-current" /> },
            { id: 'crossLine', label: 'Cross Line', icon: <div className="relative w-4 h-4"><div className="absolute top-1/2 left-0 w-full h-[2px] bg-current -translate-y-1/2" /><div className="absolute left-1/2 top-0 h-full w-[2px] bg-current -translate-x-1/2" /></div>, shortcut: 'Alt+C' },
            { id: 'extendedLine', label: 'Extended Line', icon: <Minus size={16} /> },
            { id: 'parallelChannel', label: 'Parallel Channel', icon: <div className="flex flex-col gap-1"><div className="w-4 h-[2px] bg-current" /><div className="w-4 h-[2px] bg-current" /></div> },
            { id: 'regressionTrend', label: 'Regression Trend', icon: <TrendingUp size={16} /> },
        ]
    },
    {
        id: 'brushes',
        label: 'Brushes',
        icon: <PenTool size={18} />,
        tools: [
            { id: 'brush', label: 'Brush', icon: <PenTool size={16} /> },
            { id: 'highlighter', label: 'Highlighter', icon: <Highlighter size={16} /> },
            { id: 'arrowMarker', label: 'Arrow Marker', icon: <ArrowRight size={16} /> },
            { id: 'arrow', label: 'Arrow', icon: <ArrowRight size={16} /> },
            { id: 'arrowUp', label: 'Arrow Mark Up', icon: <ArrowUp size={16} /> },
            { id: 'arrowDown', label: 'Arrow Mark Down', icon: <ArrowDown size={16} /> },
        ]
    },
    {
        id: 'shapes',
        label: 'Shapes',
        icon: <Square size={18} />,
        tools: [
            { id: 'rectangle', label: 'Rectangle', icon: <Square size={16} />, shortcut: 'Alt+Shift+R' },
            { id: 'circle', label: 'Circle', icon: <Circle size={16} /> },
            { id: 'ellipse', label: 'Ellipse', icon: <Circle size={16} className="scale-x-125" /> },
            { id: 'triangle', label: 'Triangle', icon: <Triangle size={16} /> },
            { id: 'path', label: 'Path', icon: <Move size={16} /> },
            { id: 'polyline', label: 'Polyline', icon: <TrendingUp size={16} /> },
        ]
    },
    {
        id: 'text',
        label: 'Text & Notes',
        icon: <Type size={18} />,
        tools: [
            { id: 'text', label: 'Text', icon: <Type size={16} /> },
            { id: 'anchoredText', label: 'Anchored Text', icon: <Type size={16} /> },
            { id: 'note', label: 'Note', icon: <StickyNote size={16} /> },
            { id: 'callout', label: 'Callout', icon: <MessageSquare size={16} /> },
            { id: 'priceLabel', label: 'Price Label', icon: <Tag size={16} /> },
            { id: 'pin', label: 'Pin', icon: <div className="w-2 h-2 rounded-full bg-current" /> },
            { id: 'flagMark', label: 'Flag Mark', icon: <div className="flex items-end gap-0.5"><div className="w-[2px] h-4 bg-current" /><div className="w-2 h-2 bg-current" /></div> },
        ]
    },
    {
        id: 'measure',
        label: 'Measure',
        icon: <Hash size={18} />,
        tools: [
            { id: 'measure', label: 'Measure', icon: <Hash size={16} /> },
        ]
    }
];

export const DrawingToolbar = () => {
    const {
        activeTool,
        activeCategory,
        keepDrawing,
        drawingsVisible,
        drawings,
        setActiveTool,
        setActiveCategory,
        setKeepDrawing,
        toggleDrawingsVisible,
        deleteAllDrawings
    } = useDrawingStore();

    const [hoveredCategory, setHoveredCategory] = useState<DrawingCategory | null>(null);
    const [flyoutPosition, setFlyoutPosition] = useState({ top: 0 });
    const toolbarRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Handle category hover
    const handleCategoryHover = (category: ToolCategory, event: React.MouseEvent) => {
        clearTimeout(hoverTimeoutRef.current);
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const toolbarRect = toolbarRef.current?.getBoundingClientRect();
        setFlyoutPosition({ top: rect.top - (toolbarRect?.top || 0) });
        setHoveredCategory(category.id);
    };

    const handleCategoryLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredCategory(null);
        }, 150);
    };

    const handleFlyoutEnter = () => {
        clearTimeout(hoverTimeoutRef.current);
    };

    // Select tool from flyout
    const selectTool = (tool: ToolItem, category: DrawingCategory) => {
        setActiveTool(tool.id);
        setActiveCategory(category);
        setHoveredCategory(null);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Alt+H = Toggle drawings visibility
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                toggleDrawingsVisible();
            }
            // ESC = Deselect tool
            if (e.key === 'Escape') {
                setActiveTool(null);
                setActiveCategory(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleDrawingsVisible, setActiveTool, setActiveCategory]);

    return (
        <div
            ref={toolbarRef}
            className="w-14 bg-surface border-r border-border flex flex-col items-center py-2 relative"
        >
            {/* Cursor Tool */}
            <button
                onClick={() => {
                    setActiveTool(null);
                    setActiveCategory(null);
                }}
                className={`p-2.5 rounded transition group relative mb-1 ${activeTool === null
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-white/5 text-textSecondary hover:text-white'
                    }`}
                title="Cursor"
            >
                <MousePointer2 size={20} />
            </button>

            <div className="w-8 h-[1px] bg-border my-2" />

            {/* Tool Categories */}
            {toolCategories.map((category) => {
                const isActive = activeCategory === category.id;

                return (
                    <div key={category.id} className="relative">
                        <button
                            onMouseEnter={(e) => handleCategoryHover(category, e)}
                            onMouseLeave={handleCategoryLeave}
                            className={`p-2.5 rounded transition group relative ${isActive
                                ? 'bg-primary/20 text-primary'
                                : 'hover:bg-white/5 text-textSecondary hover:text-white'
                                }`}
                            title={category.label}
                        >
                            {category.icon}
                            {/* Flyout indicator */}
                            <ChevronRight size={10} className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-50" />
                        </button>
                    </div>
                );
            })}

            <div className="w-8 h-[1px] bg-border my-2" />

            {/* Keep Drawing Toggle */}
            <button
                onClick={() => setKeepDrawing(!keepDrawing)}
                className={`p-2.5 rounded transition group relative ${keepDrawing
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'hover:bg-white/5 text-textSecondary hover:text-white'
                    }`}
                title={keepDrawing ? 'Keep Drawing (On)' : 'Keep Drawing (Off)'}
            >
                <Pencil size={20} />
            </button>

            {/* Hide/Show Drawings */}
            <button
                onClick={toggleDrawingsVisible}
                className={`p-2.5 rounded transition group relative ${!drawingsVisible
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'hover:bg-white/5 text-textSecondary hover:text-white'
                    }`}
                title={`${drawingsVisible ? 'Hide' : 'Show'} All Drawings (Ctrl+Alt+H)`}
            >
                {drawingsVisible ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>

            <div className="flex-1" />

            {/* Delete All Drawings */}
            <button
                onClick={deleteAllDrawings}
                disabled={drawings.length === 0}
                className="p-2.5 rounded transition group relative text-textSecondary hover:text-red-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Delete All Drawings"
            >
                <Trash2 size={20} />
            </button>

            {/* Flyout Menu */}
            {hoveredCategory && (
                <div
                    className="absolute left-full ml-1 bg-surface border border-border rounded-lg shadow-xl z-50 min-w-[200px] py-2"
                    style={{ top: flyoutPosition.top }}
                    onMouseEnter={handleFlyoutEnter}
                    onMouseLeave={handleCategoryLeave}
                >
                    {/* Category Header */}
                    <div className="px-3 py-1.5 text-xs text-gray-400 uppercase font-medium border-b border-border mb-1">
                        {toolCategories.find(c => c.id === hoveredCategory)?.label}
                    </div>

                    {/* Tools List */}
                    {toolCategories
                        .find(c => c.id === hoveredCategory)
                        ?.tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => selectTool(tool, hoveredCategory)}
                                className={`w-full px-3 py-2 flex items-center gap-3 text-sm transition ${activeTool === tool.id
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                <span className="w-5 h-5 flex items-center justify-center text-gray-400">
                                    {tool.icon}
                                </span>
                                <span className="flex-1 text-left">{tool.label}</span>
                                {tool.shortcut && (
                                    <span className="text-xs text-gray-500">{tool.shortcut}</span>
                                )}
                            </button>
                        ))
                    }
                </div>
            )}

            {/* Tooltips */}
            {activeTool && (
                <div className="absolute bottom-2 left-full ml-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {toolCategories.flatMap(c => c.tools).find(t => t.id === activeTool)?.label || 'Cursor'}
                    {keepDrawing && <span className="ml-1 text-orange-400">(Keep Drawing)</span>}
                </div>
            )}
        </div>
    );
};
