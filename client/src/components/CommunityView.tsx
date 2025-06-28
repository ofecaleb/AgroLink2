import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import type { CommunityPost } from '../types';

export default function CommunityView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [postContent, setPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});
  const [showComments, setShowComments] = useState<{[key: number]: boolean}>({});

  // Fetch community posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/community/posts', user?.region],
    queryFn: () => ApiService.getCommunityPosts(user?.region),
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (content: string) => ApiService.createCommunityPost({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setPostContent('');
      toast({
        title: 'Post shared successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create post',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: (postId: number) => ApiService.likePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to like post',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Unlike post mutation
  const unlikePostMutation = useMutation({
    mutationFn: (postId: number) => ApiService.unlikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to unlike post',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) => 
      ApiService.createCommunityComment(postId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setCommentInputs(prev => ({ ...prev, [variables.postId]: '' }));
      toast({
        title: 'Comment added successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add comment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handler functions
  const handleCreatePost = () => {
    if (!postContent.trim()) {
      toast({
        title: 'Please enter some content for your post',
        variant: 'destructive',
      });
      return;
    }
    createPostMutation.mutate(postContent);
  };

  const handleLikePost = (postId: number, isLiked: boolean) => {
    if (isLiked) {
      unlikePostMutation.mutate(postId);
    } else {
      likePostMutation.mutate(postId);
    }
  };

  const handleComment = (postId: number) => {
    const content = commentInputs[postId]?.trim();
    if (!content) {
      toast({
        title: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }
    createCommentMutation.mutate({ postId, content });
  };

  const handleShare = (post: any) => {
    const shareText = `Check out this post from ${post.user.name}: "${post.content}" - Shared via AgroLink`;
    if (navigator.share) {
      navigator.share({
        title: 'AgroLink Community Post',
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Post copied to clipboard!',
        description: 'You can now share it anywhere.',
      });
    }
  };

  const toggleComments = (postId: number) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentInputChange = (postId: number, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  if (postsLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-users mr-2 text-farm-green"></i>
              Community
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePost = () => {
    if (!postContent.trim()) {
      toast({
        title: 'Please enter some content for your post',
        variant: 'destructive',
      });
      return;
    }

    createPostMutation.mutate(postContent);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Community Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          <i className="fas fa-users mr-2"></i>
          {t('communityHeaderTitle')}
        </h2>
        <p className="text-purple-100">{t('communitySubtitle')}</p>
      </div>

      {/* Create Post */}
      <Card className="card-farm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-plus-circle text-farm-green mr-2"></i>
            {t('createPostTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={t('postPlaceholder')}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="min-h-[100px] resize-none input-farm"
            maxLength={500}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button 
                className="text-gray-500 hover:text-farm-green transition-colors touch-target" 
                title="Add photo"
                onClick={() => toast({ title: 'Photo upload coming soon!' })}
              >
                <i className="fas fa-camera text-lg"></i>
              </button>
              <button 
                className="text-gray-500 hover:text-farm-green transition-colors touch-target" 
                title="Add location"
                onClick={() => toast({ title: 'Location tagging coming soon!' })}
              >
                <i className="fas fa-map-marker-alt text-lg"></i>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {postContent.length}/500
              </span>
              <Button 
                onClick={handleCreatePost}
                disabled={!postContent.trim() || createPostMutation.isPending}
                className="btn-farm"
              >
                {createPostMutation.isPending ? (
                  <div className="loading-spinner mr-2"></div>
                ) : (
                  <i className="fas fa-paper-plane mr-2"></i>
                )}
                {t('postBtnText')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Posts */}
      <div className="space-y-4">
        {postsLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="card-farm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex space-x-6">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : posts.length === 0 ? (
          <Card className="card-farm text-center py-12">
            <CardContent>
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-users text-gray-400 text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Be the first to share something with your farming community!
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((postData: any) => (
            <Card key={postData.post.id} className="card-farm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAvatarColor(postData.user.name)}`}>
                    <span className="text-white font-semibold">
                      {getUserInitials(postData.user.name)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-white">
                      {postData.user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {postData.user.region} • {getTimeAgo(postData.post.createdAt)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                  {postData.post.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-6">
                    <button 
                      className="flex items-center space-x-2 text-gray-500 hover:text-farm-green transition-colors touch-target"
                      onClick={() => toast({ title: 'Likes coming soon!' })}
                    >
                      <i className="fas fa-thumbs-up"></i>
                      <span>{postData.post.likes}</span>
                    </button>
                    <button 
                      className="flex items-center space-x-2 text-gray-500 hover:text-farm-green transition-colors touch-target"
                      onClick={() => toast({ title: 'Comments coming soon!' })}
                    >
                      <i className="fas fa-comment"></i>
                      <span>{postData.post.comments}</span>
                    </button>
                    <button 
                      className="flex items-center space-x-2 text-gray-500 hover:text-farm-green transition-colors touch-target"
                      onClick={() => toast({ title: 'Sharing coming soon!' })}
                    >
                      <i className="fas fa-share"></i>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
