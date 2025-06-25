
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from "sonner";
import { Search, PlusCircle, Trash2, Edit, ExternalLink } from 'lucide-react';

const AdminVideos = () => {
  const { videos, progress, deleteVideo } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(videos.map(video => video.category)))];
  
  // Filter videos based on search and category
  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || video.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Handle delete video
  const handleDeleteClick = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!videoToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteVideo(videoToDelete);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Failed to delete video:", error);
      toast.error("Failed to delete video");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="container mx-auto animate-fade-in">
      <header className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Videos</h1>
            <p className="text-gray-600 max-w-2xl">
              Add, edit, or delete videos from the wellness education portal.
            </p>
          </div>
          <Button asChild className="bg-wellness-blue hover:bg-wellness-blue/90">
            <Link to="/admin/videos/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Video
            </Link>
          </Button>
        </div>
      </header>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category} className="capitalize">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Videos table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Duration</th>
                <th className="text-left p-4">Views</th>
                <th className="text-left p-4">Completions</th>
                <th className="text-left p-4">Added On</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.length > 0 ? (
                filteredVideos.map((video) => {
                  const views = progress.filter(p => p.videoId === video.id).length;
                  const completions = progress.filter(p => p.videoId === video.id && p.completed).length;
                  const addedDate = new Date(video.createdAt).toLocaleDateString();
                  
                  return (
                    <tr key={video.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="h-10 w-16 rounded overflow-hidden mr-3">
                            <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                          </div>
                          <span className="font-medium">{video.title}</span>
                        </div>
                      </td>
                      <td className="p-4">{video.category}</td>
                      <td className="p-4">{Math.floor(video.duration / 60)} min</td>
                      <td className="p-4">{views}</td>
                      <td className="p-4">{completions}</td>
                      <td className="p-4">{addedDate}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/videos/${video.id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/videos/edit/${video.id}`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(video.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No videos found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
              Student progress related to this video will also be lost.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Video'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVideos;
