/**
 * News Classification & Processing Service
 * Uses Serper.dev API for search, provides classification and categorization
 * 
 * Query Streams:
 * Q1: Aadhaar policy & UIDAI
 * Q2: Biometric / enrollment technology
 * Q3: National elections
 * Q4: State / district elections
 * Q5: Enrollment trend factors
 */

import {
    fetchLocationNews,
    fetchCustomKeywordNews,
    type ProcessedNewsArticle
} from './serperService';

// ============================================================================
// QUERY STREAM DEFINITIONS
// ============================================================================

export const QueryStream = {
    AADHAAR_POLICY: 'Q1',           // Aadhaar policy & UIDAI
    BIOMETRIC_TECH: 'Q2',           // Biometric / enrollment technology
    NATIONAL_ELECTIONS: 'Q3',       // National elections
    STATE_ELECTIONS: 'Q4',          // State / district elections
    ENROLLMENT_TRENDS: 'Q5',        // Enrollment trend factors
} as const;

export type QueryStreamType = typeof QueryStream[keyof typeof QueryStream];

// Stream-specific keywords for targeted searches
export const STREAM_KEYWORDS: Record<QueryStreamType, string[]> = {
    [QueryStream.AADHAAR_POLICY]: [
        'Aadhaar policy',
        'UIDAI circular',
        'Aadhaar court ruling',
        'Aadhaar mandate'
    ],
    [QueryStream.BIOMETRIC_TECH]: [
        'Aadhaar biometric',
        'fingerprint scanner UIDAI',
        'iris authentication Aadhaar',
        'biometric device enrollment'
    ],
    [QueryStream.NATIONAL_ELECTIONS]: [
        'Lok Sabha election',
        'Election Commission India',
        'national election'
    ],
    [QueryStream.STATE_ELECTIONS]: [
        'Assembly election',
        'state election',
        'MLA election'
    ],
    [QueryStream.ENROLLMENT_TRENDS]: [
        'Aadhaar enrollment backlog',
        'Aadhaar update delay',
        'enrollment center closed',
        'Aadhaar server down'
    ]
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface ClassifiedArticle extends ProcessedNewsArticle {
    stream: QueryStreamType;
    classification: 'Policy' | 'Tech' | 'Operational' | 'Unknown';
    keywords: string[];
}

export interface DateRange {
    from: string;
    to: string;
}

export interface AllStreamsResult {
    streams: Record<QueryStreamType, ClassifiedArticle[]>;
    allArticles: ClassifiedArticle[];
    fetchedAt: string;
    stats: {
        total: number;
        byStream: Record<QueryStreamType, number>;
        byClassification: Record<string, number>;
    };
}

// ============================================================================
// CLASSIFICATION FUNCTIONS
// ============================================================================

const POLICY_KEYWORDS = [
    'policy', 'circular', 'notification', 'court', 'supreme court', 'high court',
    'government', 'ministry', 'law', 'regulation', 'mandate', 'deadline', 'amendment',
    'directive', 'order', 'gazette', 'legislation'
];

const TECH_KEYWORDS = [
    'biometric', 'fingerprint', 'iris', 'scanner', 'device', 'AI', 'artificial intelligence',
    'machine learning', 'liveness', 'detection', 'software', 'upgrade', 'technology',
    'deduplication', 'encryption', 'authentication', 'digital'
];

const OPERATIONAL_KEYWORDS = [
    'enrollment', 'update', 'centre', 'center', 'camp', 'queue', 'delay', 'backlog',
    'suspension', 'shortage', 'operator', 'staff', 'training', 'complaint', 'grievance'
];

/**
 * Classify an article based on content keywords
 */
export function classifyArticle(article: ProcessedNewsArticle): 'Policy' | 'Tech' | 'Operational' | 'Unknown' {
    const text = `${article.title} ${article.snippet || ''}`.toLowerCase();

    const policyScore = POLICY_KEYWORDS.filter(kw => text.includes(kw)).length;
    const techScore = TECH_KEYWORDS.filter(kw => text.includes(kw)).length;
    const operationalScore = OPERATIONAL_KEYWORDS.filter(kw => text.includes(kw)).length;

    if (policyScore >= techScore && policyScore >= operationalScore && policyScore > 0) {
        return 'Policy';
    }
    if (techScore >= operationalScore && techScore > 0) {
        return 'Tech';
    }
    if (operationalScore > 0) {
        return 'Operational';
    }

    return 'Unknown';
}

/**
 * Extract keywords from article content
 */
export function extractKeywords(article: ProcessedNewsArticle): string[] {
    const text = `${article.title} ${article.snippet || ''}`.toLowerCase();
    const allKeywords = [...POLICY_KEYWORDS, ...TECH_KEYWORDS, ...OPERATIONAL_KEYWORDS];

    return allKeywords.filter(kw => text.includes(kw));
}

/**
 * Determine which stream an article belongs to
 */
export function determineStream(article: ProcessedNewsArticle): QueryStreamType {
    const text = `${article.title} ${article.snippet || ''} ${article.searchKeyword}`.toLowerCase();

    // Check for election-related content
    if (text.includes('election') || text.includes('lok sabha') || text.includes('assembly')) {
        if (text.includes('state') || text.includes('assembly') || text.includes('mla')) {
            return QueryStream.STATE_ELECTIONS;
        }
        return QueryStream.NATIONAL_ELECTIONS;
    }

    // Check for biometric/tech content
    if (text.includes('biometric') || text.includes('fingerprint') || text.includes('iris') ||
        text.includes('scanner') || text.includes('device')) {
        return QueryStream.BIOMETRIC_TECH;
    }

    // Check for enrollment trends
    if (text.includes('backlog') || text.includes('delay') || text.includes('closed') ||
        text.includes('server down') || text.includes('increase') || text.includes('decline')) {
        return QueryStream.ENROLLMENT_TRENDS;
    }

    // Default to policy
    return QueryStream.AADHAAR_POLICY;
}

/**
 * Process and classify an article
 */
export function processArticle(article: ProcessedNewsArticle): ClassifiedArticle {
    return {
        ...article,
        stream: determineStream(article),
        classification: classifyArticle(article),
        keywords: extractKeywords(article)
    };
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

export function getLastNDaysRange(days: number): DateRange {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    return {
        from: from.toISOString(),
        to: to.toISOString()
    };
}

export function getLast7DaysRange(): DateRange {
    return getLastNDaysRange(7);
}

export function getLast24HoursRange(): DateRange {
    const to = new Date();
    const from = new Date();
    from.setHours(from.getHours() - 24);

    return {
        from: from.toISOString(),
        to: to.toISOString()
    };
}

// ============================================================================
// MAIN FETCH FUNCTIONS (Using Serper)
// ============================================================================

/**
 * Fetch and classify news for a specific location
 */
export async function fetchLocationNewsClassified(
    state: string,
    district?: string
): Promise<ClassifiedArticle[]> {
    const articles = await fetchLocationNews(state, district);
    return articles.map(processArticle);
}

/**
 * Fetch news for a specific stream with location context
 */
export async function fetchStreamNews(
    stream: QueryStreamType,
    state: string,
    district?: string
): Promise<ClassifiedArticle[]> {
    const keywords = STREAM_KEYWORDS[stream];
    const articles = await fetchCustomKeywordNews(keywords, state, district);

    return articles.map(article => ({
        ...processArticle(article),
        stream // Override with requested stream
    }));
}

/**
 * Fetch all streams for a location
 */
export async function fetchAllStreams(
    state: string,
    district?: string
): Promise<AllStreamsResult> {
    console.log(`[GNews] Fetching all streams for: ${state}${district ? ` > ${district}` : ''}`);

    const streams: Record<QueryStreamType, ClassifiedArticle[]> = {
        [QueryStream.AADHAAR_POLICY]: [],
        [QueryStream.BIOMETRIC_TECH]: [],
        [QueryStream.NATIONAL_ELECTIONS]: [],
        [QueryStream.STATE_ELECTIONS]: [],
        [QueryStream.ENROLLMENT_TRENDS]: []
    };

    // Fetch general location news and classify
    const allArticles = await fetchLocationNewsClassified(state, district);

    // Distribute articles to streams
    for (const article of allArticles) {
        streams[article.stream].push(article);
    }

    // Calculate stats
    const byClassification: Record<string, number> = {
        'Policy': 0,
        'Tech': 0,
        'Operational': 0,
        'Unknown': 0
    };

    for (const article of allArticles) {
        byClassification[article.classification]++;
    }

    return {
        streams,
        allArticles,
        fetchedAt: new Date().toISOString(),
        stats: {
            total: allArticles.length,
            byStream: {
                [QueryStream.AADHAAR_POLICY]: streams[QueryStream.AADHAAR_POLICY].length,
                [QueryStream.BIOMETRIC_TECH]: streams[QueryStream.BIOMETRIC_TECH].length,
                [QueryStream.NATIONAL_ELECTIONS]: streams[QueryStream.NATIONAL_ELECTIONS].length,
                [QueryStream.STATE_ELECTIONS]: streams[QueryStream.STATE_ELECTIONS].length,
                [QueryStream.ENROLLMENT_TRENDS]: streams[QueryStream.ENROLLMENT_TRENDS].length
            },
            byClassification
        }
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    POLICY_KEYWORDS,
    TECH_KEYWORDS,
    OPERATIONAL_KEYWORDS
};
