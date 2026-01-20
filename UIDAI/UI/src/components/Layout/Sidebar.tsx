import {
    Crosshair, LineChart, Hash, Text, Smile,
    Ruler, Trash, MousePointer2
} from 'lucide-react';

export const Sidebar = () => {
    const tools = [
        { icon: Crosshair, label: 'Crosshair' },
        { icon: LineChart, label: 'Trend Line' },
        { icon: Hash, label: 'Fibonacci' },
        { icon: Text, label: 'Text' },
        { icon: Smile, label: 'Icons' },
        { icon: Ruler, label: 'Measure' },
        { type: 'divider' },
        { icon: Trash, label: 'Remove Drawings', danger: true },
    ];

    return (
        <div className="w-14 bg-surface border-r border-border flex flex-col items-center py-2 space-y-1">
            {tools.map((tool, i) => {
                if (tool.type === 'divider') {
                    return <div key={i} className="w-8 h-[1px] bg-border my-2" />;
                }
                const Icon = tool.icon!;
                return (
                    <button
                        key={i}
                        className={`p-2 rounded hover:bg-white/5 transition group relative ${tool.danger ? 'hover:text-danger' : 'hover:text-primary'}`}
                        title={tool.label}
                    >
                        <Icon size={20} className="text-textSecondary group-hover:text-current" />

                        {/* Tooltip mockup */}
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                            {tool.label}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
