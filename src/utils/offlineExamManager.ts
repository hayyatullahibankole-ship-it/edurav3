import { supabase } from '@/integrations/supabase/client';
import { normalizeExamBody } from '@/lib/examBody';
import { offlineStorage, OfflineExam, OfflineQuestion } from './offlineStorage';

export class OfflineExamManager {
  /**
   * Download an exam for offline use
   */
  static async downloadExamForOffline(
    examType: string,
    subjectIds: string[],
    questionsPerSubject: number = 10
  ): Promise<string> {
    try {
      // Fetch questions for the subjects
      const { data: questions, error } = await supabase
        .rpc('get_random_questions_for_subjects', {
          subject_ids: subjectIds,
          per_subject_count: questionsPerSubject,
          target_exam_body: normalizeExamBody(examType) ?? null,
        });

      if (error) throw error;

      // Create offline exam object
      const examId = `offline-${examType}-${Date.now()}`;
      const exam: OfflineExam = {
        id: examId,
        examType,
        questions: questions.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options,
          type: q.type,
          subject_id: q.subject_id,
          difficulty_level: q.difficulty_level,
          points: q.points,
          tags: q.tags,
        })),
        downloadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      // Save to IndexedDB
      await offlineStorage.saveExam(exam);

      return examId;
    } catch (error) {
      console.error('Error downloading exam:', error);
      throw error;
    }
  }

  /**
   * Get available offline exams
   */
  static async getAvailableOfflineExams(): Promise<OfflineExam[]> {
    try {
      const exams = await offlineStorage.getAllExams();
      const now = new Date();
      
      // Filter out expired exams
      return exams.filter(exam => new Date(exam.expiresAt) > now);
    } catch (error) {
      console.error('Error getting offline exams:', error);
      return [];
    }
  }

  /**
   * Start an offline exam attempt
   */
  static async startOfflineAttempt(examId: string): Promise<string> {
    try {
      const exam = await offlineStorage.getExam(examId);
      if (!exam) throw new Error('Exam not found');

      const attemptId = `offline-attempt-${Date.now()}`;
      await offlineStorage.saveAttempt({
        id: attemptId,
        examId,
        answers: {},
        startedAt: new Date().toISOString(),
        status: 'IN_PROGRESS',
        syncStatus: 'PENDING',
      });

      return attemptId;
    } catch (error) {
      console.error('Error starting offline attempt:', error);
      throw error;
    }
  }

  /**
   * Save an answer for an offline attempt
   */
  static async saveOfflineAnswer(
    attemptId: string,
    questionId: string,
    answer: any
  ): Promise<void> {
    try {
      const attempt = await offlineStorage.getAttempt(attemptId);
      if (!attempt) throw new Error('Attempt not found');

      attempt.answers[questionId] = answer;
      await offlineStorage.saveAttempt(attempt);
    } catch (error) {
      console.error('Error saving offline answer:', error);
      throw error;
    }
  }

  /**
   * Complete an offline attempt
   */
  static async completeOfflineAttempt(attemptId: string): Promise<void> {
    try {
      const attempt = await offlineStorage.getAttempt(attemptId);
      if (!attempt) throw new Error('Attempt not found');

      attempt.status = 'COMPLETED';
      await offlineStorage.saveAttempt(attempt);
    } catch (error) {
      console.error('Error completing offline attempt:', error);
      throw error;
    }
  }

  /**
   * Delete an offline exam
   */
  static async deleteOfflineExam(examId: string): Promise<void> {
    try {
      await offlineStorage.deleteExam(examId);
    } catch (error) {
      console.error('Error deleting offline exam:', error);
      throw error;
    }
  }
}
