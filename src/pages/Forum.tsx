import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, ThumbsUp, Eye, Pin, CheckCircle2, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { formatDistanceToNow } from 'date-fns';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  is_solved: boolean;
  is_pinned: boolean;
  is_featured: boolean;
  upvotes: number;
  reply_count: number;
  view_count: number;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
  };
  subjects?: {
    name: string;
  };
}

export default function Forum() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to access the forum');
      navigate('/auth');
      return;
    }
    fetchPosts();

    // Subscribe to real-time updates
    const postsChannel = supabase
      .channel('forum-posts-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [user, navigate]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          users (first_name, last_name),
          subjects (name)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Layout showNavbar={false} showMobileNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar={false} showMobileNav={false}>
      <div className="min-h-screen bg-primary/5 relative overflow-hidden">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 py-4 sm:py-8 relative z-10">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="gap-2 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Vibrant Header */}
          <div className="mb-6 sm:mb-8">
            <div 
              className="relative overflow-hidden rounded-[32px] bg-primary p-6 sm:p-8 shadow-2xl mb-6 animate-fade-in"
              style={{ boxShadow: '0 20px 60px rgba(0, 123, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' }}
            >
              {/* Animated gradient orbs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
                      💬 Ask & Learn
                    </h1>
                    <p className="text-base sm:text-lg text-white/95 font-semibold drop-shadow-md">
                      Get help from tutors and fellow students
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/forum/new')} 
                    className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-black rounded-2xl h-12 px-6 shadow-xl hover:scale-105 active:scale-95 transition-all"
                    style={{ boxShadow: '0 10px 30px rgba(255, 255, 255, 0.3)' }}
                  >
                    Ask Question
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-2xl text-base border-2 border-border hover:border-primary focus:border-primary transition-all shadow-lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card 
                key={post.id}
                className="hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer animate-fade-in backdrop-blur-sm bg-card/80 border-2 border-border hover:border-primary/50 rounded-[24px]"
                onClick={() => navigate(`/forum/post/${post.id}`)}
                style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}
              >
                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {post.is_pinned && (
                        <Badge variant="default" className="text-xs font-bold rounded-full bg-primary">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {post.is_solved && (
                        <Badge variant="default" className="bg-success text-xs font-bold rounded-full">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Solved
                        </Badge>
                      )}
                      {post.subjects && (
                        <Badge variant="secondary" className="text-xs font-semibold rounded-full">{post.subjects.name}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-black leading-tight bg-foreground">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm font-medium">
                      {post.content}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="truncate font-semibold">
                        by {post.users?.first_name} {post.users?.last_name}
                      </span>
                      <span className="text-xs font-medium">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-primary">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm font-bold">{post.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-info">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-bold">{post.reply_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-bold">{post.view_count}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPosts.length === 0 && (
              <Card 
                className="animate-fade-in backdrop-blur-sm bg-card/80 border-2 border-dashed rounded-[24px]"
                style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}
              >
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                  <div className="p-6 rounded-full bg-primary/20 mb-4">
                    <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                  </div>
                  <p className="text-sm sm:text-base text-foreground font-semibold text-center mb-2">
                    {searchQuery ? 'No posts found matching your search' : 'No discussions yet'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    {!searchQuery && 'Be the first to ask a question!'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
