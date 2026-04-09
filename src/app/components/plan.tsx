import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Circle, ArrowRight, BookOpen, Code, Users, Target } from "lucide-react";

interface PlanPhase {
  id: string;
  title: string;
  description: string;
  duration: string;
  topics: string[];
  icon: any;
}

export function Plan() {
  const [interviewType, setInterviewType] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set());

  useEffect(() => {
    const type = localStorage.getItem("interviewType") || "software";
    const time = localStorage.getItem("timeframe") || "2weeks";
    setInterviewType(type);
    setTimeframe(time);
    
    const completed = localStorage.getItem("completedPhases");
    if (completed) {
      setCompletedPhases(new Set(JSON.parse(completed)));
    }
  }, []);

  const togglePhase = (phaseId: string) => {
    const newCompleted = new Set(completedPhases);
    if (newCompleted.has(phaseId)) {
      newCompleted.delete(phaseId);
    } else {
      newCompleted.add(phaseId);
    }
    setCompletedPhases(newCompleted);
    localStorage.setItem("completedPhases", JSON.stringify([...newCompleted]));
  };

  const getPlansForType = (type: string): PlanPhase[] => {
    switch (type) {
      case "software":
        return [
          {
            id: "phase1",
            title: "Foundation & Data Structures",
            description: "Master core data structures and basic algorithms",
            duration: "Week 1",
            topics: ["Arrays & Strings", "Linked Lists", "Stacks & Queues", "Hash Tables", "Big O Notation"],
            icon: BookOpen,
          },
          {
            id: "phase2",
            title: "Advanced Algorithms",
            description: "Learn essential algorithmic patterns",
            duration: "Week 2",
            topics: ["Trees & Graphs", "Dynamic Programming", "Recursion", "Sorting & Searching", "Two Pointers"],
            icon: Code,
          },
          {
            id: "phase3",
            title: "System Design",
            description: "Understand scalable system architecture",
            duration: "Week 3",
            topics: ["Design Patterns", "Load Balancing", "Caching", "Database Design", "Microservices"],
            icon: Target,
          },
          {
            id: "phase4",
            title: "Behavioral & Mock Interviews",
            description: "Practice communication and problem-solving",
            duration: "Week 4",
            topics: ["STAR Method", "Leadership Stories", "Mock Coding", "Code Review", "Technical Communication"],
            icon: Users,
          },
        ];
      case "product":
        return [
          {
            id: "phase1",
            title: "Product Fundamentals",
            description: "Core product management concepts",
            duration: "Week 1",
            topics: ["Product Lifecycle", "User Research", "Market Analysis", "Roadmapping", "Stakeholder Management"],
            icon: BookOpen,
          },
          {
            id: "phase2",
            title: "Metrics & Analytics",
            description: "Data-driven decision making",
            duration: "Week 2",
            topics: ["KPIs & Metrics", "A/B Testing", "User Analytics", "Growth Strategies", "Success Metrics"],
            icon: Target,
          },
          {
            id: "phase3",
            title: "Case Studies",
            description: "Product design and strategy cases",
            duration: "Week 3",
            topics: ["Product Design", "Estimation Questions", "Strategy Cases", "Prioritization", "Trade-offs"],
            icon: Code,
          },
          {
            id: "phase4",
            title: "Behavioral & Execution",
            description: "Leadership and execution scenarios",
            duration: "Week 4",
            topics: ["Conflict Resolution", "Cross-functional Work", "Failed Projects", "Innovation Stories", "Mock Interviews"],
            icon: Users,
          },
        ];
      case "behavioral":
        return [
          {
            id: "phase1",
            title: "STAR Method Mastery",
            description: "Structure your responses effectively",
            duration: "Days 1-7",
            topics: ["STAR Framework", "Story Preparation", "Result Quantification", "Concise Delivery", "Active Listening"],
            icon: BookOpen,
          },
          {
            id: "phase2",
            title: "Leadership & Teamwork",
            description: "Demonstrate collaboration skills",
            duration: "Days 8-14",
            topics: ["Leadership Examples", "Team Conflicts", "Mentoring Others", "Influence Without Authority", "Collaboration"],
            icon: Users,
          },
          {
            id: "phase3",
            title: "Problem-Solving & Adaptability",
            description: "Show resilience and critical thinking",
            duration: "Days 15-21",
            topics: ["Complex Problems", "Failure Stories", "Adapting to Change", "Innovation", "Decision Making"],
            icon: Target,
          },
          {
            id: "phase4",
            title: "Mock Interviews & Polish",
            description: "Practice and refine your delivery",
            duration: "Days 22-30",
            topics: ["Mock Sessions", "Body Language", "Confidence Building", "Question Variations", "Final Review"],
            icon: Code,
          },
        ];
      default:
        return [
          {
            id: "phase1",
            title: "Resume & Basics",
            description: "Perfect your resume and fundamentals",
            duration: "Week 1",
            topics: ["Resume Review", "Cover Letters", "Common Questions", "Elevator Pitch", "Company Research"],
            icon: BookOpen,
          },
          {
            id: "phase2",
            title: "Industry Knowledge",
            description: "Understand your target field",
            duration: "Week 2",
            topics: ["Industry Trends", "Company Culture", "Role Requirements", "Salary Negotiation", "Career Goals"],
            icon: Target,
          },
          {
            id: "phase3",
            title: "Interview Skills",
            description: "Master the interview process",
            duration: "Week 3",
            topics: ["Phone Screening", "Video Interviews", "In-person Tips", "Thank You Notes", "Follow-ups"],
            icon: Users,
          },
          {
            id: "phase4",
            title: "Practice & Confidence",
            description: "Build confidence through practice",
            duration: "Week 4",
            topics: ["Mock Interviews", "Body Language", "Stress Management", "Common Mistakes", "Final Prep"],
            icon: Code,
          },
        ];
    }
  };

  const phases = getPlansForType(interviewType);
  const completionRate = Math.round((completedPhases.size / phases.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Preparation Plan</h1>
        <p className="text-gray-600">
          Follow this structured plan to ace your {interviewType} interview
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-purple-600">{completionRate}%</span>
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
          const Icon = phase.icon;
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
                          <h3 className="font-semibold text-gray-900">{phase.title}</h3>
                          <p className="text-sm text-gray-500">{phase.duration}</p>
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