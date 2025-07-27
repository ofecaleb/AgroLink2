import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { CommunityPost, CommunityComment } from '../types';

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
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (content: string) => ApiService.createCommunityPost({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setPostContent('');
      toast({
        title: 'Success',
        description: 'Post shared successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
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
        title: 'Error',
        description: error.message || 'Failed to like post',
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
        title: 'Error',
        description: error.message || 'Failed to unlike post',
        variant: 'destructive',
      });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) => 
      ApiService.createCommunityComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      setCommentInputs({});
      toast({
        title: 'Success',
        description: 'Comment added successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
        variant: 'destructive',
      });
    },
  });

  const handleCreatePost = () => {
    if (postContent.trim()) {
      createPostMutation.mutate(postContent);
    }
  };

  const handleLikePost = (postId: number, isLiked: boolean) => {
    if (isLiked) {
      unlikePostMutation.mutate(postId);
    } else {
      likePostMutation.mutate(postId);
    }
  };

  const handleAddComment = (postId: number) => {
    const content = commentInputs[postId];
    if (content?.trim()) {
      createCommentMutation.mutate({ postId, content });
    }
  };

  const handleShare = async (post: any) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AgroLink Community Post',
          text: post.post.content,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${post.post.content}\n\nShared from AgroLink Community`);
        toast({
          title: 'Success',
          description: 'Post copied to clipboard!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share post',
        variant: 'destructive',
      });
    }
  };

  const toggleComments = (postId: number) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  if (postsLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Community Forum
        </h1>
        <Badge variant="outline" className="text-farm-green">
          {user?.region ? user.region.charAt(0).toUpperCase() + user.region.slice(1) : 'Unknown'} Region
        </Badge>
      </div>

      {/* Create Post */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-pen mr-2 text-farm-green"></i>
            Share with the Community
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share your farming experience, ask questions, or provide advice to fellow farmers..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="min-h-24"
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {postContent.length}/500 characters
            </p>
            <Button
              onClick={handleCreatePost}
              disabled={!postContent.trim() || createPostMutation.isPending}
            >
              {createPostMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Posting...
                </>
              ) : (
                <>
                  <i className="fas fa-share mr-2"></i>
                  Share Post
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <i className="fas fa-comments text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Posts Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to share something with your community!
            </p>
            <Button onClick={() => document.querySelector('textarea')?.focus()}>
              Create First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((postData: any) => {
            const post = postData.post;
            const author = postData.user;
            const isLiked = post.isLiked || false;
            const likesCount = post.likes || 0;
            const commentsCount = post.comments || 0;

            return (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={author?.avatar} />
                      <AvatarFallback className="bg-farm-green text-white">
                        {author?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {author?.name || 'Anonymous Farmer'}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {author?.region?.charAt(0).toUpperCase() + author?.region?.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Post Content */}
                  <p className="text-gray-900 dark:text-white leading-relaxed">
                    {post.content}
                  </p>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-6">
                      <Button
                        size="sm"
                        variant={post.hasLiked ? "default" : "outline"}
                        className={post.hasLiked ? "bg-farm-green text-white" : ""}
                        onClick={() => handleLikePost(post.id, post.hasLiked)}
                        disabled={likePostMutation.isPending || unlikePostMutation.isPending}
                      >
                        {post.hasLiked ? (
                          <i className="fas fa-heart mr-1 text-red-500"></i>
                        ) : (
                          <i className="far fa-heart mr-1"></i>
                        )}
                        {post.likes || 0}
                      </Button>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <i className="fas fa-comment"></i>
                        <span>{commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}</span>
                      </button>

                      <button
                        onClick={() => handleShare(postData)}
                        className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <i className="fas fa-share"></i>
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Add Comment */}
                      <div className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback className="bg-farm-green text-white text-xs">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex space-x-2">
                          <Input
                            placeholder="Add a comment..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({
                              ...prev,
                              [post.id]: e.target.value
                            }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim() || createCommentMutation.isPending}
                          >
                            <i className="fas fa-paper-plane"></i>
                          </Button>
                        </div>
                      </div>

                      {/* Existing Comments */}
                      {post.commentsData && post.commentsData.length > 0 && (
                        <div className="space-y-3">
                          {post.commentsData.map((comment: any) => (
                            <div key={comment.id} className="flex space-x-3">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={comment.user?.avatar} />
                                <AvatarFallback className="bg-gray-500 text-white text-xs">
                                  {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                                      {comment.user?.name || 'Anonymous'}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800 dark:text-gray-200">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}