import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, CalendarDays } from "lucide-react";

interface Task {
  id: string;
  title: string;
  duration: string;
  type: "study" | "practice" | "review" | "mock";
  completed: boolean;
}

interface DaySchedule {
  day: number;
  date: string;
  tasks: Task[];
}

export function Schedule() {
  const [interviewType, setInterviewType] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  useEffect(() => {
    const type = localStorage.getItem("interviewType") || "software";
    const time = localStorage.getItem("timeframe") || "2weeks";
    setInterviewType(type);
    setTimeframe(time);
    
    // Generate schedule
    const generatedSchedule = generateSchedule(type, time);
    
    // Load completed tasks
    const savedProgress = localStorage.getItem("scheduleProgress");
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      const updatedSchedule = generatedSchedule.map(day => ({
        ...day,
        tasks: day.tasks.map(task => ({
          ...task,
          completed: progress[task.id] || false
        }))
      }));
      setSchedule(updatedSchedule);
    } else {
      setSchedule(generatedSchedule);
    }
  }, []);

  const toggleTask = (taskId: string) => {
    const updatedSchedule = schedule.map(day => ({
      ...day,
      tasks: day.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
    
    setSchedule(updatedSchedule);
    
    // Save progress
    const progress: Record<string, boolean> = {};
    updatedSchedule.forEach(day => {
      day.tasks.forEach(task => {
        progress[task.id] = task.completed;
      });
    });
    localStorage.setItem("scheduleProgress", JSON.stringify(progress));
  };

  const generateSchedule = (type: string, time: string): DaySchedule[] => {
    const days = time === "1week" ? 7 : time === "2weeks" ? 14 : time === "1month" ? 30 : 60;
    const today = new Date();
    
    const schedules: DaySchedule[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      schedules.push({
        day: i + 1,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tasks: generateTasksForDay(type, i, days)
      });
    }
    
    return schedules;
  };

  const generateTasksForDay = (type: string, dayIndex: number, totalDays: number): Task[] => {
    const tasks: Task[] = [];
    const dayId = `day${dayIndex}`;
    
    // Different patterns based on interview type
    if (type === "software") {
      if (dayIndex % 7 === 0) {
        tasks.push({
          id: `${dayId}-review`,
          title: "Weekly Review & Reflection",
          duration: "1 hour",
          type: "review",
          completed: false
        });
      }
      
      tasks.push({
        id: `${dayId}-study`,
        title: dayIndex < totalDays / 2 ? "Study Data Structures" : "Study System Design",
        duration: "2 hours",
        type: "study",
        completed: false
      });
      
      tasks.push({
        id: `${dayId}-practice`,
        title: "Solve 3-5 Coding Problems",
        duration: "2 hours",
        type: "practice",
        completed: false
      });
      
      if (dayIndex % 5 === 4) {
        tasks.push({
          id: `${dayId}-mock`,
          title: "Mock Coding Interview",
          duration: "1 hour",
          type: "mock",
          completed: false
        });
      }
    } else if (type === "product") {
      tasks.push({
        id: `${dayId}-study`,
        title: dayIndex < totalDays / 3 ? "Product Strategy Reading" : dayIndex < 2 * totalDays / 3 ? "Metrics & Analytics Study" : "Case Study Practice",
        duration: "1.5 hours",
        type: "study",
        completed: false
      });
      
      tasks.push({
        id: `${dayId}-practice`,
        title: "Practice Case Questions",
        duration: "2 hours",
        type: "practice",
        completed: false
      });
      
      if (dayIndex % 4 === 3) {
        tasks.push({
          id: `${dayId}-mock`,
          title: "Mock Product Interview",
          duration: "1 hour",
          type: "mock",
          completed: false
        });
      }
    } else if (type === "behavioral") {
      tasks.push({
        id: `${dayId}-study`,
        title: "Prepare STAR Stories",
        duration: "1 hour",
        type: "study",
        completed: false
      });
      
      tasks.push({
        id: `${dayId}-practice`,
        title: "Practice 5 Behavioral Questions",
        duration: "1.5 hours",
        type: "practice",
        completed: false
      });
      
      if (dayIndex % 3 === 2) {
        tasks.push({
          id: `${dayId}-mock`,
          title: "Mock Behavioral Interview",
          duration: "45 min",
          type: "mock",
          completed: false
        });
      }
    } else {
      tasks.push({
        id: `${dayId}-study`,
        title: "Research Companies & Roles",
        duration: "1 hour",
        type: "study",
        completed: false
      });
      
      tasks.push({
        id: `${dayId}-practice`,
        title: "Practice Common Questions",
        duration: "1 hour",
        type: "practice",
        completed: false
      });
      
      if (dayIndex % 4 === 3) {
        tasks.push({
          id: `${dayId}-review`,
          title: "Review & Update Resume",
          duration: "30 min",
          type: "review",
          completed: false
        });
      }
    }
    
    return tasks;
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
    (sum, day) => sum + day.tasks.filter(t => t.completed).length,
    0
  );
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Study Schedule</h1>
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
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Progress</div>
            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
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
          const dayCompleted = day.tasks.every(t => t.completed);
          
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
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h4 className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-600">{task.duration}</span>
                      </div>
                    </div>
                    
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getTypeColor(task.type)}`}>
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