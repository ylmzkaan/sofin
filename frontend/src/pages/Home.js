import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analysesAPI } from '../services/api';
import { TrendingUp, Clock, User, Eye } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await analysesAPI.getAnalyses();
        setAnalyses(response.data);
      } catch (error) {
        console.error('Error fetching analyses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Social Finance
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Discover expert stock analyses and insights from top financial analysts
        </p>
        {!user && (
          <div className="space-x-4">
            <Link
              to="/register"
              className="btn btn-primary inline-flex items-center"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="btn btn-secondary inline-flex items-center"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Recent Analyses
        </h2>
        {analyses.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No analyses available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="card">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={analysis.author.avatar_url || '/default-avatar.png'}
                      alt={analysis.author.username}
                      className="h-12 w-12 rounded-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link
                        to={`/users/${analysis.author.id}`}
                        className="font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {analysis.author.username}
                      </Link>
                      <span className="text-sm text-gray-500">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {analysis.title}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-3">
                      {analysis.content}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>Target: ${analysis.target_price}</span>
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
                    {analysis.images && analysis.images.length > 0 && (
                      <div className="mt-3 flex space-x-2">
                        {analysis.images.slice(0, 3).map((image, index) => (
                          <img
                            key={index}
                            src={`${process.env.REACT_APP_API_URL}/uploads/${image.filename}`}
                            alt={`Analysis ${index + 1}`}
                            className="h-20 w-20 object-cover rounded-lg"
                          />
                        ))}
                        {analysis.images.length > 3 && (
                          <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-500">
                              +{analysis.images.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to={`/analysis/${analysis.id}`}
                    className="btn btn-primary w-full"
                  >
                    View Full Analysis
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <Link
          to="/users"
          className="btn btn-secondary inline-flex items-center"
        >
          <User className="h-4 w-4 mr-2" />
          Browse All Analysts
        </Link>
      </div>
    </div>
  );
};

export default Home; 