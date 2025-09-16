'use client';

import { useState, useEffect, useCallback } from 'react';
import { Review, ReviewStats, PropertyStats } from '@/types/review';

interface ApiResponse {
  status: string;
  result: Review[];
  stats?: ReviewStats;
  propertyStats?: PropertyStats[];
}

export default function Dashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [, setPropertyStats] = useState<PropertyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedApproval, setSelectedApproval] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        includeStats: 'true',
        ...(selectedProperty && { propertyId: selectedProperty }),
        ...(selectedChannel && { channel: selectedChannel }),
        ...(selectedApproval && { approved: selectedApproval }),
        ...(selectedRating && { minRating: selectedRating }),
      });

      const response = await fetch(`/api/reviews/hostaway?${params}`);
      const data: ApiResponse = await response.json();

      if (data.status === 'success') {
        let filteredReviews = data.result;

        // Apply search filter
        if (searchTerm) {
          filteredReviews = filteredReviews.filter(review =>
            review.publicReview.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.listingName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setReviews(filteredReviews);
        setStats(data.stats || null);
        setPropertyStats(data.propertyStats || []);
      } else {
        setError('Failed to fetch reviews');
      }
    } catch (err) {
      setError('Error fetching reviews');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProperty, selectedChannel, selectedApproval, selectedRating, searchTerm]);

  const handleApprovalToggle = async (reviewId: number, currentApproval: boolean) => {
    try {
      const response = await fetch('/api/reviews/hostaway', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          approved: !currentApproval,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        // Update local state
        setReviews(prev =>
          prev.map(review =>
            review.id === reviewId
              ? { ...review, approved: !currentApproval }
              : review
          )
        );
        // Refresh stats
        fetchReviews();
      }
    } catch (err) {
      console.error('Error updating approval:', err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedProperty, selectedChannel, selectedApproval, selectedRating, fetchReviews]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchReviews();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, fetchReviews]);

  if (loading && !reviews.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
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

  const uniqueProperties = Array.from(new Set(reviews.map(r => r.listingId))).map(id => {
    const review = reviews.find(r => r.listingId === id);
    return { id, name: review?.listingName || '' };
  });

  const uniqueChannels = Array.from(new Set(reviews.map(r => r.channel)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Reviews Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage guest reviews and monitor property performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Reviews</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Rating</h3>
              <p className="text-3xl font-bold text-green-600">{stats.averageRating}/10</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Approved</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.approvedReviews}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingReviews}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Properties</option>
                {uniqueProperties.map((property) => (
                  <option key={property.id} value={property.id.toString()}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Channels</option>
                {uniqueChannels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
              <select
                value={selectedApproval}
                onChange={(e) => setSelectedApproval(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Reviews</option>
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Rating</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <option key={rating} value={rating.toString()}>
                    {rating}+ Stars
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reviews..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Reviews ({reviews.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest & Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{review.guestName}</div>
                        <div className="text-sm text-gray-500">{review.listingName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {review.publicReview}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">{review.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {review.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(review.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApprovalToggle(review.id, review.approved)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          review.approved
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {review.approved ? 'Approved' : 'Pending'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reviews.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No reviews found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
