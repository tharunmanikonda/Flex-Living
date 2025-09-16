import { NextRequest, NextResponse } from 'next/server';
import { Review, ReviewStats, PropertyStats } from '@/types/review';
import mockReviews from '@/data/mock-reviews.json';

// Mock Hostaway API credentials from the assessment
// const HOSTAWAY_ACCOUNT_ID = '61148';
// const HOSTAWAY_API_KEY = 'f94377ebbbb479490bb3ec364649168dc443dda2e4830facaf5de2e74ccc9152';

// In a real implementation, this would call the actual Hostaway API
async function fetchHostawayReviews(): Promise<Review[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For this assessment, we're using mock data since the sandbox has no reviews
  // In production, this would be:
  // const response = await fetch(`https://api.hostaway.com/v1/reviews?accountId=${HOSTAWAY_ACCOUNT_ID}`, {
  //   headers: { 'Authorization': `Bearer ${HOSTAWAY_API_KEY}` }
  // });
  
  return mockReviews as Review[];
}

function calculateReviewStats(reviews: Review[]): ReviewStats {
  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews || 0;
  const approvedReviews = reviews.filter(r => r.approved).length;
  const pendingReviews = totalReviews - approvedReviews;
  
  // Calculate channel distribution
  const channelDistribution: Record<string, number> = {};
  reviews.forEach(review => {
    channelDistribution[review.channel] = (channelDistribution[review.channel] || 0) + 1;
  });
  
  // Calculate category averages
  const categoryAverages: Record<string, number> = {};
  const categoryTotals: Record<string, { sum: number; count: number }> = {};
  
  reviews.forEach(review => {
    review.reviewCategory.forEach(cat => {
      if (!categoryTotals[cat.category]) {
        categoryTotals[cat.category] = { sum: 0, count: 0 };
      }
      categoryTotals[cat.category].sum += cat.rating;
      categoryTotals[cat.category].count += 1;
    });
  });
  
  Object.keys(categoryTotals).forEach(category => {
    categoryAverages[category] = categoryTotals[category].sum / categoryTotals[category].count;
  });
  
  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    approvedReviews,
    pendingReviews,
    channelDistribution,
    categoryAverages
  };
}

function calculatePropertyStats(reviews: Review[]): PropertyStats[] {
  const propertyMap: Record<number, Review[]> = {};
  
  // Group reviews by property
  reviews.forEach(review => {
    if (!propertyMap[review.listingId]) {
      propertyMap[review.listingId] = [];
    }
    propertyMap[review.listingId].push(review);
  });
  
  // Calculate stats for each property
  return Object.entries(propertyMap).map(([listingId, propertyReviews]) => {
    const totalReviews = propertyReviews.length;
    const averageRating = propertyReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const approvedReviews = propertyReviews.filter(r => r.approved).length;
    const pendingReviews = totalReviews - approvedReviews;
    const recentReviews = propertyReviews
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3);
    
    return {
      listingId: parseInt(listingId),
      listingName: propertyReviews[0].listingName,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      approvedReviews,
      pendingReviews,
      recentReviews
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const propertyId = searchParams.get('propertyId');
    const channel = searchParams.get('channel');
    const approved = searchParams.get('approved');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    
    // Fetch reviews from Hostaway API (mocked)
    let reviews = await fetchHostawayReviews();
    
    // Apply filters
    if (propertyId) {
      reviews = reviews.filter(r => r.listingId === parseInt(propertyId));
    }
    
    if (channel) {
      reviews = reviews.filter(r => r.channel.toLowerCase() === channel.toLowerCase());
    }
    
    if (approved !== null && approved !== undefined) {
      const isApproved = approved === 'true';
      reviews = reviews.filter(r => r.approved === isApproved);
    }
    
    if (minRating) {
      reviews = reviews.filter(r => r.rating >= parseInt(minRating));
    }
    
    if (maxRating) {
      reviews = reviews.filter(r => r.rating <= parseInt(maxRating));
    }
    
    // Sort by submission date (newest first)
    reviews.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
    const response: {
      status: string;
      result: Review[];
      stats?: ReviewStats;
      propertyStats?: PropertyStats[];
    } = {
      status: 'success',
      result: reviews
    };
    
    if (includeStats) {
      response.stats = calculateReviewStats(reviews);
      response.propertyStats = calculatePropertyStats(reviews);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching Hostaway reviews:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, approved } = body;
    
    if (typeof reviewId !== 'number' || typeof approved !== 'boolean') {
      return NextResponse.json(
        { status: 'error', message: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would update the review in the database
    // For this mock, we'll just return success
    
    return NextResponse.json({
      status: 'success',
      message: `Review ${reviewId} ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Error updating review approval:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to update review approval' },
      { status: 500 }
    );
  }
}
