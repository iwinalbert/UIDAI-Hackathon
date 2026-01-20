/**
 * TOON Storage Service
 * Manages event cache with deduplication
 * TOON = Time-Ordered Object Notation
 */

import type { ClassifiedEvent, EventType } from './aiEventClassifier';

export interface TOONEvent {
    id: string;
    timestamp: number;
    date: string;
    type: EventType;
    severity: 'high' | 'medium' | 'low';
    title: string;
    summary: string;
    source: string;
    state: string;
    district: string;
}

const STORAGE_KEY = 'uidai_toon_events';

/**
 * Generates a unique hash for deduplication
 */
function generateEventHash(title: string, date: string): string {
    const str = `${title.toLowerCase().trim()}_${date}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Loads events from localStorage
 */
export function loadTOONEvents(): TOONEvent[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * Saves events to localStorage
 */
function saveTOONEvents(events: TOONEvent[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
        console.error('Failed to save TOON events:', error);
    }
}

/**
 * Adds classified events to TOON storage with deduplication
 */
export function addToTOONStorage(
    classifiedEvents: ClassifiedEvent[],
    state: string,
    district: string
): TOONEvent[] {
    const existing = loadTOONEvents();
    const existingIds = new Set(existing.map(e => e.id));

    const newEvents: TOONEvent[] = [];

    for (const event of classifiedEvents) {
        const hash = generateEventHash(event.title, event.date);

        // Skip if already exists
        if (existingIds.has(hash)) continue;

        const toonEvent: TOONEvent = {
            id: hash,
            timestamp: new Date(event.date).getTime(),
            date: event.date,
            type: event.type,
            severity: event.severity,
            title: event.title,
            summary: event.summary,
            source: event.source,
            state: state,
            district: district
        };

        newEvents.push(toonEvent);
    }

    if (newEvents.length > 0) {
        const combined = [...existing, ...newEvents]
            .sort((a, b) => a.timestamp - b.timestamp);

        saveTOONEvents(combined);
        return combined;
    }

    return existing;
}

/**
 * Gets events for a specific state/district
 */
export function getTOONEventsForLocation(
    state: string,
    district?: string
): TOONEvent[] {
    const all = loadTOONEvents();

    return all.filter(e => {
        if (e.state !== state) return false;
        if (district && e.district !== district) return false;
        return true;
    });
}

/**
 * Clears all stored events
 */
export function clearTOONStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Exports events as JSON for backup
 */
export function exportTOONEvents(): string {
    const events = loadTOONEvents();
    return JSON.stringify(events, null, 2);
}
