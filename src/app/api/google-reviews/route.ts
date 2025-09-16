import { NextRequest, NextResponse } from 'next/server';

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

interface GoogleReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface GooglePlaceDetails {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

/**
 * Google Reviews Integration Exploration
 * 
 * This endpoint explores the feasibility of integrating Google Reviews
 * using the Google Places API. The implementation demonstrates:
 * 
 * 1. How to fetch reviews from Google Places API
 * 2. Data normalization from Google's format to our schema
 * 3. Limitations and considerations
 * 
 * FINDINGS:
 * - Google Places API provides up to 5 most helpful reviews
 * - Reviews include rating, text, author, and timestamp
 * - Rate limiting: 1000 requests per day (free tier)
 * - Requires place_id for each property
 * - Cannot control which reviews are returned (Google's algorithm)
 * - No ability to approve/reject specific reviews
 * - Limited to recent and most helpful reviews only
 */

async function fetchGoogleReviews(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.result) {
      return {
        place_id: placeId,
        name: data.result.name,
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        reviews: data.result.reviews || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return null;
  }
}

function normalizeGoogleReviews(googlePlace: GooglePlaceDetails) {
  return googlePlace.reviews.map((review, index) => ({
    id: `google_${googlePlace.place_id}_${index}`,
    type: 'guest-to-host',
    status: 'published',
    rating: review.rating * 2, // Convert 1-5 to 1-10 scale
    publicReview: review.text,
    reviewCategory: [
      {
        category: 'overall',
        rating: review.rating * 2
      }
    ],
    submittedAt: new Date(review.time * 1000).toISOString(),
    guestName: review.author_name,
    listingName: googlePlace.name,
    listingId: 0, // Would need mapping to internal property IDs
    channel: 'Google',
    approved: true, // Google reviews are always public
    source: 'google_places',
    googleData: {
      author_url: review.author_url,
      profile_photo_url: review.profile_photo_url,
      language: review.language,
      relative_time_description: review.relative_time_description
    }
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    const demo = searchParams.get('demo') === 'true';
    
    // For demonstration purposes, return mock data if no API key or demo mode
    if (!GOOGLE_PLACES_API_KEY || demo) {
      const mockGoogleData: GooglePlaceDetails = {
        place_id: 'ChIJExample123',
        name: '2B N1 A - 29 Shoreditch Heights',
        rating: 4.6,
        user_ratings_total: 127,
        reviews: [
          {
            author_name: 'John Smith',
            language: 'en',
            profile_photo_url: 'https://lh3.googleusercontent.com/example',
            rating: 5,
            relative_time_description: '2 weeks ago',
            text: 'Excellent location and beautiful apartment. Everything was clean and modern. Highly recommend!',
            time: 1704067200
          },
          {
            author_name: 'Maria Garcia',
            language: 'en',
            profile_photo_url: 'https://lh3.googleusercontent.com/example2',
            rating: 4,
            relative_time_description: '1 month ago',
            text: 'Great stay overall. The apartment was comfortable and well-equipped. Minor issues with parking.',
            time: 1701388800
          }
        ]
      };
      
      const normalizedReviews = normalizeGoogleReviews(mockGoogleData);
      
      return NextResponse.json({
        status: 'success',
        source: 'demo_mode',
        google_place: mockGoogleData,
        normalized_reviews: normalizedReviews,
        integration_notes: {
          feasibility: 'Technically feasible with limitations',
          limitations: [
            'Limited to 5 most helpful reviews',
            'Cannot control which reviews are shown',
            'No approval workflow (all reviews are public)',
            'Rate limited (1000 requests/day free tier)',
            'Requires Google Place ID for each property',
            'Reviews may not represent all guest feedback'
          ],
          recommendations: [
            'Use as supplementary data alongside Hostaway reviews',
            'Consider Google My Business API for more control',
            'Implement caching to respect rate limits',
            'Map internal property IDs to Google Place IDs',
            'Monitor API usage and implement fallbacks'
          ]
        }
      });
    }
    
    if (!placeId) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Place ID is required. Get place ID from Google Places Search API first.' 
        },
        { status: 400 }
      );
    }
    
    const googlePlace = await fetchGoogleReviews(placeId);
    
    if (!googlePlace) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch Google reviews' },
        { status: 404 }
      );
    }
    
    const normalizedReviews = normalizeGoogleReviews(googlePlace);
    
    return NextResponse.json({
      status: 'success',
      google_place: googlePlace,
      normalized_reviews: normalizedReviews
    });
    
  } catch (error) {
    console.error('Error in Google Reviews API:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example usage endpoint for finding Google Place ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, name } = body;
    
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'Google Places API not configured' },
        { status: 503 }
      );
    }
    
    // Search for place to get place_id
    const searchQuery = encodeURIComponent(`${name} ${address}`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${searchQuery}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.candidates.length > 0) {
      return NextResponse.json({
        status: 'success',
        candidates: data.candidates
      });
    }
    
    return NextResponse.json(
      { status: 'error', message: 'No places found matching the query' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error searching for place:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to search for place' },
      { status: 500 }
    );
  }
}
