import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Filter,
} from "lucide-react";
import {
  getCurrentPlan,
  isAuthenticated,
  PracticeQuestion,
  setQuestionAnswered,
} from "../lib/api";

export function Practice() {
  const [interviewType, setInterviewType] = useState<string>("");
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
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
        const plan = await getCurrentPlan();
        setInterviewType(plan.interviewType);
        setQuestions(plan.questions);
        setAnsweredIds(new Set(plan.answeredQuestionIds));
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
      setAnsweredIds(new Set(updated.answeredQuestionIds));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update question");
      setAnsweredIds(answeredIds);
    }
  };

  const categories = Array.from(new Set(questions.map((q) => q.category)));

  const filteredQuestions = questions.filter((q) => {
    if (filterCategory !== "all" && q.category !== filterCategory) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty)
      return false;
    return true;
  });

  const answeredCount = questions.filter((q) => answeredIds.has(q.id)).length;
  const completionRate =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
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
        return "bg-green-100 text-green-700 border-green-200";
      case "medium":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "hard":
        return "bg-gray-300 text-gray-800 border-gray-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Practice Questions
        </h1>
        <p className="text-gray-600">
          Common questions and tips for your {interviewType} interview
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Questions Practiced: {answeredCount} / {questions.length}
          </span>
          <span className="text-sm font-semibold text-purple-600">
            {completionRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => {
          const isExpanded = expandedQuestion === question.id;

          return (
            <div
              key={question.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden"
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
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {question.question}
                      </h3>
                      <button
                        onClick={() =>
                          setExpandedQuestion(isExpanded ? null : question.id)
                        }
                        className="flex-shrink-0 text-purple-600 hover:text-purple-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
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
                    <h4 className="font-semibold text-gray-900 mb-3">
                      💡 Tips:
                    </h4>
                    <ul className="space-y-2">
                      {question.tips.map((tip, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <span className="text-purple-600 mt-1">•</span>
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
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-600">No questions match your filters</p>
        </div>
      )}
    </div>
  );
}
