import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, Calculator, Atom, Beaker, Globe2, BookOpen, TrendingUp, Briefcase, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { SubjectButton } from '@/components/dashboard/SubjectButton';
import { useIsMobile } from '@/hooks/use-mobile';
import WhatsAppButton from '@/components/WhatsAppButton';
import { MobileTabBar } from '@/components/edura/AppShell';

interface Subject {
  id: string;
  name: string;
  course_category: string;
  is_active: boolean;
}

interface StudyTopic {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  exam_type: string;
  difficulty_level: number;
  subjects: { name: string };
}

const subjectIcons: Record<string, { icon: any; gradient: string }> = {
  'Mathematics': { icon: Calculator, gradient: 'from-blue-500 to-blue-600' },
  'Physics': { icon: Atom, gradient: 'from-purple-500 to-purple-600' },
  'Chemistry': { icon: Beaker, gradient: 'from-green-500 to-green-600' },
  'Biology': { icon: Sparkles, gradient: 'from-teal-500 to-teal-600' },
  'English': { icon: BookOpen, gradient: 'from-orange-500 to-orange-600' },
  'Geography': { icon: Globe2, gradient: 'from-cyan-500 to-cyan-600' },
  'Economics': { icon: TrendingUp, gradient: 'from-indigo-500 to-indigo-600' },
  'Commerce': { icon: Briefcase, gradient: 'from-pink-500 to-pink-600' },
};

export default function StudyHub() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canAccessPremium, loading: subLoading } = useSubscription();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
const [loading, setLoading] = useState(true);
const [accessDenied, setAccessDenied] = useState(false);

useEffect(() => {
  if (!subLoading && !canAccessPremium) {
    setAccessDenied(true);
    setLoading(false);
    return;
  }

  if (canAccessPremium) {
    fetchSubjects();

    // Subscribe to real-time updates
    const topicsChannel = supabase
      .channel('study-topics-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_topics' }, () => {
        if (selectedSubject) {
          fetchTopics(selectedSubject);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(topicsChannel);
    };
  }
}, [canAccessPremium, subLoading, navigate, selectedSubject]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_topics')
        .select(`
          *,
          subjects (name)
        `)
        .eq('is_active', true)
        .eq('subject_id', subjectId)
        .order('display_order');

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load study topics');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    setSelectedSubject(subjectId);
    fetchTopics(subjectId);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setTopics([]);
  };

  if (subLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

if (accessDenied) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <Book className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Study Hub is a Premium feature</h1>
          <p className="text-muted-foreground mb-6">Upgrade to access subjects, topics, and guided lessons.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/payment')}>Go Premium</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Back</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Mobile view
if (isMobile) {
  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="bg-primary/10 p-6 pb-8">
          <Button
            variant="ghost"
            onClick={selectedSubject ? handleBackToSubjects : () => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {selectedSubject ? 'Back to Subjects' : 'Back'}
          </Button>
          
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Book className="h-8 w-8 text-primary" />
            Study Hub
          </h1>
          <p className="text-muted-foreground text-sm">
            {selectedSubject ? 'Select a topic to study' : 'Choose a subject to get started'}
          </p>
        </div>

        {/* Subject Selection */}
        {!selectedSubject && (
          <div className="px-6 -mt-4">
            <div className="grid grid-cols-4 gap-4">
              {subjects.map((subject) => {
                const iconData = subjectIcons[subject.name] || { icon: Book, gradient: 'from-gray-500 to-gray-600' };
                return (
                  <SubjectButton
                    key={subject.id}
                    icon={iconData.icon}
                    title={subject.name}
                    gradient={iconData.gradient}
                    onClick={() => handleSubjectClick(subject.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Topics List */}
        {selectedSubject && (
          <div className="px-6 -mt-4">
            {topics.length === 0 ? (
              <Card className="animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                  <Book className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">No topics available for this subject yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {topics.map((topic) => (
                  <Card
                    key={topic.id}
                    className="hover:shadow-xl transition-all cursor-pointer animate-fade-in border-l-4"
                    style={{ borderLeftColor: `hsl(var(--primary))` }}
                    onClick={() => navigate(`/study-hub/topic/${topic.id}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1 line-clamp-2">{topic.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {topic.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                              Level {topic.difficulty_level}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {topic.exam_type}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-primary/10">
                          <Book className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <MobileTabBar />
      <WhatsAppButton />
    </>
  );
}

  // Desktop view
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={selectedSubject ? handleBackToSubjects : () => navigate('/dashboard')}
              className="mb-6 gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              {selectedSubject ? 'Back to Subjects' : 'Back to Dashboard'}
            </Button>
            
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-2xl bg-primary/20">
                <Book className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Study Companion Hub</h1>
                <p className="text-muted-foreground mt-1">
                  {selectedSubject ? 'Select a topic to begin your learning journey' : 'Choose a subject to explore topics'}
                </p>
              </div>
            </div>
          </div>

          {/* Subject Selection */}
          {!selectedSubject && (
            <>
              {subjects.length === 0 ? (
                <Card className="animate-fade-in">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <Book className="h-20 w-20 text-muted-foreground mb-4 opacity-30" />
                    <p className="text-lg text-muted-foreground text-center">No subjects available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {subjects.map((subject) => {
                    const iconData = subjectIcons[subject.name] || { icon: Book, gradient: 'from-gray-500 to-gray-600' };
                    const Icon = iconData.icon;
                    return (
                      <Card
                        key={subject.id}
                        className="group hover:shadow-2xl transition-all duration-300 cursor-pointer animate-fade-in border-2 hover:border-primary/20 overflow-hidden"
                        onClick={() => handleSubjectClick(subject.id)}
                      >
                        <CardContent className="p-8 text-center relative">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl ${iconData.gradient} flex items-center justify-center shadow-xl transform transition-all group-hover:scale-110 group-hover:rotate-3 relative z-10`}>
                            <Icon className="h-12 w-12 text-white" strokeWidth={2.5} />
                          </div>
                          <h3 className="font-bold text-xl relative z-10">{subject.name}</h3>
                          <p className="text-sm text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                            Click to explore topics
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Topics List */}
          {selectedSubject && (
            <div className="animate-fade-in">
              {topics.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                    <Book className="h-20 w-20 text-muted-foreground mb-4 opacity-30" />
                    <p className="text-lg text-muted-foreground text-center">No topics available for this subject yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {topics.map((topic, index) => (
                    <Card
                      key={topic.id}
                      className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 overflow-hidden"
                      onClick={() => navigate(`/study-hub/topic/${topic.id}`)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full transform translate-x-8 -translate-y-8"></div>
                      <CardContent className="p-6 relative">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 rounded-2xl bg-primary/20 group-hover:scale-110 transition-transform">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {topic.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                Level {topic.difficulty_level}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/50 text-secondary-foreground">
                                {topic.exam_type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                          {topic.description}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-xs text-muted-foreground font-medium">
                            {topic.subjects?.name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
