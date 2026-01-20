import type { OHLCData, ChartEvent } from '../types';

export function generateSampleData(numberOfCandles = 1000): { data: OHLCData[], events: ChartEvent[] } {
    const data: OHLCData[] = [];
    const events: ChartEvent[] = [];

    let time = Math.floor(Date.now() / 1000) - numberOfCandles * 60 * 60 * 24;
    let value = 1500;

    for (let i = 0; i < numberOfCandles; i++) {
        const currentUnix = time + i * 86400;
        const open = value + (Math.random() - 0.5) * 10;
        const close = open + (Math.random() - 0.5) * 20;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;

        data.push({
            time: currentUnix as any,
            open,
            high,
            low,
            close,
        });

        // Randomly generate events
        if (Math.random() > 0.98) {
            const isNews = Math.random() > 0.3;
            if (isNews) {
                events.push({
                    id: crypto.randomUUID(),
                    time: currentUnix as any,
                    type: 'news',
                    title: 'Latest updates',
                    description: 'Market News',
                    details: [
                        { headline: 'Company reports strong Q3 growth', source: 'Reuters', dateStr: new Date(currentUnix * 1000).toDateString() },
                        { headline: 'Analyst rating upgrade to BUY', source: 'Bloomberg', dateStr: new Date(currentUnix * 1000).toDateString() }
                    ]
                });
            } else {
                events.push({
                    id: crypto.randomUUID(),
                    time: currentUnix as any,
                    type: 'split',
                    title: 'Split: 2/1',
                    description: 'Stock Split'
                });
            }
        }

        value = close;
    }
    return { data, events };
}
