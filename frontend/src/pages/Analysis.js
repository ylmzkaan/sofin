import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analysesAPI, subscriptionsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, 
  Clock, 
  Eye, 
  User, 
  Calendar, 
  Tag, 
  Lock, 
  DollarSign,
  Share2,
  Bookmark,
  MessageCircle
} from 'lucide-react';

const Analysis = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await analysesAPI.getAnalysis(id);
        setAnalysis(response.data);
        
        // Check if user has access to this analysis
        if (user && response.data.author.id !== user.id) {
          const subscriptionResponse = await subscriptionsAPI.checkSubscription(response.data.author.id);
          setHasAccess(subscriptionResponse.data.is_subscribed);
          setIsSubscribed(subscriptionResponse.data.is_subscribed);
          setSubscriptionPrice(subscriptionResponse.data.monthly_price);
        } else if (user && response.data.author.id === user.id) {
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
        toast.error('Failed to load analysis.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, user]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please log in to subscribe.');
      return;
    }

    try {
      const response = await subscriptionsAPI.createSubscription({
        creator_id: analysis.author.id,
        monthly_price: subscriptionPrice
      });
      
      if (response.data.stripe_checkout_url) {
        window.location.href = response.data.stripe_checkout_url;
      } else {
        setIsSubscribed(true);
        setHasAccess(true);
        toast.success('Subscription successful!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to subscribe.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analysis not found</h2>
        <p className="text-gray-600 mb-6">The analysis you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link to="/users" className="hover:text-gray-700">Analysts</Link>
          <span>/</span>
          <Link to={`/users/${analysis.author.id}`} className="hover:text-gray-700">
            {analysis.author.username}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Analysis</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4 break-words overflow-wrap-anywhere">{analysis.title}</h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/users/${analysis.author.id}`}
              className="flex items-center space-x-3 hover:opacity-80"
            >
              <img
                src={analysis.author.profile_image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%23ccc'/%3E%3Cpath d='M20 85c0-16.6 13.4-30 30-30s30 13.4 30 30' fill='%23ccc'/%3E%3C/svg%3E"}
                alt={analysis.author.username}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{analysis.author.username}</p>
                <p className="text-sm text-gray-500">
                  {new Date(analysis.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bookmark className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Stats */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Target Price</p>
              <p className="text-lg font-semibold text-gray-900">${analysis.target_price}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-warning-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Time Horizon</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.time_horizon}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Eye className="h-6 w-6 text-success-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Views</p>
              <p className="text-lg font-semibold text-gray-900">{analysis.views || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-info-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(analysis.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Access Check */}
      {!hasAccess && (
        <div className="card mb-8 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="text-center py-8">
            <Lock className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Subscribe to Access Full Analysis
            </h3>
            <p className="text-gray-600 mb-6">
              This analysis is only available to subscribers of {analysis.author.username}.
              Subscribe to get access to detailed insights, target prices, and exclusive content.
            </p>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">${subscriptionPrice}</p>
                <p className="text-sm text-gray-500">per month</p>
              </div>
            </div>
            <button
              onClick={handleSubscribe}
              className="btn btn-primary inline-flex items-center"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Subscribe Now
            </button>
          </div>
        </div>
      )}

      {/* Analysis Content */}
      {hasAccess && (
        <>
          {/* Content */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap break-words overflow-wrap-anywhere">{analysis.content}</p>
            </div>
          </div>

          {/* Images */}
          {analysis.images && analysis.images.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Charts & Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.images.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={`${process.env.REACT_APP_API_URL}/uploads/${image.filename}`}
                      alt={`Analysis ${index + 1}`}
                      className="w-full rounded-lg shadow-sm"
                    />
                    {image.caption && (
                      <p className="text-sm text-gray-500 text-center">{image.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {analysis.tags && analysis.tags.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Author Info */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">About the Analyst</h2>
        <div className="flex items-start space-x-4">
          <img
            src={analysis.author.profile_image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%23ccc'/%3E%3Cpath d='M20 85c0-16.6 13.4-30 30-30s30 13.4 30 30' fill='%23ccc'/%3E%3C/svg%3E"}
            alt={analysis.author.username}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {analysis.author.username}
            </h3>
            <p className="text-gray-600 mb-3">
              {analysis.author.bio || 'No bio available.'}
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{analysis.author.total_analyses || 0} analyses</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{analysis.author.total_views || 0} total views</span>
              </div>
              {analysis.author.success_rate && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{analysis.author.success_rate}% success rate</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link
                to={`/users/${analysis.author.id}`}
                className="btn btn-secondary inline-flex items-center"
              >
                <User className="h-4 w-4 mr-2" />
                View Full Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis; 