import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MathRenderer } from '@/components/ui/math-renderer';
import { processQuestionText, processQuestionOptions } from '@/utils/latexProcessor';
import { 
  BookOpen, 
  Plus, 
  Upload,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SimpleBulkUpload from './SimpleBulkUpload';
import LatexConverter from '@/components/admin/LatexConverter';
import QuestionCleanup from '@/components/admin/QuestionCleanup';
import ExternalQuestionImport from './ExternalQuestionImport';

interface Question {
  id: string;
  question_text: string;
  type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'FILL_IN' | 'MATCHING' | 'ESSAY';
  options: any;
  correct_answer: any;
  explanation: string;
  difficulty_level: number;
  tags: any;
  subject_id: string;
  is_active: boolean;
  points: number;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function QuestionManagement() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 50;
  
  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    type: 'MCQ_SINGLE' as 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'FILL_IN' | 'MATCHING' | 'ESSAY',
    options: ['', '', '', '', ''],
    correct_answer: '' as any,
    explanation: '',
    difficulty_level: 1,
    tags: [] as string[],
    subject_id: '',
    points: 1
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch when filters or page change
  useEffect(() => {
    fetchData();
  }, [currentPage, debouncedSearch, selectedSubject, selectedDifficulty]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subjects first (only on initial load)
      if (subjects.length === 0) {
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (subjectsError) {
          toast({ title: "Error", description: "Failed to load subjects: " + subjectsError.message, variant: "destructive" });
          setSubjects([]);
          setQuestions([]);
          return;
        }
        setSubjects(subjectsData || []);
      }

      // Fetch questions with server-side pagination & filtering
      const body: any = {
        activeOnly: true,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      };
      if (selectedSubject !== 'all') body.subject_id = selectedSubject;
      if (selectedDifficulty !== 'all') body.difficulty = selectedDifficulty;
      if (debouncedSearch.trim()) body.search = debouncedSearch.trim();

      const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-get-questions', { body });

      if (fnError) {
        throw new Error((fnError as any).message || 'Failed to fetch questions');
      }

      const result = fnData as any;
      setQuestions(result?.questions || []);
      setTotalCount(result?.count ?? 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to load questions", variant: "destructive" });
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!newQuestion.question_text.trim()) {
        throw new Error("Question text is required");
      }
      
      if (!newQuestion.subject_id) {
        throw new Error("Please select a subject");
      }
      
      if (newQuestion.type === 'MCQ_SINGLE') {
        const validOptions = newQuestion.options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
          throw new Error("Please provide at least 2 valid options");
        }
      }
      
      const questionData = {
        question_text: processQuestionText(newQuestion.question_text.trim()),
        type: newQuestion.type,
        options: newQuestion.type === 'MCQ_SINGLE' 
          ? processQuestionOptions(newQuestion.options.filter(opt => opt.trim() !== ''))
          : newQuestion.type === 'TRUE_FALSE' 
          ? ['True', 'False']
          : null,
        correct_answer: newQuestion.type === 'MCQ_SINGLE'
          ? newQuestion.correct_answer
          : newQuestion.type === 'TRUE_FALSE'
          ? (newQuestion.correct_answer === 0 ? 'True' : 'False')
          : newQuestion.options[0],
        explanation: processQuestionText(newQuestion.explanation.trim()),
        difficulty_level: newQuestion.difficulty_level,
        tags: Array.isArray(newQuestion.tags) ? newQuestion.tags : [],
        subject_id: newQuestion.subject_id,
        points: newQuestion.points,
        is_active: true
      };

      console.log('Creating question with data:', questionData);
      const { data, error } = await supabase.from('questions').insert(questionData).select();

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || "Failed to save question");
      }

      console.log('Question created successfully:', data);
      
      toast({
        title: "Success",
        description: "Question created successfully"
      });

      setIsCreateModalOpen(false);
      resetNewQuestion();
      fetchData();
      
    } catch (error) {
      console.error('Error creating question:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create question";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetNewQuestion = () => {
    setNewQuestion({
      question_text: '',
      type: 'MCQ_SINGLE' as 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'FILL_IN' | 'MATCHING' | 'ESSAY',
      options: ['', '', '', '', ''],
      correct_answer: '' as any,
      explanation: '',
      difficulty_level: 1,
      tags: [],
      subject_id: '',
      points: 1
    });
  };

  const handleDeleteAllQuestions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('admin_delete_all_questions');
      
      if (error) throw error;

      const result = data as { questions_deleted: number; attempt_answers_deleted: number };
      toast({
        title: "Success",
        description: `Deleted ${result.questions_deleted} questions and ${result.attempt_answers_deleted} related answers`
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting all questions:', error);
      toast({
        title: "Error",
        description: "Failed to delete all questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsViewModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion({
      question_text: question.question_text,
      type: question.type,
      options: question.options || {},
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      difficulty_level: question.difficulty_level,
      tags: question.tags || [],
      subject_id: question.subject_id,
      points: question.points
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      setLoading(true);

      // Validate required fields
      if (!newQuestion.question_text.trim()) {
        throw new Error("Question text is required");
      }
      
      if (!newQuestion.subject_id) {
        throw new Error("Subject is required");
      }

      // Prepare question data
      const questionData = {
        question_text: newQuestion.question_text.trim(),
        type: newQuestion.type,
        options: newQuestion.options,
        correct_answer: newQuestion.correct_answer,
        explanation: newQuestion.explanation?.trim() || null,
        difficulty_level: newQuestion.difficulty_level,
        tags: Array.isArray(newQuestion.tags) ? newQuestion.tags : [],
        subject_id: newQuestion.subject_id,
        points: newQuestion.points
      };

      const { error } = await supabase
        .from('questions')
        .update(questionData)
        .eq('id', editingQuestion.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question updated successfully"
      });

      setIsEditModalOpen(false);
      setEditingQuestion(null);
      resetNewQuestion();
      fetchData();
      
    } catch (error) {
      console.error('Error updating question:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update question";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateQuestion = async (question: Question) => {
    try {
      const duplicatedQuestion = {
        question_text: `${question.question_text} (Copy)`,
        type: question.type,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        difficulty_level: question.difficulty_level,
        tags: question.tags,
        subject_id: question.subject_id,
        points: question.points,
        is_active: true
      };

      const { error } = await supabase.from('questions').insert(duplicatedQuestion);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question duplicated successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error duplicating question:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate question",
        variant: "destructive"
      });
    }
  };

  const handleViewAnalytics = (question: Question) => {
    setSelectedQuestion(question);
    setIsAnalyticsModalOpen(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this question? This action cannot be undone and will remove all related data.')) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('delete_question_safely', { qid: questionId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question permanently deleted successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  // Server-side filtering now - questions are already filtered
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const activeQuestions = questions.filter(q => q.is_active);
  const inactiveQuestions = questions.filter(q => !q.is_active);

  const getDifficultyLabel = (level: number) => {
    switch(level) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  };

  const getDifficultyColor = (level: number) => {
    switch(level) {
      case 1: return 'bg-accent';
      case 2: return 'bg-warning';
      case 3: return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const renderQuestionList = (list: Question[]) => (
    <Card className="overflow-hidden">
      <CardContent className="p-2 sm:p-4">
        <div className="max-h-[600px] overflow-y-auto">
          <div className="space-y-3 sm:space-y-4 sm:pr-2">
            {list.map((question) => (
              <div key={question.id} className="rounded-lg border bg-card p-3 sm:p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className={`${getDifficultyColor(question.difficulty_level)} text-white text-[10px]`}>
                    {getDifficultyLabel(question.difficulty_level)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {question.type.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] max-w-[45vw] truncate sm:max-w-none">
                    {subjects.find(s => s.id === question.subject_id)?.name || 'Unknown'}
                  </Badge>
                  {!question.is_active && (
                    <Badge variant="destructive" className="text-[10px]">Inactive</Badge>
                  )}
                </div>

                <div className="mt-3 min-w-0 overflow-x-auto break-words">
                  <MathRenderer
                    content={question.question_text}
                    className="font-medium text-sm sm:text-base leading-relaxed"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
                  <span>{question.points} point{question.points !== 1 ? 's' : ''}</span>
                  <span>{new Date(question.created_at).toLocaleDateString()}</span>
                  {question.tags && Array.isArray(question.tags) && question.tags.length > 0 && (
                    <span className="break-all">Tags: {question.tags.join(', ')}</span>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-5 gap-1 border-t pt-2 sm:flex sm:justify-end">
                  <Button variant="ghost" size="sm" className="h-9 w-full sm:w-9 p-0" onClick={() => handleViewQuestion(question)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-full sm:w-9 p-0" onClick={() => handleEditQuestion(question)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-full sm:w-9 p-0" onClick={() => handleDuplicateQuestion(question)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-full sm:w-9 p-0" onClick={() => handleViewAnalytics(question)}>
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-full sm:w-9 p-0" onClick={() => handleDeleteQuestion(question.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-5 max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Question Bank Management</h2>
            <p className="text-sm text-muted-foreground">Create, upload, and manage examination questions</p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:flex-wrap [&_button]:w-full [&_button]:text-xs sm:[&_button]:text-sm sm:[&_button]:w-auto">

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Database className="w-4 h-4 mr-2" />
                  Delete All Questions
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all questions from the database.
                    You currently have {questions.length} questions that will be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllQuestions} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete All Questions
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload Questions
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] h-[80vh] max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Bulk Upload WAEC/JAMB Questions</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden min-h-0">
                  <SimpleBulkUpload 
                    subjects={subjects} 
                    onUploadComplete={() => {
                      setIsBulkUploadOpen(false);
                      fetchData();
                    }} 
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Single Question
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-[700px] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Create New Question</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                  <div className="space-y-4 p-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Select value={newQuestion.subject_id} onValueChange={(value) => setNewQuestion({...newQuestion, subject_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.length > 0 ? (
                              subjects.map(subject => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name} ({subject.code})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No subjects available - Please create subjects first
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="type">Question Type</Label>
                        <Select value={newQuestion.type} onValueChange={(value: any) => setNewQuestion({...newQuestion, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MCQ_SINGLE">Multiple Choice (Single)</SelectItem>
                            <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                            <SelectItem value="ESSAY">Essay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="question">Question Text</Label>
                      <Textarea
                        id="question"
                        value={newQuestion.question_text}
                        onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                        placeholder="Enter your question..."
                        className="min-h-[100px]"
                      />
                    </div>

                    {newQuestion.type === 'MCQ_SINGLE' && (
                      <div className="space-y-3">
                        <Label>Options</Label>
                        {['A', 'B', 'C', 'D'].map((letter, index) => (
                          <div key={letter} className="flex items-center space-x-2">
                            <Label className="w-8">{letter}.</Label>
                            <Input
                              value={newQuestion.options[index]}
                              onChange={(e) => {
                                const newOptions = [...newQuestion.options];
                                newOptions[index] = e.target.value;
                                setNewQuestion({...newQuestion, options: newOptions});
                              }}
                              placeholder={`Option ${letter}`}
                            />
                            <input
                              type="radio"
                              name="correct"
                              checked={newQuestion.correct_answer === index}
                              onChange={() => setNewQuestion({...newQuestion, correct_answer: index})}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="explanation">Explanation</Label>
                      <Textarea
                        id="explanation"
                        value={newQuestion.explanation}
                        onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                        placeholder="Explain why this answer is correct..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select value={newQuestion.difficulty_level.toString()} onValueChange={(value) => setNewQuestion({...newQuestion, difficulty_level: parseInt(value)})}>
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
                          min="1"
                          max="10"
                          value={newQuestion.points}
                          onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value) || 1})}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateQuestion} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Question'}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold text-primary">{totalCount}</p>
                </div>
                <BookOpen className="w-6 h-6 shrink-0 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Filtered Results</p>
                  <p className="text-2xl font-bold text-accent">{activeQuestions.length}</p>
                </div>
                <CheckCircle className="w-6 h-6 shrink-0 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Active Subjects</p>
                  <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
                </div>
                <BookOpen className="w-6 h-6 shrink-0 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Questions by Subject (Database Totals)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {subjects.map(subject => {
                const subjectQuestions = questions.filter(q => q.subject_id === subject.id);
                return (
                  <div key={subject.id} className="text-center p-3 border rounded-lg">
                    <p className="font-medium text-sm">{subject.name}</p>
                    <p className="text-2xl font-bold text-primary">{subjectQuestions.length}</p>
                    <p className="text-xs text-muted-foreground">{subject.code}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">


              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 items-center">
                <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setCurrentPage(0); }}>
                  <SelectTrigger className="flex-1 sm:w-40">

                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={(v) => { setSelectedDifficulty(v); setCurrentPage(0); }}>
                  <SelectTrigger className="flex-1 sm:w-32">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1">Easy</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {totalCount > PAGE_SIZE && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} of {totalCount} questions
                </p>
                <div className="flex items-center justify-between sm:justify-end gap-2">

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0 || loading}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium px-2">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages - 1 || loading}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        <Tabs defaultValue="active" className="space-y-4">
          <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto">
          <TabsList className="w-max min-w-full justify-start">

            <TabsTrigger value="active">
              Active Questions ({activeQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactive Questions ({inactiveQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="upload">
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="latex">
              LaTeX Tools
            </TabsTrigger>
            <TabsTrigger value="cleanup">
              Question Cleanup
            </TabsTrigger>
            <TabsTrigger value="import">
              API Import
            </TabsTrigger>
          </TabsList>
          </div>


          <TabsContent value="active">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium">Loading questions...</h3>
                </CardContent>
              </Card>
            ) : activeQuestions.length > 0 ? (
              renderQuestionList(activeQuestions)
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Questions</h3>
                  <p className="text-muted-foreground mb-4">Start by uploading questions using the bulk upload feature.</p>
                  <Button onClick={() => setIsBulkUploadOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload Questions
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inactive">
            {inactiveQuestions.length > 0 ? (
              renderQuestionList(inactiveQuestions)
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Inactive Questions</h3>
                  <p className="text-muted-foreground">All questions are currently active.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <SimpleBulkUpload subjects={subjects} onUploadComplete={fetchData} />
          </TabsContent>

          <TabsContent value="latex">
            <div className="space-y-6">
              <LatexConverter />
            </div>
          </TabsContent>

          <TabsContent value="cleanup">
            <QuestionCleanup />
          </TabsContent>

          <TabsContent value="import">
            <ExternalQuestionImport />
          </TabsContent>
        </Tabs>

        {/* View Question Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Question</DialogTitle>
            </DialogHeader>
            {selectedQuestion && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Question Text</Label>
                  <div className="mt-1 p-3 border rounded-md bg-muted">
                    <MathRenderer content={selectedQuestion.question_text} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="mt-1 text-sm">{selectedQuestion.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Difficulty</Label>
                    <p className="mt-1 text-sm">{selectedQuestion.difficulty_level}/5</p>
                  </div>
                </div>

                {selectedQuestion.options && typeof selectedQuestion.options === 'object' && (
                  <div>
                    <Label className="text-sm font-medium">Options</Label>
                    <div className="mt-1 space-y-2">
                      {Object.entries(selectedQuestion.options).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Badge variant={selectedQuestion.correct_answer === key ? "default" : "outline"}>
                            {key.toUpperCase()}
                          </Badge>
                          <span className="text-sm">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuestion.explanation && (
                  <div>
                    <Label className="text-sm font-medium">Explanation</Label>
                    <div className="mt-1 p-3 border rounded-md bg-muted">
                      <MathRenderer content={selectedQuestion.explanation} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setEditingQuestion(null);
            resetNewQuestion();
          }
        }}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[700px] sm:w-full">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={newQuestion.subject_id} onValueChange={(value) => setNewQuestion({...newQuestion, subject_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.length > 0 ? (
                          subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No subjects available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Question Type</Label>
                    <Select value={newQuestion.type} onValueChange={(value: any) => setNewQuestion({...newQuestion, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MCQ_SINGLE">Multiple Choice (Single)</SelectItem>
                        <SelectItem value="MCQ_MULTI">Multiple Choice (Multi)</SelectItem>
                        <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                        <SelectItem value="FILL_IN">Fill in the Blank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="question">Question Text</Label>
                  <Textarea
                    id="question"
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    placeholder="Enter your question here..."
                    rows={4}
                  />
                </div>

                {(newQuestion.type === 'MCQ_SINGLE' || newQuestion.type === 'MCQ_MULTI') && (
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {['A', 'B', 'C', 'D', 'E'].map((letter, index) => (
                        <div key={letter} className="flex items-center space-x-2">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                            {letter}
                          </Badge>
                          <Input
                            value={newQuestion.options[letter] || ''}
                            onChange={(e) => setNewQuestion({
                              ...newQuestion, 
                              options: {...newQuestion.options, [letter]: e.target.value}
                            })}
                            placeholder={`Option ${letter}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Label>Correct Answer</Label>
                      <Select 
                        value={String(newQuestion.correct_answer)} 
                        onValueChange={(value) => setNewQuestion({...newQuestion, correct_answer: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'C', 'D', 'E'].map(letter => (
                            <SelectItem key={letter} value={letter}>
                              Option {letter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="explanation">Explanation</Label>
                  <Textarea
                    id="explanation"
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    placeholder="Explain why this answer is correct..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select value={newQuestion.difficulty_level.toString()} onValueChange={(value) => setNewQuestion({...newQuestion, difficulty_level: parseInt(value)})}>
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
                      min="1"
                      max="10"
                      value={newQuestion.points}
                      onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateQuestion} disabled={loading}>
                    {loading ? 'Updating...' : 'Update Question'}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Analytics Modal */}
        <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Question Analytics</DialogTitle>
            </DialogHeader>
            {selectedQuestion && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Attempts</p>
                          <p className="text-2xl font-bold">-</p>
                        </div>
                        <Eye className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Correct Rate</p>
                          <p className="text-2xl font-bold">-</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Time</p>
                          <p className="text-2xl font-bold">-</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Difficulty</p>
                          <p className="text-2xl font-bold">{selectedQuestion.difficulty_level}/5</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    Detailed analytics will be available once students start attempting this question.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}