import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  BookOpen,
  Code,
  Users,
  Target,
} from "lucide-react";
import {
  getCurrentPlan,
  isAuthenticated,
  PlanData,
  setPhaseCompleted,
} from "../lib/api";

const phaseIcons = [BookOpen, Code, Target, Users];

export function Plan() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unable to load plan";
        setError(message);
        setNeedsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const togglePhase = async (phaseId: string) => {
    if (!plan) {
      return;
    }

    const completedSet = new Set(plan.completedPhases);
    const currentlyCompleted = completedSet.has(phaseId);
    const nextCompleted = !currentlyCompleted;

    if (nextCompleted) {
      completedSet.add(phaseId);
    } else {
      completedSet.delete(phaseId);
    }

    setPlan({ ...plan, completedPhases: [...completedSet] });

    try {
      const updated = await setPhaseCompleted(phaseId, nextCompleted);
      setPlan(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update phase");
      setPlan(plan);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        Loading plan...
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

  if (!plan) {
    return null;
  }

  const phases = plan.phases;
  const completedPhases = new Set(plan.completedPhases);
  const completionRate =
    phases.length > 0
      ? Math.round((completedPhases.size / phases.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Preparation Plan
        </h1>
        <p className="text-gray-600">
          Follow this structured plan to ace your {plan.interviewType} interview
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
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

      {/* Plan Phases */}
      <div className="space-y-6">
        {phases.map((phase, index) => {
          const Icon = phaseIcons[index % phaseIcons.length];
          const isCompleted = completedPhases.has(phase.id);

          return (
            <div
              key={phase.id}
              className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {phase.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {phase.duration}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                      Phase {index + 1}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{phase.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {phase.topics.map((topic) => (
                      <span
                        key={topic}
                        className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link
          to="/schedule"
          className="flex-1 flex items-center justify-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors"
        >
          View Schedule
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link
          to="/practice"
          className="flex-1 flex items-center justify-center gap-2 bg-white text-purple-600 border-2 border-purple-500 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
        >
          Start Practicing
        </Link>
      </div>
    </div>
  );
}
