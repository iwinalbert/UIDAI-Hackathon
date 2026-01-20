import { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
    FileText,
    Clock,
    MessageCircle,
    Bell,
    HelpCircle,
    X,
    Download,
    Plus,
    Trash2,
    Send,
    ExternalLink,
    Newspaper
} from 'lucide-react';

type PanelType = 'notes' | 'alerts' | 'chat' | 'notifications' | null;

interface Alert {
    id: string;
    type: 'price' | 'time';
    value: string;
    active: boolean;
}

export const RightSidebar = () => {
    const [activePanel, setActivePanel] = useState<PanelType>(null);
    const { notes, addNote: addStoreNote, removeNote } = useStore(); // Use global store
    const [newNote, setNewNote] = useState('');
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [notifications] = useState([
        { id: '1', message: 'Velocity spike detected in Bengaluru', time: '2m ago' },
        { id: '2', message: 'Data sync completed', time: '15m ago' },
    ]);

    const togglePanel = (panel: PanelType) => {
        setActivePanel(activePanel === panel ? null : panel);
    };

    // Notes Functions
    const addManualNote = () => {
        if (!newNote.trim()) return;
        addStoreNote({
            id: Date.now().toString(),
            title: 'Quick Note', // Default title for manual notes
            description: newNote,
            savedAt: new Date().toISOString(),
            type: 'user'
        });
        setNewNote('');
    };

    const deleteNote = (id: string) => {
        removeNote(id);
    };

    const exportNotes = () => {
        const content = notes.map(n =>
            `[${new Date(n.savedAt).toLocaleString()}]\n${n.title}\n${n.description}\n`
        ).join('\n---\n\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aadhaar-notes-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Alerts Functions
    const addAlert = () => {
        setAlerts(prev => [...prev, {
            id: Date.now().toString(),
            type: 'time',
            value: '',
            active: true
        }]);
    };

    const deleteAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    // Social Links
    const openWhatsApp = () => {
        window.open('https://wa.me/?text=Check%20out%20this%20Aadhaar%20velocity%20analysis', '_blank');
    };

    const sidebarIcons = [
        { id: 'notes', icon: FileText, label: 'Notes & Snapshots', panel: 'notes' as PanelType },
        { id: 'alerts', icon: Clock, label: 'Alerts', panel: 'alerts' as PanelType },
        { id: 'chat', icon: MessageCircle, label: 'Chat & Share', panel: 'chat' as PanelType },
        { id: 'divider1', icon: null, label: '', panel: null },

        { id: 'notifications', icon: Bell, label: 'Notifications', panel: 'notifications' as PanelType },
        { id: 'divider2', icon: null, label: '', panel: null },
        { id: 'help', icon: HelpCircle, label: 'Help', panel: null },
    ];

    return (
        <div className="flex h-full">
            {/* Expanded Panel */}
            {activePanel && (
                <div className="w-80 bg-surface border-l border-border flex flex-col">
                    {/* Panel Header */}
                    <div className="h-12 flex items-center justify-between px-4 border-b border-border">
                        <h3 className="text-white font-medium text-sm">
                            {activePanel === 'notes' && 'Notes & Snapshots'}
                            {activePanel === 'alerts' && 'Alerts'}
                            {activePanel === 'chat' && 'Chat & Share'}
                            {activePanel === 'notifications' && 'Notifications'}
                        </h3>
                        <button
                            onClick={() => setActivePanel(null)}
                            className="text-textSecondary hover:text-white transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Notes Panel */}
                        {activePanel === 'notes' && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add a note or snapshot description..."
                                        className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-white resize-none h-20"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={addManualNote}
                                        className="flex-1 bg-primary hover:bg-blue-600 text-white text-sm py-2 rounded flex items-center justify-center gap-2 transition"
                                    >
                                        <Plus size={16} /> Add Note
                                    </button>
                                    <button
                                        onClick={exportNotes}
                                        disabled={notes.length === 0}
                                        className="bg-surface border border-border hover:bg-white/5 text-white text-sm py-2 px-3 rounded flex items-center gap-2 transition disabled:opacity-50"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>

                                {notes.length === 0 ? (
                                    <p className="text-textSecondary text-sm text-center py-8">
                                        No notes yet. Add your first note above.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {notes.map(note => (
                                            <div key={note.id} className={`bg-background border rounded p-3 group ${note.type === 'news' ? 'border-orange-500/30' : 'border-border'}`}>
                                                {/* News Article Header */}
                                                {note.type === 'news' && note.title && (
                                                    <div className="flex items-start gap-2 mb-2">
                                                        <Newspaper size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                        <span className="text-xs text-orange-400 font-medium">News Article</span>
                                                    </div>
                                                )}

                                                {/* Title or Content */}
                                                {note.title ? (
                                                    <h4 className="text-sm text-white font-medium leading-tight">{note.title}</h4>
                                                ) : (
                                                    <p className="text-sm text-white whitespace-pre-wrap">{note.description}</p>
                                                )}

                                                {/* Description */}
                                                {note.description && note.type === 'news' && (
                                                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{note.description}</p>
                                                )}

                                                {/* Location Badge */}
                                                {note.location && (
                                                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                                        📍 {note.location}
                                                    </div>
                                                )}

                                                {/* Footer with URL and actions */}
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-textSecondary">
                                                            {new Date(note.savedAt).toLocaleString()}
                                                        </span>

                                                        {/* URL Link */}
                                                        {note.url && (
                                                            <a
                                                                href={note.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                                                            >
                                                                <ExternalLink size={10} />
                                                                Open
                                                            </a>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => deleteNote(note.id)}
                                                        className="text-textSecondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Alerts Panel */}
                        {activePanel === 'alerts' && (
                            <div className="space-y-4">
                                <button
                                    onClick={addAlert}
                                    className="w-full bg-primary hover:bg-blue-600 text-white text-sm py-2 rounded flex items-center justify-center gap-2 transition"
                                >
                                    <Plus size={16} /> Create Alert
                                </button>

                                {alerts.length === 0 ? (
                                    <p className="text-textSecondary text-sm text-center py-8">
                                        No alerts set. Create an alert to get notified.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {alerts.map(alert => (
                                            <div key={alert.id} className="bg-background border border-border rounded p-3 flex items-center gap-3">
                                                <Clock size={18} className="text-primary" />
                                                <div className="flex-1">
                                                    <select
                                                        className="bg-transparent text-white text-sm border-none outline-none"
                                                        defaultValue={alert.type}
                                                    >
                                                        <option value="time">Time Alert</option>
                                                        <option value="price">Velocity Threshold</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        placeholder="Set value..."
                                                        className="block w-full bg-transparent text-textSecondary text-xs mt-1 border-none outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => deleteAlert(alert.id)}
                                                    className="text-textSecondary hover:text-red-400 transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Chat Panel */}
                        {activePanel === 'chat' && (
                            <div className="space-y-4">
                                <p className="text-textSecondary text-sm">
                                    Share your analysis or connect with others.
                                </p>

                                <div className="space-y-2">
                                    <button
                                        onClick={openWhatsApp}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-3 rounded flex items-center justify-center gap-2 transition"
                                    >
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Share on WhatsApp
                                    </button>

                                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-3 rounded flex items-center justify-center gap-2 transition">
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        Share on X
                                    </button>

                                    <button className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm py-3 rounded flex items-center justify-center gap-2 transition">
                                        <Send size={16} />
                                        Copy Share Link
                                    </button>
                                </div>

                                <div className="border-t border-border pt-4 mt-4">
                                    <h4 className="text-white text-sm font-medium mb-2">Quick Message</h4>
                                    <textarea
                                        placeholder="Type a message..."
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-white resize-none h-20"
                                    />
                                    <button className="mt-2 w-full bg-surface border border-border hover:bg-white/5 text-white text-sm py-2 rounded transition">
                                        Send Message
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Notifications Panel */}
                        {activePanel === 'notifications' && (
                            <div className="space-y-2">
                                {notifications.map(notif => (
                                    <div key={notif.id} className="bg-background border border-border rounded p-3">
                                        <p className="text-sm text-white">{notif.message}</p>
                                        <span className="text-xs text-textSecondary">{notif.time}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Icon Bar */}
            <div className="w-12 bg-surface border-l border-border flex flex-col items-center py-2">
                {sidebarIcons.map((item) => {
                    if (item.icon === null) {
                        return <div key={item.id} className="w-6 h-[1px] bg-border my-2" />;
                    }

                    const Icon = item.icon;
                    const isActive = activePanel === item.panel && item.panel !== null;

                    if (item.id === 'help') {
                        return (
                            <button
                                key={item.id}
                                onClick={() => window.open('/#help', '_blank')}
                                title={item.label}
                                className="w-10 h-10 flex items-center justify-center rounded transition mb-1 text-textSecondary hover:text-white hover:bg-white/5"
                            >
                                <Icon size={20} />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => item.panel && togglePanel(item.panel)}
                            title={item.label}
                            className={`w-10 h-10 flex items-center justify-center rounded transition mb-1 ${isActive
                                ? 'bg-primary/20 text-primary'
                                : 'text-textSecondary hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={20} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
