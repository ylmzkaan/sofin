import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, analysesAPI, subscriptionsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  Eye,
  Users,
  Star,
  Calendar,
  DollarSign,
  Lock,
  Unlock,
  Plus,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState(null);
  const [filterBy, setFilterBy] = useState('all'); // all, public, premium
  const [sortBy, setSortBy] = useState('date'); // date, views, target_price
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    fetchProfile();
    fetchAnalyses();
    checkSubscription();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUserById(id);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyses = async () => {
    try {
      setAnalysesLoading(true);
      const response = await analysesAPI.getAnalysesByUser(id);
      setAnalyses(response.data);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('Failed to load analyses.');
    } finally {
      setAnalysesLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!user || user.id === parseInt(id)) return;
    
    try {
      const response = await subscriptionsAPI.checkSubscription(id);
      setIsSubscribed(response.data.is_subscribed);
      setSubscriptionPrice(response.data.monthly_price);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please log in to subscribe.');
      return;
    }

    try {
      const response = await subscriptionsAPI.createSubscription({
        creator_id: parseInt(id),
        monthly_price: subscriptionPrice
      });

      if (response.data.stripe_checkout_url) {
        window.location.href = response.data.stripe_checkout_url;
      } else {
        setIsSubscribed(true);
        toast.success('Subscription successful!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to subscribe.');
    }
  };

  const getSortedAnalyses = () => {
    let filteredAnalyses = analyses.filter(analysis => {
      if (filterBy === 'public') return true; // All analyses are visible
      if (filterBy === 'premium') return isSubscribed || user?.id === parseInt(id);
      return true;
    });

    return filteredAnalyses.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'views':
          aValue = a.views || 0;
          bValue = b.views || 0;
          break;
        case 'target_price':
          aValue = a.target_price;
          bValue = b.target_price;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Profile not found</h2>
        <p className="text-gray-600 mb-6">The analyst you're looking for doesn't exist.</p>
        <Link to="/users" className="btn btn-primary">
          Back to Analysts
        </Link>
      </div>
    );
  }

  const sortedAnalyses = getSortedAnalyses();
  const isOwnProfile = user && user.id === parseInt(id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link to="/users" className="hover:text-gray-700">Analysts</Link>
        <span>/</span>
        <span className="text-gray-900">{profile.username}</span>
      </div>

      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-6">
            <img
              src={profile.profile_image || '/default-avatar.png'}
              alt={profile.username}
              className="h-24 w-24 rounded-full"
            />
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
                {profile.is_verified && (
                  <Star className="h-6 w-6 text-blue-500 fill-current" />
                )}
              </div>
              <p className="text-lg text-gray-600 mb-2">
                {profile.full_name || 'No name provided'}
              </p>
              {profile.bio && (
                <p className="text-gray-700 max-w-md">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-primary-600 mb-1">
                <TrendingUp className="h-5 w-5" />
                <span className="text-2xl font-bold">{profile.total_analyses || 0}</span>
              </div>
              <p className="text-sm text-gray-500">Analyses</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-success-600 mb-1">
                <Eye className="h-5 w-5" />
                <span className="text-2xl font-bold">{profile.total_views || 0}</span>
              </div>
              <p className="text-sm text-gray-500">Total Views</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-warning-600 mb-1">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-bold">{profile.subscribers_count || 0}</span>
              </div>
              <p className="text-sm text-gray-500">Subscribers</p>
            </div>
            {profile.success_rate && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-success-600 mb-1">
                  <Star className="h-5 w-5" />
                  <span className="text-2xl font-bold">{profile.success_rate}%</span>
                </div>
                <p className="text-sm text-gray-500">Success Rate</p>
              </div>
            )}
          </div>
        </div>

        {/* Success Rate Bar */}
        {profile.success_rate && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
              <span className="text-sm text-gray-500">{profile.success_rate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-success-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${profile.success_rate}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Section */}
      {!isOwnProfile && profile.monthly_fee > 0 && (
        <div className="card mb-8 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="text-center lg:text-left mb-4 lg:mb-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isSubscribed ? 'You are subscribed!' : 'Subscribe to Access Premium Content'}
              </h3>
              <p className="text-gray-600">
                {isSubscribed 
                  ? 'You have access to all analyses and premium content.'
                  : 'Get access to detailed analyses, target prices, and exclusive insights.'
                }
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <span className="text-3xl font-bold text-primary-600">${profile.monthly_fee}</span>
                <span className="text-gray-600">/month</span>
              </div>
              {!isSubscribed && (
                <button
                  onClick={handleSubscribe}
                  className="btn btn-primary inline-flex items-center"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Subscribe Now
                </button>
              )}
              {isSubscribed && (
                <div className="flex items-center text-success-600">
                  <Unlock className="h-5 w-5 mr-2" />
                  <span className="font-medium">Subscribed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analyses Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyses</h2>
            <p className="text-gray-600">
              {isSubscribed || isOwnProfile 
                ? 'All analyses and insights'
                : 'Public analyses only - subscribe for premium content'
              }
            </p>
          </div>
          {isOwnProfile && (
            <Link to="/create-analysis" className="btn btn-primary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Analysis
            </Link>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="input"
          >
            <option value="all">All Analyses</option>
            <option value="public">Public Only</option>
            {isSubscribed || isOwnProfile && (
              <option value="premium">Premium Only</option>
            )}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
          >
            <option value="date">Sort by Date</option>
            <option value="views">Sort by Views</option>
            <option value="target_price">Sort by Target Price</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary inline-flex items-center"
          >
            {getSortIcon(sortBy) || <SortDesc className="h-4 w-4" />}
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>

        {/* Analyses List */}
        {analysesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : sortedAnalyses.length > 0 ? (
          <div className="space-y-4">
            {sortedAnalyses.map((analysis) => (
              <div key={analysis.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                  {/* Analysis Image */}
                  {analysis.images && analysis.images.length > 0 && (
                    <img
                      src={`${process.env.REACT_APP_API_URL}/uploads/${analysis.images[0].filename}`}
                      alt="Analysis"
                      className="w-full lg:w-32 h-32 lg:h-24 object-cover rounded-lg"
                    />
                  )}

                  {/* Analysis Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        <Link 
                          to={`/analysis/${analysis.id}`}
                          className="hover:text-primary-600 transition-colors"
                        >
                          {analysis.title}
                        </Link>
                      </h3>
                      {!isSubscribed && !isOwnProfile && (
                        <div className="flex items-center text-warning-600 text-sm">
                          <Lock className="h-4 w-4 mr-1" />
                          Premium
                        </div>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {analysis.content}
                    </p>

                    {/* Analysis Meta */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-primary-600" />
                        <span className="text-gray-700">${analysis.target_price}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-warning-600" />
                        <span className="text-gray-700">{analysis.time_horizon}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-success-600" />
                        <span className="text-gray-700">{analysis.views || 0} views</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {analysis.tags && analysis.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {analysis.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
            <p className="text-gray-500">
              {isOwnProfile 
                ? "You haven't created any analyses yet. Start sharing your insights!"
                : "This analyst hasn't published any analyses yet."
              }
            </p>
            {isOwnProfile && (
              <Link to="/create-analysis" className="btn btn-primary mt-4">
                Create Your First Analysis
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 