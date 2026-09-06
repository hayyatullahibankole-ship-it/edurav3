import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  CheckCircle, 
  Loader2,
  Sparkles,
  Copy,
  FileText,
  Download,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
}

interface SimpleBulkUploadProps {
  subjects: Subject[];
  onUploadComplete: () => void;
}

export default function SimpleBulkUpload({ subjects, onUploadComplete }: SimpleBulkUploadProps) {
  const { toast } = useToast();
  const [questionsText, setQuestionsText] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    duplicates?: number;
    errors: string[];
  } | null>(null);

  // Debug logging
  console.log('SimpleBulkUpload component loaded');
  console.log('Subjects prop:', subjects);

  if (!subjects) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading subjects...</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No subjects available. Please create subjects first.</p>
      </div>
    );
  }

  const parseQuestionsText = (text: string): any[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const questions = [];
    
    let currentQuestion = null;
    
    for (let line of lines) {
      line = line.trim();
      
      // Check if this line starts a new question (contains a question mark or starts with a number)
      if (line.match(/^\d+[.)]\s*/) || line.includes('?') || (!currentQuestion && line.length > 10)) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.question_text && currentQuestion.options.length >= 4) {
          questions.push(currentQuestion);
        }
        
        // Start new question
        currentQuestion = {
          question_text: line.replace(/^\d+[.)]\s*/, '').trim(),
          options: [],
          correct_answer: null,
          explanation: null
        };
      } else if (line.match(/^[A-E][.)]\s*/)) {
        // This is an option
        if (currentQuestion) {
          const optionText = line.replace(/^[A-E][.)]\s*/, '').trim();
          currentQuestion.options.push(optionText);
        }
      } else if (line.toLowerCase().includes('answer:') || line.toLowerCase().includes('correct:')) {
        if (currentQuestion) {
          const answerPart = line.split(/(?:answer:|correct:)\s*/i)[1]?.trim();
          if (answerPart) {
            const match = answerPart.match(/^(?:option\s+)?([A-E])[\s.)\]:]?/i) || answerPart.match(/^([A-E])[\s.)\]:]?/i);
            if (match && match[1]) {
              currentQuestion.correct_answer = match[1].toUpperCase();
              console.log(`Extracted answer: ${currentQuestion.correct_answer} from line: "${line}"`);
            } else {
              console.warn(`Could not extract answer from: "${line}"`);
            }
          }
        }
      } else if (line.toLowerCase().includes('explanation:')) {
        // This is an explanation
        if (currentQuestion) {
          currentQuestion.explanation = line.replace(/explanation:\s*/i, '').trim();
        }
      } else if (currentQuestion && line.length > 0) {
        // Continuation of question text or explanation
        if (currentQuestion.options.length === 0) {
          currentQuestion.question_text += ' ' + line;
        } else if (!currentQuestion.correct_answer) {
          // Could be part of last option
          if (currentQuestion.options.length > 0) {
            currentQuestion.options[currentQuestion.options.length - 1] += ' ' + line;
          }
        }
      }
    }
    
    // Add the last question
    if (currentQuestion && currentQuestion.question_text && currentQuestion.options.length >= 4) {
      questions.push(currentQuestion);
    }
    
    return questions;
  };

  const parseCSVFile = (csvContent: string): any[] => {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length < 6) continue; // Skip invalid rows
      
      const questionObj: any = {
        question_text: '',
        options: [],
        correct_answer: null,
        explanation: '',
        image_url: ''
      };
      
      // Map CSV columns to question properties
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        if (header.includes('image') || header.includes('diagram')) {
          questionObj.image_url = value;
        } else if (header.includes('question')) {
          questionObj.question_text = value;
        } else if (header.includes('option') || header.includes('choice')) {
          if (header.includes('a') || header.includes('1')) questionObj.options[0] = value;
          else if (header.includes('b') || header.includes('2')) questionObj.options[1] = value;
          else if (header.includes('c') || header.includes('3')) questionObj.options[2] = value;
          else if (header.includes('d') || header.includes('4')) questionObj.options[3] = value;
        } else if (header.includes('answer') || header.includes('correct')) {
          // Handle both letter (A,B,C,D) and number (0,1,2,3) formats
          const answerValue = value.toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(answerValue)) {
            questionObj.correct_answer = answerValue;
          } else if (['0', '1', '2', '3'].includes(answerValue)) {
            questionObj.correct_answer = ['A', 'B', 'C', 'D'][parseInt(answerValue)];
          }
        } else if (header.includes('explanation') || header.includes('solution')) {
          questionObj.explanation = value;
        }
      });
      
      // Validate question has minimum required fields
      if (questionObj.question_text && questionObj.options.filter(o => o).length >= 4 && questionObj.correct_answer) {
        questions.push(questionObj);
      }
    }
    
    return questions;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }
    
    setUploadFile(file);
  };

  const handleUpload = async () => {
    if ((!questionsText.trim() && !uploadFile) || !selectedSubject) {
      toast({
        title: "Missing Information",
        description: "Please provide questions (text or file) and select a subject",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      // First, get existing questions to check for duplicates
      console.log('Fetching existing questions for duplicate detection...');
      const { data: existingQuestions, error: fetchError } = await supabase
        .from('questions')
        .select('question_text')
        .eq('subject_id', selectedSubject);
      
      if (fetchError) {
        throw new Error(`Failed to fetch existing questions: ${fetchError.message}`);
      }

      // Create a Set for O(1) duplicate checking
      const existingQuestionTexts = new Set(
        existingQuestions?.map(q => q.question_text.trim().toLowerCase()) || []
      );

      let questions: any[] = [];
      
      if (uploadFile) {
        // Handle CSV file upload
        const fileContent = await uploadFile.text();
        questions = parseCSVFile(fileContent);
      } else {
        // Handle text upload
        questions = parseQuestionsText(questionsText);
      }
      
      if (questions.length === 0) {
        throw new Error("No valid questions found in the input");
      }

      let successCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;
      const errors: string[] = [];
      const usedQuestions = new Set<string>(); // Prevent duplicates within upload

      // Process questions in batches
      const batchSize = 10;
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        
        for (const questionData of batch) {
          try {
            const questionKey = questionData.question_text.trim().toLowerCase();
            
            // Check for duplicates within current upload
            if (usedQuestions.has(questionKey)) {
              duplicateCount++;
              console.log(`Skipping duplicate within upload: ${questionData.question_text.substring(0, 50)}...`);
              continue;
            }

            // Check for duplicates against existing questions in database
            if (existingQuestionTexts.has(questionKey)) {
              duplicateCount++;
              console.log(`Skipping duplicate from database: ${questionData.question_text.substring(0, 50)}...`);
              continue;
            }

            usedQuestions.add(questionKey);

            // Validate correct answer
            const correctIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(questionData.correct_answer);
            if (correctIndex === -1 || correctIndex >= questionData.options.length) {
              throw new Error(`Invalid correct answer: ${questionData.correct_answer} for question starting with: ${questionData.question_text.substring(0, 50)}...`);
            }

            const { error } = await supabase
              .from('questions')
              .insert({
                question_text: questionData.question_text,
                type: 'MCQ_SINGLE',
                options: questionData.options,
                correct_answer: correctIndex.toString(),
                explanation: questionData.explanation,
                media_urls: questionData.image_url ? [{ url: questionData.image_url }] : [],
                subject_id: selectedSubject,
                difficulty_level: 1,
                points: 1,
                is_active: true
              });

            if (error) throw error;
            successCount++;
          } catch (error: any) {
            failedCount++;
            errors.push(`Row ${i + failedCount + successCount}: ${error.message}`);
          }
        }
        
        // Update progress
        setUploadProgress((i + batchSize) / questions.length * 100);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX
      }

      setUploadResults({
        success: successCount,
        failed: failedCount,
        duplicates: duplicateCount,
        errors: errors.slice(0, 10) // Show first 10 errors only
      });

      if (successCount > 0) {
        toast({
          title: "Upload Complete!",
          description: `Successfully imported ${successCount} new questions. ${duplicateCount} duplicates were skipped.`,
        });
        onUploadComplete();
      } else if (duplicateCount > 0) {
        toast({
          title: "No New Questions",
          description: `All ${duplicateCount} questions were duplicates and were skipped.`,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setQuestionsText('');
    setSelectedSubject('');
    setUploadFile(null);
    setUploadResults(null);
    // Reset file input
    const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const copyWAECTemplate = () => {
    const waecTemplate = `1. Find the value of x in the equation 3x + 7 = 22
A) 5
B) 4
C) 6
D) 3
Answer: A
Explanation: 3x = 22 - 7 = 15, therefore x = 15/3 = 5

2. Which of the following gases turns moist red litmus paper blue?
A) Sulphur dioxide
B) Ammonia
C) Hydrogen chloride
D) Carbon dioxide
Answer: B
Explanation: Ammonia (NH₃) is basic and turns red litmus paper blue. It dissolves in water to form ammonium hydroxide.

3. The system of government practiced in Nigeria is
A) Unitary
B) Federal
C) Confederate
D) Parliamentary
Answer: B
Explanation: Nigeria operates a federal system of government where power is shared between the federal government and the 36 states.

4. In photosynthesis, the raw materials required are
A) Water and carbon dioxide
B) Water and oxygen
C) Oxygen and carbon dioxide
D) Glucose and water
Answer: A
Explanation: Plants use water (H₂O) and carbon dioxide (CO₂) as raw materials in the presence of chlorophyll and sunlight to produce glucose.`;

    navigator.clipboard.writeText(waecTemplate).then(() => {
      toast({
        title: "WAEC Template Copied!",
        description: "Authentic WAEC-style question template copied to clipboard",
      });
    });
  };

  const copyJAMBTemplate = () => {
    const jambTemplate = `1. If log₁₀ 2 = 0.3010, find the value of log₁₀ 20
A) 0.6020
B) 1.3010
C) 0.9030
D) 2.3010
Answer: B
Explanation: log₁₀ 20 = log₁₀(2 × 10) = log₁₀ 2 + log₁₀ 10 = 0.3010 + 1 = 1.3010

2. A projectile is fired at an angle of 30° to the horizontal with an initial velocity of 40 m/s. Calculate the maximum height reached. [g = 10 m/s²]
A) 20 m
B) 40 m
C) 60 m
D) 80 m
Answer: A
Explanation: Maximum height = (u²sin²θ)/(2g) = (40² × sin²30°)/(2 × 10) = (1600 × 0.25)/20 = 20 m

3. Which of the following compounds exhibits both ionic and covalent bonding?
A) NaCl
B) NH₄Cl
C) MgO
D) CO₂
Answer: B
Explanation: NH₄Cl contains ionic bonding between NH₄⁺ and Cl⁻ ions, and covalent bonding within the NH₄⁺ ion.

4. The economic system where the means of production are privately owned is called
A) Socialism
B) Capitalism
C) Mixed economy
D) Command economy
Answer: B
Explanation: Capitalism is an economic system characterized by private ownership of the means of production and operation for profit.`;

    navigator.clipboard.writeText(jambTemplate).then(() => {
      toast({
        title: "JAMB Template Copied!",
        description: "Authentic JAMB-style question template copied to clipboard",
      });
    });
  };

  return (
    <Card className="h-full flex flex-col min-h-0">
      {/* Static Header */}
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-accent" />
          <CardTitle className="text-xl">WAEC/JAMB Question Import</CardTitle>
        </div>
      </CardHeader>

      {/* Scrollable Content */}
      <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <Alert className="border-accent/20 bg-accent/5">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">✅ Smart Duplicate Detection</p>
                  <p className="text-sm">Upload questions safely with built-in duplicate prevention:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>Preserves Existing:</strong> No data loss - keeps all current questions</li>
                    <li>• <strong>Detects Duplicates:</strong> Automatically skips questions already in database</li>
                    <li>• <strong>Quality Control:</strong> Only adds new, unique questions</li>
                    <li>• <strong>Safe Upload:</strong> No risk of losing existing content</li>
                  </ul>
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <strong>💡 Smart Feature:</strong> The system compares question text to detect duplicates, ensuring only fresh content is added.
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="border-warning/20 bg-warning/5">
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Sources for Authentic Past Questions:</p>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>WAEC:</strong> Official WAEC website (waec.org.ng) - Past Question Papers</li>
                    <li>• <strong>JAMB:</strong> Official JAMB website (jamb.gov.ng) - Past Questions & Answers</li>
                    <li>• <strong>Libraries:</strong> University/School libraries with archived question papers</li>
                    <li>• <strong>Educational Publishers:</strong> Macmillan, Longman, Evans past question books</li>
                    <li>• <strong>Online Platforms:</strong> MySchool, Prepclass, Edudelight past questions</li>
                  </ul>
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <strong>⚠️ Important:</strong> Always verify questions are from official sources. 
                    Ensure you have proper licensing for commercial use of past questions.
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Upload Method Tabs */}
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Text Format</TabsTrigger>
                <TabsTrigger value="csv">CSV File</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyWAECTemplate}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy WAEC Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyJAMBTemplate}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy JAMB Template
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="questionsText">Questions (Text Format)</Label>
                  <Textarea
                    id="questionsText"
                    placeholder="Paste your WAEC/JAMB questions here in the format shown above..."
                    value={questionsText}
                    onChange={(e) => setQuestionsText(e.target.value)}
                    className="min-h-[300px]"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="csv" className="space-y-4">
                <Alert className="border-accent/20 bg-accent/5">
                  <Download className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium">CSV Format Requirements:</p>
                      <p className="text-sm">Your CSV should have these columns (case insensitive):</p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• <strong>question</strong> or <strong>question_text</strong></li>
                        <li>• <strong>option_a, option_b, option_c, option_d</strong> (or choice_a, choice_b, etc.)</li>
                        <li>• <strong>correct_answer</strong> (A, B, C, D or 0, 1, 2, 3)</li>
                        <li>• <strong>explanation</strong> (optional)</li>
                        <li>• <strong>image_url</strong> or <strong>diagram_url</strong> (optional link to a diagram image)</li>
                      </ul>
                      
                      <div className="mt-3 pt-3 border-t border-accent/20">
                        <p className="font-medium text-sm">📐 Mathematical Formulas Support:</p>
                        <p className="text-xs">Use LaTeX syntax for mathematical expressions in questions and options:</p>
                        <ul className="text-xs space-y-1 ml-4 mt-1">
                          <li>• Inline math: {"$x^2 + y^2 = z^2$"}</li>
                          <li>• Block math: {"$$\\frac{a}{b} = \\frac{c}{d}$$"}</li>
                          <li>• Fractions: {"\\frac{numerator}{denominator}"}</li>
                          <li>• Exponents: {"x^{2}"}, Subscripts: {"H_{2}O"}</li>
                          <li>• Square roots: {"\\sqrt{x}"}, {"\\sqrt[3]{x}"}</li>
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Label htmlFor="csvFile">Upload CSV File</Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="csvFileInput"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="flex-1 p-3 border rounded-lg bg-background"
                    />
                    {uploadFile && (
                      <Badge variant="secondary">{uploadFile.name}</Badge>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Subject Selection */}
            <div className="space-y-3">
              <Label>Select Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
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

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing questions...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Upload Results */}
            {uploadResults && (
              <Alert className={uploadResults.success > 0 ? "border-accent/20 bg-accent/5" : "border-destructive/20 bg-destructive/5"}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex gap-4 flex-wrap">
                      <Badge variant="secondary">✅ Success: {uploadResults.success}</Badge>
                      {uploadResults.failed > 0 && (
                        <Badge variant="destructive">❌ Failed: {uploadResults.failed}</Badge>
                      )}
                      {uploadResults.duplicates !== undefined && uploadResults.duplicates > 0 && (
                        <Badge variant="outline">🔄 Duplicates Skipped: {uploadResults.duplicates}</Badge>
                      )}
                    </div>
                    
                    {uploadResults.errors.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer font-medium text-sm">Show Errors ({uploadResults.errors.length})</summary>
                        <div className="mt-1 text-xs space-y-1">
                          {uploadResults.errors.map((error, index) => (
                            <div key={index} className="text-destructive">{error}</div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Format Instructions */}
            <div className="text-xs text-muted-foreground space-y-2">
              <div>
                <p><strong>Supported Text Formats:</strong></p>
                <p>• Standard WAEC/JAMB format with numbered questions</p>
                <p>• Options labeled as A), B), C), D) or A., B., C., D.</p>
                <p>• Answer specified as "Answer: A" or "Correct: A"</p>
                <p>• Optional explanations as "Explanation: [detailed solution]"</p>
                <p>• Leave blank lines between questions for better parsing</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      {/* Static Footer with Action Buttons */}
      <div className="flex-shrink-0 p-6 border-t bg-card">
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={(!questionsText.trim() && !uploadFile) || !selectedSubject || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Questions
              </>
            )}
          </Button>
          <Button variant="outline" onClick={resetUpload} disabled={isUploading}>
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}