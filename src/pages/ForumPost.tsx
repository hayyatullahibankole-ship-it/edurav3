import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, ThumbsUp, MessageSquare, CheckCircle2, Pin } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { formatDistanceToNow } from 'date-fns';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  is_solved: boolean;
  is_pinned: boolean;
  upvotes: number;
  reply_count: number;
  view_count: number;
  created_at: string;
  user_id: string;
  users: {
    first_name: string;
    last_name: string;
  };
  subjects?: {
    name: string;
  };
}

interface ForumReply {
  id: string;
  content: string;
  upvotes: number;
  is_answer: boolean;
  created_at: string;
  user_id: string;
  users: {
    first_name: string;
    last_name: string;
  };
}

interface UserVote {
  post_id?: string;
  reply_id?: string;
}

export default function ForumPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, isAdmin } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to view this post');
      navigate('/auth');
      return;
    }
    fetchPostData();
    incrementViewCount();
  }, [user, postId, navigate]);

  const fetchPostData = async () => {
    try {
      setLoading(true);
      const [postResp, repliesResp, votesResp] = await Promise.all([
        supabase
          .from('forum_posts')
          .select('*, users(first_name, last_name), subjects(name)')
          .eq('id', postId!)
          .single(),
        supabase
          .from('forum_replies')
          .select('*, users(first_name, last_name)')
          .eq('post_id', postId!)
          .order('is_answer', { ascending: false })
          .order('created_at', { ascending: true }),
        supabase
          .from('forum_votes')
          .select('post_id, reply_id')
          .eq('user_id', userProfile?.id!)
          .or(`post_id.eq.${postId},reply_id.in.(select id from forum_replies where post_id=${postId})`)
      ]);

      if (postResp.error) throw postResp.error;
      if (repliesResp.error) throw repliesResp.error;

      setPost(postResp.data);
      setReplies(repliesResp.data || []);
      setUserVotes(votesResp.data || []);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      // Fetch current count, increment, and update
      const { data: currentPost } = await supabase
        .from('forum_posts')
        .select('view_count')
        .eq('id', postId!)
        .single();
      
      if (currentPost) {
        await supabase
          .from('forum_posts')
          .update({ view_count: (currentPost.view_count || 0) + 1 })
          .eq('id', postId!);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id || !replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('forum_replies')
        .insert([{
          post_id: postId!,
          user_id: userProfile.id,
          content: replyContent.trim()
        }]);

      if (error) throw error;

      // Update reply count
      const { data: currentPost } = await supabase
        .from('forum_posts')
        .select('reply_count')
        .eq('id', postId!)
        .single();
      
      if (currentPost) {
        await supabase
          .from('forum_posts')
          .update({ reply_count: (currentPost.reply_count || 0) + 1 })
          .eq('id', postId!);
      }

      toast.success('Reply posted successfully!');
      setReplyContent('');
      fetchPostData();
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast.error(error.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (e: React.MouseEvent, replyId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userProfile?.id) return;

    const hasVoted = replyId
      ? userVotes.some(v => v.reply_id === replyId)
      : userVotes.some(v => v.post_id === postId);

    try {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('forum_votes')
          .delete()
          .eq('user_id', userProfile.id)
          .eq(replyId ? 'reply_id' : 'post_id', replyId || postId!);

        if (error) throw error;

        // Update count
        if (replyId) {
          const { data: currentReply } = await supabase
            .from('forum_replies')
            .select('upvotes')
            .eq('id', replyId)
            .single();
          
          if (currentReply) {
            await supabase
              .from('forum_replies')
              .update({ upvotes: Math.max(0, (currentReply.upvotes || 0) - 1) })
              .eq('id', replyId);
          }
        } else {
          const { data: currentPost } = await supabase
            .from('forum_posts')
            .select('upvotes')
            .eq('id', postId!)
            .single();
          
          if (currentPost) {
            await supabase
              .from('forum_posts')
              .update({ upvotes: Math.max(0, (currentPost.upvotes || 0) - 1) })
              .eq('id', postId!);
          }
        }

        toast.success('Vote removed');
      } else {
        // Add vote
        if (replyId) {
          await supabase.from('forum_votes').insert([{
            user_id: userProfile.id,
            reply_id: replyId,
            vote_type: 'upvote'
          }]);
          
          const { data: currentReply } = await supabase
            .from('forum_replies')
            .select('upvotes')
            .eq('id', replyId)
            .single();
          
          if (currentReply) {
            await supabase
              .from('forum_replies')
              .update({ upvotes: (currentReply.upvotes || 0) + 1 })
              .eq('id', replyId);
          }
        } else {
          await supabase.from('forum_votes').insert([{
            user_id: userProfile.id,
            post_id: postId!,
            vote_type: 'upvote'
          }]);
          
          const { data: currentPost } = await supabase
            .from('forum_posts')
            .select('upvotes')
            .eq('id', postId!)
            .single();
          
          if (currentPost) {
            await supabase
              .from('forum_posts')
              .update({ upvotes: (currentPost.upvotes || 0) + 1 })
              .eq('id', postId!);
          }
        }

        toast.success('Upvoted!');
      }

      fetchPostData();
    } catch (error: any) {
      console.error('Vote error:', error);
      toast.error('Failed to vote');
    }
  };

  if (loading) {
    return (
      <Layout showNavbar={false} showMobileNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout showNavbar={false} showMobileNav={false}>
        <div className="container mx-auto px-4 py-8">
          <p>Post not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar={false} showMobileNav={false}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/forum')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>

        {/* Main Post */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {post.is_pinned && (
                <Badge variant="default">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {post.is_solved && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Solved
                </Badge>
              )}
              {post.subjects && (
                <Badge variant="secondary">{post.subjects.name}</Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none mb-4">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {post.users?.first_name?.[0]}{post.users?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">
                    {post.users?.first_name} {post.users?.last_name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleUpvote(e)}
                  className={`gap-1 ${
                    userVotes.some(v => v.post_id === postId) 
                      ? 'text-primary bg-primary/10' 
                      : ''
                  }`}
                >
                  <ThumbsUp className={`h-4 w-4 ${
                    userVotes.some(v => v.post_id === postId) ? 'fill-current' : ''
                  }`} />
                  {post.upvotes}
                </Button>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MessageSquare className="h-4 w-4" />
                  {post.reply_count}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xl font-bold">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h3>
          
          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {reply.users?.first_name?.[0]}{reply.users?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-sm">
                        {reply.users?.first_name} {reply.users?.last_name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </p>
                      {reply.is_answer && (
                        <Badge variant="default" className="bg-green-500 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Answer
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap mb-3">{reply.content}</p>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleUpvote(e, reply.id)}
                      className={`gap-1 h-8 ${
                        userVotes.some(v => v.reply_id === reply.id)
                          ? 'text-primary bg-primary/10'
                          : ''
                      }`}
                    >
                      <ThumbsUp className={`h-3 w-3 ${
                        userVotes.some(v => v.reply_id === reply.id) ? 'fill-current' : ''
                      }`} />
                      {reply.upvotes}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
                required
              />
              <Button type="submit" disabled={submitting || !replyContent.trim()}>
                {submitting ? 'Posting...' : 'Post Reply'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
