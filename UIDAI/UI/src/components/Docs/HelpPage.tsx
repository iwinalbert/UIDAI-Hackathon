import { useState, useEffect, useRef } from "react";
import { ArrowLeft, BookOpen, Cpu, Activity, Share2, Printer } from "lucide-react";

export const HelpPage = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'architecture' | 'indicators'>('architecture');

    // Simple scroll progress
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const totalScroll = container.scrollTop;
            const containerHeight = container.scrollHeight - container.clientHeight;
            const ratio = containerHeight > 0 ? totalScroll / containerHeight : 0;
            setScrollProgress(ratio);
        };

        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div
            ref={scrollContainerRef}
            className="h-screen overflow-y-auto bg-[#0E1117] text-gray-300 font-sans selection:bg-purple-500/30 selection:text-purple-200"
        >

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 h-1 bg-purple-600 z-50 transition-all duration-100" style={{ width: `${scrollProgress * 100}%` }} />

            {/* Navigation Header */}
            <nav className="sticky top-0 z-40 bg-[#0E1117]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-600/20 p-2 rounded-lg text-purple-400">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">UIDAI Velocity Docs</h1>
                        <p className="text-xs text-gray-500 font-mono">technical_reference_v2.4.md</p>
                    </div>
                </div>

                <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setActiveTab('architecture')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'architecture' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Cpu size={16} />
                        Architecture
                    </button>
                    <button
                        onClick={() => setActiveTab('indicators')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'indicators' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Activity size={16} />
                        Indicators
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-white transition"><Printer size={20} /></button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {activeTab === 'architecture' ? (
                    <article className="prose prose-invert prose-purple max-w-none">
                        <div className="mb-12 border-b border-white/10 pb-8">
                            <h1 className="text-4xl font-bold text-white mb-4">Velocity Indicator: Distributed Log Architecture</h1>
                            <p className="text-xl text-gray-400 leading-relaxed">
                                This document outlines the <span className="text-purple-400 font-semibold inside-ring">"Partition-by-PIN"</span> strategy for the Velocity Indicator component.
                                It is designed to solve the problem of calculating <strong className="text-white">Time-Series Derivatives (Velocity)</strong> at a national scale using Apache Kafka.
                            </p>
                        </div>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                                <span className="text-purple-500">#</span> Core Principle: "Mathematical Locality"
                            </h2>
                            <div className="bg-purple-900/10 border-l-4 border-purple-500 p-6 rounded-r-lg mb-6">
                                <p className="text-gray-300">
                                    To calculate velocity (dX/dt), updates must be processed <strong>by the same CPU core</strong> and <strong>in order</strong>.
                                    Partitioning by PIN guarantees that all history for a location exists on a single "shard", enabling stateful processing without network shuffling.
                                </p>
                            </div>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-6">Phase 1: Topic Engineering</h2>
                            <div className="overflow-x-auto rounded-lg border border-white/10">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-white">
                                        <tr>
                                            <th className="p-4">Parameter</th>
                                            <th className="p-4">Value</th>
                                            <th className="p-4">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr className="hover:bg-white/5 transition">
                                            <td className="p-4 font-mono text-purple-300">Topic Name</td>
                                            <td className="p-4 font-mono">aadhaar.biometric.updates.v1</td>
                                            <td className="p-4 text-gray-400">Explicit versioning</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition">
                                            <td className="p-4 font-mono text-purple-300">Partition Count</td>
                                            <td className="p-4 font-bold text-white">1,024</td>
                                            <td className="p-4 text-gray-400">High parallelism (~19k PINs)</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition">
                                            <td className="p-4 font-mono text-purple-300">Cleanup Policy</td>
                                            <td className="p-4 font-mono text-red-300">delete</td>
                                            <td className="p-4 text-gray-400">Preserve history for calcs (NOT compact)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-6">Phase 2: Stateful Stream Processor</h2>
                            <p className="mb-4">Using <strong>Kafka Streams</strong> with <strong>RocksDB</strong> for local state.</p>

                            <div className="bg-[#1e1e1e] p-6 rounded-lg border border-white/10 font-mono text-sm overflow-x-auto shadow-2xl">
                                <pre className="text-gray-300">
                                    <span className="text-purple-400">const</span> velocity = (current_count - prev_count) / 1.0;

                                    <span className="text-green-400">// Handle Cold Start</span>
                                    <span className="text-blue-400">if</span> (prev_count == null) {'{'}
                                    velocity = 0.0;
                                    {'}'}

                                    <span className="text-green-400">// Sink to Output Topic</span>
                                    context.forward(pin, <span className="text-yellow-400">new</span> VelocityResult(velocity));
                                </pre>
                            </div>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-6">Phase 5: Frontend Integration</h2>
                            <p className="mb-6">Replaces static JSON with a <strong>WebSocket Adapter</strong>.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h3 className="font-semibold text-white mb-2">Kafka Output</h3>
                                    <code className="text-xs bg-black/30 px-2 py-1 rounded text-purple-300">aadhaar.velocity.output.v1</code>
                                </div>
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h3 className="font-semibold text-white mb-2">React Sub</h3>
                                    <code className="text-xs bg-black/30 px-2 py-1 rounded text-blue-300">socket.subscribe('velocity/updates')</code>
                                </div>
                            </div>
                        </section>
                    </article>
                ) : (
                    <article className="prose prose-invert prose-blue max-w-none">
                        <div className="mb-12 border-b border-white/10 pb-8">
                            <h1 className="text-4xl font-bold text-white mb-4">Indicator Technical Reference</h1>
                            <p className="text-xl text-gray-400 leading-relaxed">
                                Comprehensive breakdown of the proprietary signals used in the United India Velocity platform.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Velocity Main */}
                            <div className="col-span-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-8 rounded-xl border border-blue-500/30">
                                <h3 className="text-2xl font-bold text-blue-100 flex items-center gap-3 mb-4">
                                    <Activity className="text-blue-400" /> Velocity Indicator (Main)
                                </h3>
                                <p className="text-gray-400 mb-6">The primary visualization representing the ecosystem's "speed" ($dx/dt$).</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-black/20 p-3 rounded">
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">Metric</span>
                                        <div className="text-white font-mono">Rate of Updates</div>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded">
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">Fusion</span>
                                        <div className="text-white font-mono">Scalar Sum</div>
                                    </div>
                                </div>
                            </div>

                            {/* Indicator Cards */}
                            {[
                                {
                                    title: "Cohort Spread",
                                    input: "d.spread",
                                    desc: "Measures divergence between Child (5-17) and Senior (17+) biometric updates.",
                                    logic: "Positive: School drives. Negative: Pension cycles.",
                                    color: "border-orange-500/30"
                                },
                                {
                                    title: "Family Migration",
                                    input: "d.migration",
                                    desc: "Tracks simultaneous address updates across linked family identities.",
                                    logic: "High: Mass relocation. Low: Individual labor.",
                                    color: "border-green-500/30"
                                },
                                {
                                    title: "Cointegration (Leash)",
                                    input: "|Bio - Enrol(t-4)|",
                                    desc: "Measures the 'tether' between new enrolments and subsequent updates.",
                                    logic: "Spike: 'Leash Snap' indicating backlog processing.",
                                    color: "border-red-500/30"
                                },
                                {
                                    title: "Hawkes Alpha",
                                    input: "Viral Factor",
                                    desc: "Measures the self-excitation nature of velocity.",
                                    logic: "> 1.0: Super-critical / Viral state.",
                                    color: "border-purple-500/30"
                                },
                                {
                                    title: "Lorentzian KNN",
                                    input: "ML Signal",
                                    desc: "4-dimensional feature space prediction using Lorentzian distance.",
                                    logic: "Predicts acceleration/deceleration inflection points.",
                                    color: "border-cyan-500/30"
                                },
                                {
                                    title: "Benford Filter",
                                    input: "Forensic",
                                    desc: "Checks if update volumes follow Benford's Law of Anomalous Numbers.",
                                    logic: "High MAD: Potential fraud or unnatural manipulation.",
                                    color: "border-yellow-500/30"
                                }
                            ].map((ind, i) => (
                                <div key={i} className={`bg-white/5 p-6 rounded-xl border ${ind.color} hover:bg-white/10 transition group`}>
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition">{ind.title}</h3>
                                    <code className="text-xs bg-black/40 px-2 py-1 rounded text-gray-500 mb-4 inline-block">{ind.input}</code>
                                    <p className="text-gray-400 text-sm mb-4">{ind.desc}</p>
                                    <div className="pt-4 border-t border-white/5">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Interpretation</span>
                                        <p className="text-sm text-gray-300 mt-1">{ind.logic}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>
                )}
            </main>

            <footer className="border-t border-white/10 py-12 mt-12 bg-black/20">
                <div className="max-w-4xl mx-auto px-6 text-center text-gray-500 text-sm">
                    <p>UIDAI Internal Technical Documentation</p>
                    <p className="mt-2">CONFIDENTIAL - For Authorized Personnel Only</p>
                </div>
            </footer>
        </div>
    );
};
