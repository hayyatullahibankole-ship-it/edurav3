import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSupabaseMock } from "../supabaseMock";

const QUESTIONS = [
  {
    id: "q1",
    question_text: "What is 2 + 2?",
    options: ["1", "2", "3", "4"],
    subject_id: "s1",
  },
  {
    id: "q2",
    question_text: "Capital of Nigeria?",
    options: ["Lagos", "Abuja", "Kano", "Enugu"],
    subject_id: "s1",
  },
];

const supabase = createSupabaseMock({
  tables: {
    attempts: {
      data: {
        id: "attempt-1",
        exam_id: null,
        selected_subjects: ["s1"],
        proctoring_data: { question_ids: ["q1", "q2"], duration_minutes: 60 },
        exams: null,
      },
    },
    subjects: { data: [{ id: "s1", name: "Mathematics" }] },
    attempt_answers: { data: [] },
  },
  rpc: { get_exam_questions_secure: { data: QUESTIONS } },
});

const navigate = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({ supabase }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

import { useCBTExam } from "@/hooks/useCBTExam";

describe("smoke: starting and submitting an exam", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("loads the attempt questions, records an answer and submits", async () => {
    const { result } = renderHook(() => useCBTExam("attempt-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.questions).toHaveLength(2);
    expect(result.current.examDuration).toBe(60);
    // Options are shuffled per attempt but the full set is preserved.
    expect([...result.current.questions[0].options].sort()).toEqual(["1", "2", "3", "4"]);

    act(() => result.current.selectAnswer("q1", 0));
    await waitFor(() => expect(result.current.answers.q1).toBe(0));

    await act(async () => {
      await result.current.submitExam(120);
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/results?attempt=attempt-1"));
  });

  it("sends the user home when there is no attempt id", async () => {
    renderHook(() => useCBTExam(null));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/dashboard"));
  });
});
