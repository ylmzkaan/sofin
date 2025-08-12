import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { analysesAPI } from '../services/api';
import { Upload, X, Plus, TrendingUp, Clock, FileText } from 'lucide-react';

const CreateAnalysis = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      return true;
    });

    if (validFiles.length + images.length > 5) {
      toast.error('Maximum 5 images allowed.');
      return;
    }

    const newImages = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      filename: file.name
    }));

    setImages(prev => [...prev, ...newImages]);
    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setImageFiles(prev => prev.filter((_, index) => 
      images.findIndex(img => img.id === imageId) !== index
    ));
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('target_price', data.target_price);
      formData.append('time_horizon', data.time_horizon);
      
      if (data.tags) {
        formData.append('tags', data.tags);
      }

      imageFiles.forEach((file, index) => {
        formData.append(`image${index + 1}`, file);
      });

      const response = await analysesAPI.createAnalysis(formData);
      toast.success('Analysis created successfully!');
      navigate(`/analysis/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Analysis</h1>
        <p className="text-gray-600">Share your stock analysis and insights with the community</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="title"
                  type="text"
                  {...register('title', {
                    required: 'Title is required',
                    minLength: {
                      value: 5,
                      message: 'Title must be at least 5 characters',
                    },
                    maxLength: {
                      value: 200,
                      message: 'Title must be less than 200 characters',
                    },
                  })}
                  className={`input pl-10 ${errors.title ? 'border-danger-500' : ''}`}
                  placeholder="Enter analysis title"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="target_price" className="block text-sm font-medium text-gray-700 mb-2">
                Target Price *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="target_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('target_price', {
                    required: 'Target price is required',
                    min: {
                      value: 0,
                      message: 'Target price must be positive',
                    },
                  })}
                  className={`input pl-10 ${errors.target_price ? 'border-danger-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.target_price && (
                <p className="mt-1 text-sm text-danger-600">{errors.target_price.message}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="time_horizon" className="block text-sm font-medium text-gray-700 mb-2">
              Time Horizon *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="time_horizon"
                {...register('time_horizon', {
                  required: 'Time horizon is required',
                })}
                className={`input pl-10 ${errors.time_horizon ? 'border-danger-500' : ''}`}
              >
                <option value="">Select time horizon</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
                <option value="2+ years">2+ years</option>
              </select>
            </div>
            {errors.time_horizon && (
              <p className="mt-1 text-sm text-danger-600">{errors.time_horizon.message}</p>
            )}
          </div>

          <div className="mt-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <input
              id="tags"
              type="text"
              {...register('tags')}
              className="input"
              placeholder="Enter tags separated by commas (e.g., tech, growth, value)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Add relevant tags to help others discover your analysis
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Content</h2>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Content *
            </label>
            <textarea
              id="content"
              rows={8}
              {...register('content', {
                required: 'Analysis content is required',
                minLength: {
                  value: 100,
                  message: 'Analysis content must be at least 100 characters',
                },
                maxLength: {
                  value: 5000,
                  message: 'Analysis content must be less than 5000 characters',
                },
              })}
              className={`input ${errors.content ? 'border-danger-500' : ''}`}
              placeholder="Write your detailed analysis here. Include your reasoning, market analysis, risk factors, and any other relevant information..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-danger-600">{errors.content.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {watch('content')?.length || 0} / 5000 characters
            </p>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Images (Optional)</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB (max 5 images)</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt={image.filename}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{image.filename}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary inline-flex items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Analysis
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAnalysis; 