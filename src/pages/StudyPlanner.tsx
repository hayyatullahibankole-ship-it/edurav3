import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, Clock, Target, CheckCircle2, Circle, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface StudySession {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  subjects?: { name: string };
}

const StudyPlanner = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
  });

  useEffect(() => {
    if (userProfile?.id) {
      fetchData();
    }
  }, [userProfile, date]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [sessionsRes, subjectsRes, goalsRes] = await Promise.all([
        supabase
          .from('study_sessions')
          .select('*, subjects(name)')
          .eq('user_id', userProfile?.id)
          .gte('session_date', format(date || new Date(), 'yyyy-MM-dd'))
          .order('session_date', { ascending: true }),
        
        supabase.from('subjects').select('*').limit(10),
        
        supabase
          .from('study_goals')
          .select('*')
          .eq('user_id', userProfile?.id)
          .eq('is_completed', false)
          .order('target_date', { ascending: true }),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      if (goalsRes.error) throw goalsRes.error;

      setSessions(sessionsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setGoals(goalsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('study_sessions').insert([{
        user_id: userProfile?.id,
        ...formData,
      }]);

      if (error) throw error;

      toast({
        title: 'Session Created!',
        description: 'Your study session has been scheduled.',
      });

      setIsDialogOpen(false);
      fetchData();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        subject_id: '',
        session_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:00',
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create study session.',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Session Completed! 🎉',
        description: 'Great job on completing your study session!',
      });

      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: 'default',
      completed: 'success',
      missed: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Layout showNavbar={false} showMobileNav={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Navigation */}
          <div className="flex items-center gap-2 mb-6">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Study Planner</h1>
              <p className="text-muted-foreground">Organize your study schedule and track your goals</p>
            </div>
          
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Study Session</DialogTitle>
                </DialogHeader>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Mathematics Review"
                  />
                </div>
                
                <div>
                  <Label>Subject</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({...formData, subject_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    required
                    value={formData.session_date}
                    onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Add notes about what you'll study"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Schedule Session
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Sessions & Goals */}
          <div className="md:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your scheduled study sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-4">Loading...</p>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No sessions scheduled yet</p>
                    <p className="text-sm mt-2">Create your first study session!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <Card key={session.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{session.title}</h4>
                              {getStatusBadge(session.status)}
                            </div>
                            {session.subjects && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {session.subjects.name}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>📅 {format(new Date(session.session_date), 'MMM dd, yyyy')}</span>
                              <span>⏰ {session.start_time} - {session.end_time}</span>
                            </div>
                            {session.description && (
                              <p className="text-sm mt-2">{session.description}</p>
                            )}
                          </div>
                          {session.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteSession(session.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Study Goals</CardTitle>
                <CardDescription>Track your learning objectives</CardDescription>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active goals</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <div key={goal.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Circle className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(goal.target_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{goal.current_value}/{goal.target_value}</p>
                          <p className="text-xs text-muted-foreground">{goal.goal_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default StudyPlanner;
