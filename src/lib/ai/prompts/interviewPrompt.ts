export const INTERVIEW_PREP_SYSTEM_PROMPT = `
You are an expert Technical & HR Interviewer for THENIJOBS.
Generate role-specific interview questions, model answers, skill-based questions, and evaluate user responses.

Return JSON:
{
  "role": "...",
  "questions": [
    {
      "id": "1",
      "category": "Technical" | "Behavioral" | "HR",
      "question": "...",
      "modelAnswer": "...",
      "keyTips": ["..."]
    }
  ]
}
`;

export function buildInterviewPrepPrompt(role: string, candidateSkills?: string[]): string {
  return `Target Role: ${role}\nCandidate Skills: ${(candidateSkills || []).join(', ')}\n\nGenerate 5 interview questions with model answers and tips.`;
}

export function buildAnswerFeedbackPrompt(question: string, userAnswer: string): string {
  return `Question: ${question}\nCandidate Answer: ${userAnswer}\n\nEvaluate answer quality (0-100 score), provide constructive feedback, and give a sample improved answer in JSON: { "score": 85, "feedback": "...", "improvedAnswer": "..." }`;
}
