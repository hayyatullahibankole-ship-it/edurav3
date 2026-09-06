import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Upload, BookOpen, Trash2, Edit, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import QuestionMediaUploader from '@/components/admin/QuestionMediaUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SchoolQuestionManagerProps {
  schoolId: string;
}

interface QuestionOption {
  text: string;
  index: number;
}

export default function SchoolQuestionManager({ schoolId }: SchoolQuestionManagerProps) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    type: 'MCQ_SINGLE' as 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'ESSAY',
    subject_id: '',
    difficulty_level: 1,
    options: [
      { text: '', index: 0 },
      { text: '', index: 1 },
      { text: '', index: 2 },
      { text: '', index: 3 }
    ] as QuestionOption[],
    correct_answer: '0',
    explanation: '',
    points: 1,
    time_limit_seconds: 90,
    tags: [] as string[],
    media_urls: [] as any[],
  });

  const [stats, setStats] = useState({
    total: 0,
    bySubject: {} as Record<string, number>,
  });

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setSubjects(subjectsData || []);

      // Fetch questions created by this school
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) return;

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*, subjects(name)')
        .eq('created_by', userData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setQuestions(questionsData || []);

      // Calculate stats
      const total = questionsData?.length || 0;
      const bySubject: Record<string, number> = {};
      questionsData?.forEach(q => {
        const subjectName = q.subjects?.name || 'Unknown';
        bySubject[subjectName] = (bySubject[subjectName] || 0) + 1;
      });

      setStats({ total, bySubject });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      if (!newQuestion.question_text || !newQuestion.subject_id) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate options for MCQ
      if (newQuestion.type === 'MCQ_SINGLE' || newQuestion.type === 'MCQ_MULTI') {
        const hasEmptyOptions = newQuestion.options.some(opt => !opt.text.trim());
        if (hasEmptyOptions) {
          toast.error('Please fill in all answer options');
          return;
        }
      }

      setLoading(true);
      
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      // Prepare options based on question type
      let optionsData = null;
      if (newQuestion.type === 'MCQ_SINGLE' || newQuestion.type === 'MCQ_MULTI') {
        optionsData = newQuestion.options.map(opt => opt.text);
      } else if (newQuestion.type === 'TRUE_FALSE') {
        optionsData = ['True', 'False'];
      }

      // Insert question into Edura's question bank
      const { error: questionError } = await supabase
        .from('questions')
        .insert({
          question_text: newQuestion.question_text,
          type: newQuestion.type,
          subject_id: newQuestion.subject_id,
          difficulty_level: newQuestion.difficulty_level,
          options: optionsData,
          correct_answer: newQuestion.correct_answer,
          explanation: newQuestion.explanation || null,
          points: newQuestion.points,
          time_limit_seconds: newQuestion.time_limit_seconds,
          tags: newQuestion.tags.length > 0 ? newQuestion.tags : null,
          media_urls: newQuestion.media_urls || [],
          created_by: userData.id,
          is_active: true,
        });

      if (questionError) throw questionError;

      toast.success('Question added to Edura question bank successfully!');
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
      
    } catch (error: any) {
      console.error('Error creating question:', error);
      toast.error(error.message || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewQuestion({
      question_text: '',
      type: 'MCQ_SINGLE',
      subject_id: '',
      difficulty_level: 1,
      options: [
        { text: '', index: 0 },
        { text: '', index: 1 },
        { text: '', index: 2 },
        { text: '', index: 3 }
      ],
      correct_answer: '0',
      explanation: '',
      points: 1,
      time_limit_seconds: 90,
      tags: [],
      media_urls: [],
    });
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index].text = text;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: false })
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Question deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const getDifficultyLabel = (level: number) => {
    if (level === 1) return 'Easy';
    if (level === 2) return 'Medium';
    return 'Hard';
  };

  const getDifficultyColor = (level: number) => {
    if (level === 1) return 'bg-green-500/10 text-green-500';
    if (level === 2) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-red-500/10 text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Bank</h2>
          <p className="text-muted-foreground">Upload and manage questions for Edura's question bank</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Question to Edura Bank</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Question Type and Subject */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Question Type *</Label>
                  <Select 
                    value={newQuestion.type} 
                    onValueChange={(value: any) => setNewQuestion({...newQuestion, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ_SINGLE">Multiple Choice (Single Answer)</SelectItem>
                      <SelectItem value="MCQ_MULTI">Multiple Choice (Multiple Answers)</SelectItem>
                      <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                      <SelectItem value="ESSAY">Essay/Theory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Select 
                    value={newQuestion.subject_id} 
                    onValueChange={(value) => setNewQuestion({...newQuestion, subject_id: value})}
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
              </div>

              {/* Question Text */}
              <div>
                <Label htmlFor="question_text">Question Text *</Label>
                <Textarea
                  id="question_text"
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                  placeholder="Enter the question text here..."
                  rows={4}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports LaTeX notation: Use \(...\) for inline math and \[...\] for display math
                </p>
              </div>

              <QuestionMediaUploader
                value={newQuestion.media_urls}
                onChange={(items) => setNewQuestion({ ...newQuestion, media_urls: items })}
              />

              {/* Options for MCQ */}
              {(newQuestion.type === 'MCQ_SINGLE' || newQuestion.type === 'MCQ_MULTI') && (
                <div className="space-y-3">
                  <Label>Answer Options *</Label>
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {String.fromCharCode(65 + index)}
                      </Badge>
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Correct Answer */}
              {newQuestion.type !== 'ESSAY' && (
                <div>
                  <Label htmlFor="correct_answer">Correct Answer *</Label>
                  <Select 
                    value={newQuestion.correct_answer} 
                    onValueChange={(value) => setNewQuestion({...newQuestion, correct_answer: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {newQuestion.type === 'TRUE_FALSE' ? (
                        <>
                          <SelectItem value="0">True</SelectItem>
                          <SelectItem value="1">False</SelectItem>
                        </>
                      ) : (
                        newQuestion.options.map((_, index) => (
                          <SelectItem key={index} value={String(index)}>
                            Option {String.fromCharCode(65 + index)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Explanation */}
              <div>
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                  placeholder="Explain the correct answer..."
                  rows={3}
                />
              </div>

              {/* Difficulty and Points */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select 
                    value={String(newQuestion.difficulty_level)} 
                    onValueChange={(value) => setNewQuestion({...newQuestion, difficulty_level: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Easy</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({...newQuestion, points: parseFloat(e.target.value) || 1})}
                    min={0.5}
                    step={0.5}
                  />
                </div>
                
                <div>
                  <Label htmlFor="time_limit">Time Limit (sec)</Label>
                  <Input
                    id="time_limit"
                    type="number"
                    value={newQuestion.time_limit_seconds}
                    onChange={(e) => setNewQuestion({...newQuestion, time_limit_seconds: parseInt(e.target.value) || 90})}
                    min={30}
                    step={15}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateQuestion} disabled={loading} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {loading ? 'Adding...' : 'Add to Question Bank'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }} 
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Total Questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Added to Edura bank</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Subjects Covered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.bySubject).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Different subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Average per Subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.bySubject).length > 0 
                ? Math.round(stats.total / Object.keys(stats.bySubject).length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Questions per subject</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-green-500/10 text-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Your Questions in Edura Bank
          </CardTitle>
          <CardDescription>
            All questions you upload are automatically added to Edura's main question bank
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No questions added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Add Question" to start building your question bank
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-1">
                            {question.type.replace('_', ' ')}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium mb-2 line-clamp-2">
                              {question.question_text}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {question.subjects?.name || 'Unknown Subject'}
                              </Badge>
                              <Badge className={`text-xs ${getDifficultyColor(question.difficulty_level)}`}>
                                {getDifficultyLabel(question.difficulty_level)}
                              </Badge>
                              <span>•</span>
                              <span>{question.points} points</span>
                              <span>•</span>
                              <span>{question.time_limit_seconds}s</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestion(question.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
