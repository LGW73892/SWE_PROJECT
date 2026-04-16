import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, CalendarDays } from "lucide-react";
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

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated()) {
        setError("Please sign up or login first.");
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
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "practice":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "review":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "mock":
        return "bg-gray-200 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Study Schedule
        </h1>
        <p className="text-gray-600">
          Daily tasks and milestones for your {timeframe} preparation
        </p>
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
            <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {completedTasks}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Progress</div>
            <div className="text-2xl font-bold text-purple-600">
              {completionRate}%
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-purple-500 h-3 rounded-full transition-all duration-300"
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
              className={`bg-white rounded-lg p-6 shadow-sm border ${
                dayCompleted ? "border-green-300 bg-green-50" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Day {day.day}</h3>
                  <p className="text-sm text-gray-600">{day.date}</p>
                </div>
                {dayCompleted && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                )}
              </div>

              <div className="space-y-3">
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {completedTaskIds.has(task.id) ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </button>

                    <div className="flex-1">
                      <h4
                        className={`font-medium ${completedTaskIds.has(task.id) ? "line-through text-gray-500" : "text-gray-900"}`}
                      >
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-600">
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
