/**
 * Serper.dev Search API Service
 * Location-aware news fetching using Google Search API
 * 
 * Based on scripts/scrapper.ipynb implementation
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const SERPER_API_KEY = 'e34895fc6c85eb3738dcde0e0440be9c80687c15';
const SERPER_BASE_URL = 'https://google.serper.dev/search';

// Target news sites (from scrapper.ipynb)
const TARGET_SITES = [
    'thehindu.com',
    'indianexpress.com',
    'timesofindia.indiatimes.com',
    'livemint.com',
    'economictimes.indiatimes.com',
    'ndtv.com',
    'hindustantimes.com',
    'news18.com',
    'deccanherald.com',
    'thequint.com'
];

// ============================================================================
// TYPES
// ============================================================================

export interface SerperSearchResult {
    title: string;
    link: string;
    snippet: string;
    date?: string;
    position: number;
}

export interface SerperResponse {
    organic: SerperSearchResult[];
    searchParameters: {
        q: string;
        type: string;
        engine: string;
    };
}

export interface LocationNewsQuery {
    state: string;
    district?: string;
    keywords?: string[];
}

export interface ProcessedNewsArticle {
    id: string;
    title: string;
    url: string;
    snippet: string;
    source: string;
    publishedAt: string;
    state: string;
    district?: string;
    searchKeyword: string;
}

// ============================================================================
// QUERY BUILDING
// ============================================================================

// Base keywords for Aadhaar-related searches
const BASE_KEYWORDS = [
    'Aadhaar enrollment',
    'Aadhaar update',
    'UIDAI',
    'Aadhaar biometric',
    'Aadhaar authentication',
    'Aadhaar seeding',
    'Aadhar policy changes',
    'Aadhar policy implementation'
];

// Event-specific keywords that indicate potential enrollment changes
const EVENT_KEYWORDS = [
    'Aadhaar enrollment camp',
    'Aadhaar center closed',
    'Aadhaar backlog',
    'Aadhaar server down',
    'biometric mismatch',
    'Aadhaar deadline extended'
];

/**
 * Build search query with location context
 */
export function buildLocationQuery(
    baseKeyword: string,
    state: string,
    district?: string
): string {
    const locationParts = [state];
    if (district) {
        locationParts.push(district);
    }

    return `${baseKeyword} ${locationParts.join(' ')}`;
}

/**
 * Build query with site operators for targeted news sources
 */
export function buildSiteQuery(query: string, includeSites: boolean = true): string {
    if (!includeSites || TARGET_SITES.length === 0) {
        return query;
    }

    const siteOperator = TARGET_SITES.map(site => `site:${site}`).join(' OR ');
    return `${query} (${siteOperator})`;
}

/**
 * Generate all search queries for a location
 */
export function generateLocationQueries(
    state: string,
    district?: string,
    includeEvents: boolean = true
): string[] {
    const queries: string[] = [];

    // Base Aadhaar queries with location
    for (const keyword of BASE_KEYWORDS) {
        queries.push(buildLocationQuery(keyword, state, district));
    }

    // Event-specific queries
    if (includeEvents) {
        for (const keyword of EVENT_KEYWORDS) {
            queries.push(buildLocationQuery(keyword, state, district));
        }
    }

    return queries;
}

/**
 * Search using Serper.dev API
 * Makes direct API calls - Serper supports CORS
 */
export async function searchSerper(
    query: string,
    numResults: number = 10,
    useSiteFilter: boolean = true
): Promise<SerperSearchResult[]> {
    const finalQuery = useSiteFilter ? buildSiteQuery(query) : query;

    console.log('[Serper] Searching:', finalQuery);

    const payload = {
        q: finalQuery,
        num: numResults,
        gl: 'in',  // Geolocation: India
        hl: 'en'   // Language: English
    };

    try {
        // Direct API call - Serper supports CORS
        const response = await fetch(SERPER_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': SERPER_API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Serper] API error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data: SerperResponse = await response.json();

        console.log('[Serper] Found', data.organic?.length || 0, 'results');
        return data.organic || [];

    } catch (error) {
        console.error('[Serper] Search failed:', error);
        return [];
    }
}

/**
 * Extract source domain from URL
 */
function extractSource(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'Unknown';
    }
}

/**
 * Generate unique ID for article
 */
function generateArticleId(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetch news for a specific state and district
 * This is the main function to call when location changes
 */
export async function fetchLocationNews(
    state: string,
    district?: string,
    options: {
        maxResultsPerQuery?: number;
        maxTotalResults?: number;
        includeEvents?: boolean;
        useSiteFilter?: boolean;
    } = {}
): Promise<ProcessedNewsArticle[]> {
    const {
        maxResultsPerQuery = 5,
        maxTotalResults = 20,
        includeEvents = true,
        useSiteFilter = true
    } = options;

    console.log(`[Serper] Fetching news for: ${state}${district ? ` > ${district}` : ''}`);

    // Generate queries for this location
    const queries = generateLocationQueries(state, district, includeEvents);

    // Limit queries to avoid rate limiting
    const limitedQueries = queries.slice(0, 4);

    const allResults: ProcessedNewsArticle[] = [];
    const seenUrls = new Set<string>();

    // Execute queries sequentially to respect rate limits
    for (const query of limitedQueries) {
        if (allResults.length >= maxTotalResults) break;

        const results = await searchSerper(query, maxResultsPerQuery, useSiteFilter);

        for (const result of results) {
            // Deduplicate by URL
            if (seenUrls.has(result.link)) continue;
            seenUrls.add(result.link);

            // Process and add article
            const article: ProcessedNewsArticle = {
                id: generateArticleId(result.link),
                title: result.title,
                url: result.link,
                snippet: result.snippet,
                source: extractSource(result.link),
                publishedAt: result.date || new Date().toISOString(),
                state,
                district,
                searchKeyword: query.split(' ').slice(0, 2).join(' ')
            };

            allResults.push(article);

            if (allResults.length >= maxTotalResults) break;
        }

        // Small delay between queries
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`[Serper] Total articles fetched: ${allResults.length}`);
    return allResults;
}

/**
 * Fetch news with custom keywords (for advanced use)
 */
export async function fetchCustomKeywordNews(
    keywords: string[],
    state: string,
    district?: string
): Promise<ProcessedNewsArticle[]> {
    const allResults: ProcessedNewsArticle[] = [];
    const seenUrls = new Set<string>();

    for (const keyword of keywords.slice(0, 3)) {
        const query = buildLocationQuery(keyword, state, district);
        const results = await searchSerper(query, 5);

        for (const result of results) {
            if (seenUrls.has(result.link)) continue;
            seenUrls.add(result.link);

            allResults.push({
                id: generateArticleId(result.link),
                title: result.title,
                url: result.link,
                snippet: result.snippet,
                source: extractSource(result.link),
                publishedAt: result.date || new Date().toISOString(),
                state,
                district,
                searchKeyword: keyword
            });
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return allResults;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    SERPER_API_KEY,
    SERPER_BASE_URL,
    TARGET_SITES,
    BASE_KEYWORDS,
    EVENT_KEYWORDS
};
