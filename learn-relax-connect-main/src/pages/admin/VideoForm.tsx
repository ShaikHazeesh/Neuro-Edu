
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

interface VideoFormData {
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number;
  category: string;
}

const VideoForm = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { videos, addVideo } = useData();
  const navigate = useNavigate();
  const isEditMode = videoId !== undefined;
  
  // Form state
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    duration: 300, // Default 5 minutes
    category: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof VideoFormData, string>>>({});
  
  // Populate form if in edit mode
  useEffect(() => {
    if (isEditMode && videoId) {
      const video = videos.find(v => v.id === videoId);
      
      if (video) {
        setFormData({
          title: video.title,
          description: video.description,
          url: video.url,
          thumbnail: video.thumbnail,
          duration: video.duration,
          category: video.category,
        });
      } else {
        toast.error("Video not found");
        navigate('/admin/videos');
      }
    }
  }, [isEditMode, videoId, videos, navigate]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (errors[name as keyof VideoFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle duration change (special case for number input)
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value, 10) || 0;
    
    setFormData(prev => ({
      ...prev,
      duration: minutes * 60 // Convert minutes to seconds
    }));
    
    if (errors.duration) {
      setErrors(prev => ({
        ...prev,
        duration: undefined
      }));
    }
  };
  
  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
    
    if (errors.category) {
      setErrors(prev => ({
        ...prev,
        category: undefined
      }));
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof VideoFormData, string>> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'Video URL is required';
    } else if (!formData.url.includes('youtube.com/embed/')) {
      newErrors.url = 'Please provide a valid YouTube embed URL';
    }
    
    if (!formData.thumbnail.trim()) {
      newErrors.thumbnail = 'Thumbnail URL is required';
    }
    
    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode) {
        // In a real app, we would update the video
        // For this demo, we'll just simulate a successful update
        toast.success("Video updated successfully");
        navigate('/admin/videos');
      } else {
        // Add new video
        await addVideo(formData);
        toast.success("Video added successfully");
        navigate('/admin/videos');
      }
    } catch (error) {
      console.error("Failed to save video:", error);
      toast.error("Failed to save video");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Category options (for demo)
  const categoryOptions = [
    'Anxiety Management',
    'Depression',
    'Mindfulness',
    'Stress Relief',
    'Sleep Improvement',
    'Self-Care',
    'Emotional Intelligence',
    'Social Skills',
  ];
  
  return (
    <div className="container mx-auto animate-fade-in">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Videos
        </Button>
      </div>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isEditMode ? 'Edit Video' : 'Add New Video'}
        </h1>
        <p className="text-gray-600 max-w-2xl">
          {isEditMode 
            ? 'Update the details of this educational video.'
            : 'Add a new educational video to the wellness portal.'}
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter video title"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-destructive text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter video description"
                  className={errors.description ? "border-destructive" : ""}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-destructive text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="url" className="block text-sm font-medium mb-1">
                  Video URL (YouTube Embed)
                </label>
                <Input
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="e.g., https://www.youtube.com/embed/VIDEO_ID"
                  className={errors.url ? "border-destructive" : ""}
                />
                {errors.url && (
                  <p className="text-destructive text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.url}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Use YouTube embed URLs in the format: https://www.youtube.com/embed/VIDEO_ID
                </p>
              </div>
              
              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium mb-1">
                  Thumbnail URL
                </label>
                <Input
                  id="thumbnail"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  placeholder="e.g., https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
                  className={errors.thumbnail ? "border-destructive" : ""}
                />
                {errors.thumbnail && (
                  <p className="text-destructive text-sm mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.thumbnail}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  For YouTube videos, use: https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium mb-1">
                    Duration (minutes)
                  </label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={formData.duration / 60}
                    onChange={handleDurationChange}
                    placeholder="Enter duration in minutes"
                    className={errors.duration ? "border-destructive" : ""}
                  />
                  {errors.duration && (
                    <p className="text-destructive text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.duration}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-destructive text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/videos')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-wellness-blue hover:bg-wellness-blue/90"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Video' : 'Add Video'}
              </Button>
            </div>
          </form>
        </div>
        
        <div>
          <div className="sticky top-24">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {formData.thumbnail ? (
                  <img 
                    src={formData.thumbnail} 
                    alt="Video thumbnail preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-sm">Thumbnail preview</div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1">
                  {formData.title || 'Video Title'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {formData.description || 'Video description will appear here.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.category && (
                    <span className="text-xs bg-wellness-light-blue/30 text-wellness-blue px-2 py-1 rounded-full">
                      {formData.category}
                    </span>
                  )}
                  {formData.duration > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {Math.floor(formData.duration / 60)} min
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 p-4 bg-wellness-light-blue/20 rounded-lg">
              <h4 className="font-medium mb-2">Tips for Adding Videos</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use clear, descriptive titles that reflect the content.</li>
                <li>• Write comprehensive descriptions to help students understand what they'll learn.</li>
                <li>• Ensure videos are appropriate for the target audience.</li>
                <li>• For YouTube videos, use the embed URL format.</li>
                <li>• Select accurate categories to help with content organization.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoForm;
