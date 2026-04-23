import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Clock, CalendarDays, Crown } from "lucide-react";
import confetti from "canvas-confetti";
import {
  DaySchedule,
  getCurrentPlan,
  isAuthenticated,
  setTaskCompleted,
} from "../lib/api";

export function Schedule() {
  const [timeframe, setTimeframe] = useState<string>("");
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [recentCaptureId, setRecentCaptureId] = useState<string | null>(null);
  const [showCheckmateBanner, setShowCheckmateBanner] = useState(false);
  const previousCompletionRef = useRef(0);

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
        setTimeframe(plan.timeframe);
        setSchedule(plan.schedule);
        setCompletedTaskIds(new Set(plan.completedTaskIds));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load schedule");
        setNeedsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const toggleTask = async (taskId: string) => {
    const next = new Set(completedTaskIds);
    const currentlyCompleted = next.has(taskId);
    if (currentlyCompleted) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setCompletedTaskIds(next);

    try {
      const updated = await setTaskCompleted(taskId, !currentlyCompleted);
      setCompletedTaskIds(new Set(updated.completedTaskIds));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update task");
      setCompletedTaskIds(completedTaskIds);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "study":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "practice":
        return "bg-amber-100 text-stone-700 border-amber-200";
      case "review":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "mock":
        return "bg-stone-200 text-stone-800 border-stone-300";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const totalTasks = schedule.reduce((sum, day) => sum + day.tasks.length, 0);
  const completedTasks = schedule.reduce(
    (sum, day) =>
      sum + day.tasks.filter((t) => completedTaskIds.has(t.id)).length,
    0,
  );
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const chessPhases = [
    {
      id: "phase-1",
      title: "Phase 1: Capture the Knight",
      piece: "Knight",
      targetProgress: 25,
    },
    {
      id: "phase-2",
      title: "Phase 2: Capture the Rook",
      piece: "Rook",
      targetProgress: 50,
    },
    {
      id: "phase-3",
      title: "Phase 3: Capture the Queen",
      piece: "Queen",
      targetProgress: 75,
    },
    {
      id: "phase-4",
      title: "Phase 4: Checkmate",
      piece: "King",
      targetProgress: 100,
    },
  ];
  const pieceIcons: Record<string, string> = {
    Knight: "♞",
    Rook: "♜",
    Queen: "♛",
    King: "♚",
  };

  const activePhaseIndex = chessPhases.findIndex(
    (phase) => completionRate < phase.targetProgress,
  );
  const currentPhaseIndex =
    activePhaseIndex === -1 ? chessPhases.length - 1 : activePhaseIndex;

  useEffect(() => {
    const previous = previousCompletionRef.current;
    if (completionRate <= previous) {
      previousCompletionRef.current = completionRate;
      return;
    }

    const newlyCaptured = chessPhases.find(
      (phase) =>
        previous < phase.targetProgress && completionRate >= phase.targetProgress,
    );

    if (newlyCaptured) {
      setRecentCaptureId(newlyCaptured.id);
      window.setTimeout(() => setRecentCaptureId(null), 1000);
    }

    if (previous < 100 && completionRate >= 100) {
      setShowCheckmateBanner(true);
      void confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });
    }

    previousCompletionRef.current = completionRate;
  }, [chessPhases, completionRate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        Loading schedule...
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">
          Your Study Schedule
        </h1>
        <p className="text-stone-600">
          Daily tasks and milestones for your {timeframe} preparation
        </p>
      </div>

      {/* Chess Campaign Progress */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Road to Checkmate
          </h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
            {completionRate}% complete
          </span>
        </div>
        {showCheckmateBanner && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
            Checkmate! You completed your full schedule.
          </div>
        )}

        <div className="relative mb-8 h-10 px-1">
          <div className="absolute left-1 right-1 top-1/2 h-3 -translate-y-1/2 rounded-full bg-gray-200" />
          <div
            className="absolute left-1 top-1/2 h-3 -translate-y-1/2 rounded-full bg-emerald-700 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />

          <div
            className="absolute top-1/2 z-10 -translate-y-1/2 -translate-x-1/2 rounded-full bg-emerald-900 p-2 text-[#fffaf0] shadow-md transition-all duration-500"
            style={{ left: `${completionRate}%` }}
            aria-label="King progress marker"
            title="King advancing"
          >
            <Crown className="h-4 w-4" />
          </div>

          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
            {chessPhases.map((phase) => {
              const left =
                phase.targetProgress === 100
                  ? "calc(100% - 16px)"
                  : `${phase.targetProgress}%`;
              const isCaptured = completionRate >= phase.targetProgress;
              const pieceIcon = pieceIcons[phase.piece] ?? "♟";
              const isCheckmateTarget = phase.targetProgress === 100;

              return (
                <div
                  key={phase.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left }}
                >
                  <div
                    className={`mx-auto flex items-center justify-center rounded-full border font-bold ${
                      isCheckmateTarget ? "h-8 w-8 text-base" : "h-6 w-6 text-[10px]"
                    } ${
                      recentCaptureId === phase.id ? "animate-bounce" : ""
                    } ${
                      isCaptured
                        ? "border-emerald-800 bg-emerald-800 text-[#fffaf0]"
                        : "border-gray-400 bg-white text-gray-600"
                    }`}
                  >
                    <span className="leading-none">{pieceIcon}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {chessPhases.map((phase, index) => {
            const isCompleted = completionRate >= phase.targetProgress;
            const isCurrent = index === currentPhaseIndex && !isCompleted;
            const previousTarget =
              index === 0 ? 0 : chessPhases[index - 1].targetProgress;
            const midpointTarget =
              previousTarget + (phase.targetProgress - previousTarget) / 2;
            const pawnReached = completionRate >= midpointTarget;

            return (
              <div
                key={phase.id}
                className={`rounded-lg border p-4 ${
                  recentCaptureId === phase.id ? "animate-pulse" : ""
                } ${
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50"
                    : isCurrent
                      ? "border-amber-200 bg-amber-50"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">
                  <span className="mr-2" aria-hidden>
                    {pieceIcons[phase.piece] ?? "♟"}
                  </span>
                  {phase.title}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {isCompleted
                    ? "Captured"
                    : isCurrent
                      ? "In progress"
                      : "Locked"}
                </p>
                <div
                  className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-medium ${
                    pawnReached
                      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                  title="Middle checkpoint of this phase"
                  aria-label="Middle checkpoint pawn status"
                >
                  <span className="leading-none">♟</span>
                  <span>{pawnReached ? "Mid pawn captured" : "Mid pawn ahead"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="rounded-2xl border border-emerald-900/10 bg-[#fffaf0]/90 p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <div className="text-sm text-stone-600 mb-1">Total Tasks</div>
            <div className="text-2xl font-bold text-stone-900">
              {totalTasks}
            </div>
          </div>
          <div>
            <div className="text-sm text-stone-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {completedTasks}
            </div>
          </div>
          <div>
            <div className="text-sm text-stone-600 mb-1">Progress</div>
            <div className="text-2xl font-bold text-emerald-900">
              {completionRate}%
            </div>
          </div>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3">
          <div
            className="bg-emerald-900 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="space-y-6">
        {schedule.map((day) => {
          const dayCompleted = day.tasks.every((t) =>
            completedTaskIds.has(t.id),
          );

          return (
            <div
              key={day.day}
              className={`rounded-2xl p-6 shadow-sm border border-emerald-900/10 bg-[#fffaf0]/90 ${
                dayCompleted ? "border-green-300 bg-green-50/70" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <CalendarDays className="w-5 h-5 text-emerald-900" />
                <div>
                  <h3 className="font-semibold text-stone-900">
                    Day {day.day}
                  </h3>
                </div>
                {dayCompleted && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                )}
              </div>

              <div className="space-y-3">
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-emerald-900/10 bg-white/80 hover:bg-amber-50 transition-colors"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 flex-shrink-0"
                      aria-label={
                        completedTaskIds.has(task.id)
                          ? "Mark pawn task as incomplete"
                          : "Mark pawn task as complete"
                      }
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm transition-colors ${
                          completedTaskIds.has(task.id)
                            ? "border-emerald-700 bg-emerald-100 text-emerald-700"
                            : "border-gray-300 bg-white text-gray-400"
                        }`}
                        aria-hidden
                      >
                        ♟
                      </span>
                    </button>

                    <div className="flex-1">
                      <h4
                        className={`font-medium ${completedTaskIds.has(task.id) ? "line-through text-stone-500" : "text-stone-900"}`}
                      >
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span className="text-sm text-stone-600">
                          {task.duration}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full border ${getTypeColor(task.type)}`}
                    >
                      {task.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
