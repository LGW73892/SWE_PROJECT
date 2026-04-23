import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  getCurrentPlan,
  isAuthenticated,
  PlanData,
  setQuestionAnswered,
} from "../lib/api";

export function Practice() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated()) {
        setError("Please sign up or login first.");
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      try {
        const currentPlan = await getCurrentPlan();
        setPlan(currentPlan);
        setAnsweredIds(new Set(currentPlan.answeredQuestionIds));
        setOpenPhases(
          new Set(currentPlan.phases.map((phase) => phase.id)),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load questions");
        setNeedsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const toggleAnswered = async (questionId: string) => {
    const next = new Set(answeredIds);
    const currentlyAnswered = next.has(questionId);
    if (currentlyAnswered) {
      next.delete(questionId);
    } else {
      next.add(questionId);
    }
    setAnsweredIds(next);

    try {
      const updated = await setQuestionAnswered(questionId, !currentlyAnswered);
      setPlan(updated);
      setAnsweredIds(new Set(updated.answeredQuestionIds));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update question");
      setAnsweredIds(answeredIds);
    }
  };

  const answeredCount =
    plan?.questions.filter((q) => answeredIds.has(q.id)).length ?? 0;
  const completionRate =
    (plan?.questions.length ?? 0) > 0
      ? Math.round((answeredCount / (plan?.questions.length ?? 0)) * 100)
      : 0;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        Loading practice questions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{error}</p>
          {needsAuth && (
            <Link
              to="/auth"
              className="mt-3 inline-flex rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-[#fffaf0] transition-colors hover:bg-emerald-800"
            >
              Go to Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "medium":
        return "bg-amber-100 text-stone-700 border-amber-200";
      case "hard":
        return "bg-stone-300 text-stone-800 border-stone-400";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const togglePhaseOpen = (phaseId: string) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">
          Practice Questions
        </h1>
        <p className="text-stone-600">
          Questions are grouped by plan phase and aligned to each section.
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-emerald-900/10 bg-[#fffaf0]/90 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">
            Questions Practiced: {answeredCount} / {plan.questions.length}
          </span>
          <span className="text-sm font-semibold text-emerald-900">
            {completionRate}%
          </span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3">
          <div
            className="bg-emerald-900 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {plan.phases.map((phase, phaseIndex) => {
          const phaseQuestions = plan.questions.filter(
            (question) => question.phaseId === phase.id,
          );
          const completedInPhase = phaseQuestions.filter((q) =>
            answeredIds.has(q.id),
          ).length;
          const isOpen = openPhases.has(phase.id);

          return (
            <div
              key={phase.id}
              className="rounded-2xl border border-emerald-900/10 bg-[#fffaf0]/90 p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">
                    Phase {phaseIndex + 1}: {phase.title}
                  </h2>
                  <p className="text-sm text-stone-600">
                    {completedInPhase} / {phaseQuestions.length} questions
                    completed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePhaseOpen(phase.id)}
                  aria-label={isOpen ? "Collapse phase" : "Expand phase"}
                  className="rounded-full border border-emerald-900/20 bg-white p-2 text-emerald-900 hover:bg-emerald-50"
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isOpen && <div className="space-y-4">
                {phaseQuestions.map((question) => {
                  const isExpanded = expandedQuestion === question.id;

                  return (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-emerald-900/10 bg-white/80 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleAnswered(question.id)}
                            className="mt-1 flex-shrink-0"
                          >
                            {answeredIds.has(question.id) ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <Circle className="w-6 h-6 text-emerald-900/30" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h3 className="font-semibold text-stone-900 text-lg">
                                {question.question}
                              </h3>
                              <button
                                onClick={() =>
                                  setExpandedQuestion(
                                    isExpanded ? null : question.id,
                                  )
                                }
                                className="flex-shrink-0 text-emerald-900 hover:text-emerald-700"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {question.category}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full border ${getDifficultyColor(question.difficulty)}`}
                              >
                                {question.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-stone-900 mb-3">
                              💡 Tips:
                            </h4>
                            <ul className="space-y-2">
                              {question.tips.map((tip, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-stone-700"
                                >
                                  <span className="text-emerald-900 mt-1">
                                    •
                                  </span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>}
            </div>
          );
        })}
      </div>

      {plan.questions.length === 0 && (
        <div className="text-center py-12 bg-[#fffaf0]/90 rounded-2xl shadow-sm border border-emerald-900/10">
          <p className="text-stone-600">No questions available yet.</p>
        </div>
      )}
    </div>
  );
}
