import { useState } from 'react';
import { X, Save, Code } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PRESETS } from '../../utils/indicatorEngine';

export const IndicatorModal = () => {
    const { isIndicatorModalOpen, setIndicatorModalOpen, addIndicator } = useStore();
    const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
    const [customScript, setCustomScript] = useState(PRESETS['SMA']);
    const [customName, setCustomName] = useState('My Indicator');

    if (!isIndicatorModalOpen) return null;

    const handleAddPreset = (name: string, script: string) => {
        addIndicator({
            id: crypto.randomUUID(),
            name,
            type: 'overlay',
            script,
            visible: true,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16)
        });
        setIndicatorModalOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-md">
            <div className="bg-surface border border-border rounded-xl w-[900px] h-[650px] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="h-16 border-b border-border flex items-center justify-between px-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Indicators & Strategies
                    </h2>
                    <button
                        onClick={() => setIndicatorModalOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-56 border-r border-border p-4 space-y-2 bg-[#1e222d]">
                        <button
                            onClick={() => setActiveTab('presets')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'presets' ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'hover:bg-white/5 text-textSecondary hover:text-white'}`}
                        >
                            Built-ins
                        </button>
                        <button
                            onClick={() => setActiveTab('custom')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center space-x-2 ${activeTab === 'custom' ? 'bg-primary text-white shadow-lg shadow-blue-500/20' : 'hover:bg-white/5 text-textSecondary hover:text-white'}`}
                        >
                            <Code size={18} />
                            <span>Script Editor</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-auto bg-[#131722]">
                        {activeTab === 'presets' ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(PRESETS).map(([name, script]) => (
                                    <div key={name} className="border border-border p-5 rounded-lg hover:border-primary hover:bg-white/5 cursor-pointer group transition" onClick={() => handleAddPreset(name, script)}>
                                        <h3 className="font-bold text-lg group-hover:text-primary transition">{name}</h3>
                                        <p className="text-sm text-textSecondary mt-2">Standard Technical Indicator</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col space-y-4">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded text-sm">
                                    Advanced Mode: Write JavaScript code to process OHLC data. The `data` array is available in your scope. Return an array of `{'{ time, value }'}` objects.
                                </div>
                                <input
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    className="bg-surface border border-border rounded px-4 py-3 w-full focus:border-primary outline-none font-medium"
                                    placeholder="Indicator Name"
                                />
                                <div className="flex-1 relative border border-border rounded overflow-hidden">
                                    <textarea
                                        value={customScript}
                                        onChange={e => setCustomScript(e.target.value)}
                                        className="absolute inset-0 w-full h-full bg-[#0d1017] p-4 font-mono text-sm focus:outline-none text-green-400 resize-none leading-relaxed"
                                        spellCheck={false}
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => handleAddPreset(customName, customScript)}
                                        className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold flex items-center space-x-2 transition shadow-lg shadow-blue-500/20"
                                    >
                                        <Save size={18} />
                                        <span>Add to Chart</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
