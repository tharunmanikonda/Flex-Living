'use client';

import { useState, useEffect } from 'react';
import { Review } from '@/types/review';

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ApiResponse {
  status: string;
  result: Review[];
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [property, setProperty] = useState<{ name: string; id: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const resolveParamsAndFetch = async () => {
      try {
        const resolvedParamsValue = await params;
        setResolvedParams(resolvedParamsValue);
        
        setLoading(true);
        const response = await fetch(`/api/reviews/hostaway?propertyId=${resolvedParamsValue.id}&approved=true`);
        const data: ApiResponse = await response.json();
        
        if (data.status === 'success') {
          setReviews(data.result);
          if (data.result.length > 0) {
            setProperty({
              name: data.result[0].listingName,
              id: data.result[0].listingId
            });
          }
        } else {
          setError('Failed to fetch reviews');
        }
      } catch (err) {
        setError('Error fetching reviews');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    resolveParamsAndFetch();
  }, [params]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  const calculateCategoryAverages = () => {
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
    
    return Object.entries(categoryTotals).map(([category, data]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
      average: Math.round((data.sum / data.count) * 10) / 10
    }));
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor"/>
              <stop offset="50%" stopColor="transparent"/>
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating / 2);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();
  const categoryAverages = calculateCategoryAverages();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Mimicking Flex Living Design */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {property?.name || 'Property Details'}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100">
              Luxury accommodation in the heart of London
            </p>
          </div>
        </div>
      </div>

      {/* Property Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Image Placeholder */}
            <div className="bg-gray-200 rounded-lg h-96 mb-8 flex items-center justify-center">
              <p className="text-gray-500 text-lg">Property Image</p>
            </div>

            {/* Property Description */}
            <div className="prose max-w-none mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Property</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Experience luxury living in this beautifully designed apartment. Located in one of London&apos;s 
                most vibrant neighborhoods, this property offers modern amenities, stunning views, and 
                unparalleled comfort for your stay.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Whether you&apos;re visiting for business or pleasure, our space provides everything you need 
                for a memorable London experience. From high-speed WiFi to a fully equipped kitchen, 
                every detail has been carefully considered.
              </p>
            </div>

            {/* Amenities */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Free WiFi', 'Kitchen', 'Washing Machine', 'Air Conditioning',
                  'Heating', 'Workspace', 'TV', 'Coffee Machine'
                ].map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Booking Card Placeholder */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Book Your Stay</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check-in</label>
                  <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check-out</label>
                  <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guests</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option>1 guest</option>
                    <option>2 guests</option>
                    <option>3 guests</option>
                    <option>4 guests</option>
                  </select>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  Check Availability
                </button>
              </div>
            </div>

            {/* Rating Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rating Summary</h3>
              <div className="flex items-center mb-4">
                <span className="text-3xl font-bold text-gray-900 mr-2">
                  {averageRating.toFixed(1)}
                </span>
                <div className="flex">
                  {renderStars(averageRating)}
                </div>
                <span className="text-gray-500 ml-2">({reviews.length} reviews)</span>
              </div>
              
              {categoryAverages.length > 0 && (
                <div className="space-y-3">
                  {categoryAverages.map((category, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-700">{category.category}</span>
                      <span className="font-semibold">{category.average}/10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Guest Reviews</h2>
            <p className="text-lg text-gray-600">
              See what our guests have to say about their experience
            </p>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {review.rating}/10
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    &ldquo;{review.publicReview}&rdquo;
                  </p>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{review.guestName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {review.channel}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No approved reviews yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Flex Living</h3>
            <p className="text-gray-400 mb-8">
              Premium short-term accommodation in London&apos;s finest locations
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
              <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
