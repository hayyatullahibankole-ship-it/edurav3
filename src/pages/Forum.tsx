import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, ThumbsUp, Eye, Pin, CheckCircle2, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import AppShell from '@/components/edura/AppShell';
import { Panel, EmptyState } from '@/components/edura/tiles';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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
  const [filter, setFilter] = useState<'all' | 'unsolved' | 'solved'>('all');

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

  const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'unsolved', label: 'Unsolved' },
    { value: 'solved', label: 'Solved' },
  ] as const;

  const visiblePosts = filteredPosts.filter((post) =>
    filter === 'all' ? true : filter === 'solved' ? post.is_solved : !post.is_solved
  );

  return (
    <AppShell side="cbt" title="Student forum" subtitle="Ask questions, help others, learn faster">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search discussions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <Button onClick={() => navigate('/forum/new')} className="h-11 shrink-0 gap-1.5 rounded-xl px-4">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ask</span>
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
                filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted/50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Panel title="Discussions">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <EmptyState>
              {searchQuery ? 'No discussions match your search.' : 'No discussions yet. Be the first to ask a question.'}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {visiblePosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(`/forum/post/${post.id}`)}
                  className="press w-full rounded-xl border bg-card p-3.5 text-left transition-colors hover:border-primary/50"
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    {post.is_pinned && (
                      <Badge variant="secondary" className="gap-1 rounded-full text-[10px]">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    {post.is_solved && (
                      <Badge className="gap-1 rounded-full bg-primary/10 text-[10px] text-primary hover:bg-primary/10">
                        <CheckCircle2 className="h-3 w-3" /> Solved
                      </Badge>
                    )}
                    {post.subjects && (
                      <Badge variant="outline" className="rounded-full text-[10px]">{post.subjects.name}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold leading-snug">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.content}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="truncate">
                      {post.users?.first_name} {post.users?.last_name} ·{' '}
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    <span className="ml-auto flex items-center gap-3 tabular-nums">
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{post.upvotes}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{post.reply_count}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.view_count}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
