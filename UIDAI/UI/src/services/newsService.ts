/**
 * News API Service
 * Location-aware news fetching with classification
 * 
 * Uses Serper.dev API (Google Search) for news discovery
 * Updates dynamically when state/district selection changes
 */

import type {
    ClassifiedArticle,
    AllStreamsResult,
    DateRange
} from './gnewsService';
import {
    fetchAllStreams,
    fetchLocationNewsClassified,
    fetchStreamNews,
    QueryStream,
    getLast7DaysRange,
    getLast24HoursRange,
    classifyArticle,
    extractKeywords
} from './gnewsService';
import type { ProcessedNewsArticle } from './serperService';
import { fetchLocationNews, fetchCustomKeywordNews } from './serperService';

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type { ClassifiedArticle, AllStreamsResult, DateRange, ProcessedNewsArticle };
export {
    QueryStream,
    fetchAllStreams,
    fetchLocationNewsClassified,
    fetchStreamNews,
    getLast7DaysRange,
    getLast24HoursRange,
    fetchLocationNews,
    fetchCustomKeywordNews,
    classifyArticle,
    extractKeywords
};

// ============================================================================
// LEGACY INTERFACES (for backward compatibility)
// ============================================================================

export interface NewsArticle {
    article_id: string;
    title: string;
    link: string;
    description: string | null;
    content: string | null;
    pubDate: string;
    source_id: string;
    source_name: string;
    category: string[];
    country: string[];
    language: string;
}

// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

/**
 * Convert ProcessedNewsArticle to legacy NewsArticle format
 */
export function toNewsArticle(article: ProcessedNewsArticle): NewsArticle {
    return {
        article_id: article.id,
        title: article.title,
        link: article.url,
        description: article.snippet,
        content: null,
        pubDate: article.publishedAt,
        source_id: article.source.replace('.com', '').replace('.', '_'),
        source_name: article.source,
        category: ['news'],
        country: ['in'],
        language: 'en'
    };
}

/**
 * Convert ClassifiedArticle to legacy NewsArticle format
 */
export function classifiedToNewsArticle(article: ClassifiedArticle): NewsArticle {
    return {
        article_id: article.id,
        title: article.title,
        link: article.url,
        description: article.snippet,
        content: null,
        pubDate: article.publishedAt,
        source_id: article.source.replace('.com', '').replace('.', '_'),
        source_name: article.source,
        category: [article.classification.toLowerCase()],
        country: ['in'],
        language: 'en'
    };
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetches Aadhaar-related news for a specific location
 * This is the main function to call when state/district selection changes
 * 
 * @param state - The selected state
 * @param district - Optional district within the state
 * @returns Array of news articles in legacy format
 */
export async function fetchAadhaarNews(
    state?: string,
    district?: string
): Promise<NewsArticle[]> {
    console.log('[NewsService] Fetching news for:', state, district);

    if (!state) {
        console.log('[NewsService] No state provided, returning empty');
        return [];
    }

    try {
        // Use new Serper-based location fetching
        const articles = await fetchLocationNewsClassified(state, district);

        console.log('[NewsService] Found', articles.length, 'articles');

        // Convert to legacy format
        return articles.map(classifiedToNewsArticle);
    } catch (error) {
        console.error('[NewsService] Failed to fetch news:', error);
        return getMockArticles(state, district);
    }
}

/**
 * Fetches news and returns in the new classified format
 */
export async function fetchAadhaarNewsClassified(
    state: string,
    district?: string
): Promise<ClassifiedArticle[]> {
    return fetchLocationNewsClassified(state, district);
}

// ============================================================================
// MOCK DATA (fallback when API fails)
// ============================================================================

function getMockArticles(state?: string, district?: string): NewsArticle[] {
    const today = new Date().toISOString();
    const location = district || state || 'India';

    return [
        {
            article_id: 'mock_1',
            title: `Aadhaar enrollment camp announced in ${location}`,
            link: '',
            description: 'UIDAI announces special enrollment drive for pending registrations.',
            content: null,
            pubDate: today,
            source_id: 'mock',
            source_name: 'Mock News',
            category: ['operational'],
            country: ['in'],
            language: 'en'
        },
        {
            article_id: 'mock_2',
            title: `Aadhaar biometric update deadline extended in ${state || 'India'}`,
            link: '',
            description: 'Government extends deadline for mandatory biometric updates.',
            content: null,
            pubDate: today,
            source_id: 'mock',
            source_name: 'Mock News',
            category: ['policy'],
            country: ['in'],
            language: 'en'
        }
    ];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats a news article for display
 */
export function formatNewsForDisplay(article: NewsArticle): {
    id: string;
    title: string;
    date: string;
    source: string;
    summary: string;
} {
    return {
        id: article.article_id,
        title: article.title,
        date: article.pubDate,
        source: article.source_name,
        summary: article.description || article.content?.substring(0, 200) || ''
    };
}

/**
 * Check if news service is available
 */
export function isNewsServiceAvailable(): boolean {
    return true; // Serper API is always configured
}
