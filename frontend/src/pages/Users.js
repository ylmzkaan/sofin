import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  Eye,
  Users as UsersIcon,
  Star,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('analyses'); // analyses, views, success_rate
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [filterBy, setFilterBy] = useState('all'); // all, verified, unverified

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortedUsers = () => {
    let filteredUsers = users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === 'verified') return user.is_verified && matchesSearch;
      if (filterBy === 'unverified') return !user.is_verified && matchesSearch;
      return matchesSearch;
    });

    return filteredUsers.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'analyses':
          aValue = a.total_analyses || 0;
          bValue = b.total_analyses || 0;
          break;
        case 'views':
          aValue = a.total_views || 0;
          bValue = b.total_views || 0;
          break;
        case 'success_rate':
          aValue = a.success_rate || 0;
          bValue = b.success_rate || 0;
          break;
        default:
          aValue = a.total_analyses || 0;
          bValue = b.total_analyses || 0;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
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

  const sortedUsers = getSortedUsers();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysts</h1>
        <p className="text-gray-600">
          Discover talented analysts and subscribe to their premium content
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search analysts by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="input"
          >
            <option value="all">All Analysts</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedUsers.map((analyst) => (
          <div key={analyst.id} className="card hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={analyst.profile_image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%23ccc'/%3E%3Cpath d='M20 85c0-16.6 13.4-30 30-30s30 13.4 30 30' fill='%23ccc'/%3E%3C/svg%3E"}
                  alt={analyst.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{analyst.username}</h3>
                    {analyst.is_verified && (
                      <Star className="h-4 w-4 text-blue-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {analyst.full_name || 'No name provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bio */}
            {analyst.bio && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {analyst.bio}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-primary-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-semibold">{analyst.total_analyses || 0}</span>
                </div>
                <p className="text-xs text-gray-500">Analyses</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-success-600">
                  <Eye className="h-4 w-4" />
                  <span className="font-semibold">{analyst.total_views || 0}</span>
                </div>
                <p className="text-xs text-gray-500">Views</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-warning-600">
                  <UsersIcon className="h-4 w-4" />
                  <span className="font-semibold">{analyst.subscribers_count || 0}</span>
                </div>
                <p className="text-xs text-gray-500">Subscribers</p>
              </div>
            </div>

            {/* Success Rate */}
            {analyst.success_rate && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Success Rate</span>
                  <span className="text-lg font-bold text-success-600">
                    {analyst.success_rate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-success-600 h-2 rounded-full"
                    style={{ width: `${analyst.success_rate}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Monthly Fee */}
            {analyst.monthly_fee > 0 && (
              <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Monthly Subscription</p>
                  <p className="text-2xl font-bold text-primary-600">
                    ${analyst.monthly_fee}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Link
                to={`/users/${analyst.id}`}
                className="btn btn-secondary flex-1 text-center"
              >
                View Profile
              </Link>
              {user && user.id !== analyst.id && analyst.monthly_fee > 0 && (
                <Link
                  to={`/users/${analyst.id}`}
                  className="btn btn-primary flex-1 text-center"
                >
                  Subscribe
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedUsers.length === 0 && (
        <div className="text-center py-12">
                        <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analysts found</h3>
          <p className="text-gray-500">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'No analysts have joined the platform yet.'
            }
          </p>
        </div>
      )}

      {/* Results Count */}
      {sortedUsers.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {sortedUsers.length} of {users.length} analysts
        </div>
      )}
    </div>
  );
};

export default Users; 