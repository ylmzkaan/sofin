import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { User, Mail, Camera, Save, Edit, Eye, TrendingUp, Clock } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileStats, setProfileStats] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
    },
  });

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const response = await usersAPI.getMyProfile();
        setProfileStats(response.data);
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      }
    };

    fetchProfileStats();
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await usersAPI.updateMyProfile(data);
      updateUser(response.data);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account settings and profile information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="btn btn-secondary inline-flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      {...register('username', {
                        required: 'Username is required',
                        minLength: {
                          value: 3,
                          message: 'Username must be at least 3 characters',
                        },
                        maxLength: {
                          value: 30,
                          message: 'Username must be less than 30 characters',
                        },
                        pattern: {
                          value: /^[a-zA-Z0-9_]+$/,
                          message: 'Username can only contain letters, numbers, and underscores',
                        },
                      })}
                      className={`input pl-10 ${errors.username ? 'border-danger-500' : ''}`}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-danger-600">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className={`input pl-10 ${errors.email ? 'border-danger-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="bio"
                      rows={4}
                      {...register('bio', {
                        maxLength: {
                          value: 500,
                          message: 'Bio must be less than 500 characters',
                        },
                      })}
                      className={`input ${errors.bio ? 'border-danger-500' : ''}`}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  {errors.bio && (
                    <p className="mt-1 text-sm text-danger-600">{errors.bio.message}</p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary inline-flex items-center"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Username</p>
                    <p className="text-gray-900">{user?.username}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bio</p>
                    <p className="text-gray-900">
                      {user?.bio || 'No bio provided yet.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Stats */}
        <div className="space-y-6">
          {/* Avatar */}
          <div className="card text-center">
            <div className="relative inline-block">
              <img
                src={user?.profile_image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%23ccc'/%3E%3Cpath d='M20 85c0-16.6 13.4-30 30-30s30 13.4 30 30' fill='%23ccc'/%3E%3C/svg%3E"}
                alt={user?.username}
                className="h-24 w-24 rounded-full object-cover mx-auto mb-4"
              />
              <button className="absolute bottom-4 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{user?.username}</h3>
            <p className="text-sm text-gray-500">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
          </div>

          {/* Stats */}
          {profileStats && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                    <span className="text-gray-700">Total Analyses</span>
                  </div>
                  <span className="font-semibold text-gray-900">{profileStats.total_analyses}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-success-600" />
                    <span className="text-gray-700">Total Views</span>
                  </div>
                  <span className="font-semibold text-gray-900">{profileStats.total_views}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-warning-600" />
                    <span className="text-gray-700">Success Rate</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {profileStats.success_rate ? `${profileStats.success_rate}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn btn-secondary">
                Change Password
              </button>
              <button className="w-full btn btn-secondary">
                Download Data
              </button>
              <button className="w-full btn btn-danger">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 