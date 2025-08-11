import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analysesAPI, subscriptionsAPI } from '../services/api';
import { Plus, TrendingUp, Users, BarChart3, Clock, Eye, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [myAnalyses, setMyAnalyses] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analysesResponse, subscriptionsResponse] = await Promise.all([
          analysesAPI.getMyAnalyses(),
          subscriptionsAPI.getMySubscriptions(),
        ]);
        setMyAnalyses(analysesResponse.data);
        setMySubscriptions(subscriptionsResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalViews = myAnalyses.reduce((sum, analysis) => sum + (analysis.views || 0), 0);
  const totalAnalyses = myAnalyses.length;
  const totalSubscribers = mySubscriptions.filter(sub => sub.status === 'active').length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.username}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Analyses</p>
              <p className="text-2xl font-semibold text-gray-900">{totalAnalyses}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Eye className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900">{totalViews}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Subscribers</p>
              <p className="text-2xl font-semibold text-gray-900">{totalSubscribers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/create-analysis"
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Analysis
          </Link>
          <Link
            to="/users"
            className="btn btn-secondary inline-flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Browse Analysts
          </Link>
          <Link
            to="/profile"
            className="btn btn-secondary inline-flex items-center"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Analyses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Recent Analyses</h2>
            <Link
              to="/create-analysis"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View All
            </Link>
          </div>
          
          {myAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">You haven't created any analyses yet.</p>
              <Link
                to="/create-analysis"
                className="btn btn-primary"
              >
                Create Your First Analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myAnalyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {analysis.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {analysis.content}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>${analysis.target_price}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{analysis.time_horizon}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{analysis.views || 0} views</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/analysis/${analysis.id}`}
                      className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Subscriptions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Subscriptions</h2>
            <Link
              to="/users"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Find More
            </Link>
          </div>
          
          {mySubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">You're not subscribed to any analysts yet.</p>
              <Link
                to="/users"
                className="btn btn-primary"
              >
                Browse Analysts
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {mySubscriptions.slice(0, 5).map((subscription) => (
                <div key={subscription.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={subscription.creator.avatar_url || '/default-avatar.png'}
                        alt={subscription.creator.username}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {subscription.creator.username}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {subscription.status === 'active' ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <DollarSign className="h-4 w-4" />
                        <span>${subscription.monthly_price}/month</span>
                      </div>
                      <Link
                        to={`/users/${subscription.creator.id}`}
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 