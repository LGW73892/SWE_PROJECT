import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Briefcase, Code, Users, TrendingUp } from "lucide-react";

const interviewTypes = [
  {
    id: "software",
    name: "Software Engineering",
    icon: Code,
    description: "Technical interviews, coding challenges, system design",
    color: "blue",
  },
  {
    id: "product",
    name: "Product Management",
    icon: TrendingUp,
    description: "Product strategy, case studies, metrics & analytics",
    color: "purple",
  },
  {
    id: "behavioral",
    name: "Behavioral",
    icon: Users,
    description: "Leadership, teamwork, problem-solving scenarios",
    color: "green",
  },
  {
    id: "general",
    name: "General Career",
    icon: Briefcase,
    description: "Resume review, common questions, interview basics",
    color: "orange",
  },
];

const timeframes = [
  { id: "1week", label: "1 Week", days: 7 },
  { id: "2weeks", label: "2 Weeks", days: 14 },
  { id: "1month", label: "1 Month", days: 30 },
  { id: "2months", label: "2 Months", days: 60 },
];

export function Home() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("");

  const handleGetStarted = () => {
    if (selectedType && selectedTimeframe) {
      // Store selections in localStorage
      localStorage.setItem("interviewType", selectedType);
      localStorage.setItem("timeframe", selectedTimeframe);
      navigate("/plan");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Master Your Interview
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get a personalized preparation plan, structured schedule, and curated
          practice questions tailored to your interview type
        </p>
      </div>

      {/* Interview Type Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Select Your Interview Type
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviewTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-6 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? "bg-purple-500"
                        : "bg-purple-200"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected
                          ? "text-white"
                          : "text-purple-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {type.name}
                    </h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeframe Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          How Much Time Do You Have?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {timeframes.map((timeframe) => {
            const isSelected = selectedTimeframe === timeframe.id;
            return (
              <button
                key={timeframe.id}
                onClick={() => setSelectedTimeframe(timeframe.id)}
                className={`p-6 rounded-lg border-2 text-center transition-all ${
                  isSelected
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {timeframe.label}
                </div>
                <div className="text-sm text-gray-600">
                  {timeframe.days} days
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Get Started Button */}
      <div className="text-center">
        <button
          onClick={handleGetStarted}
          disabled={!selectedType || !selectedTimeframe}
          className={`inline-flex items-center gap-2 px-8 py-4 rounded-lg text-lg font-semibold transition-all ${
            selectedType && selectedTimeframe
              ? "bg-purple-500 text-white hover:bg-purple-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Generate My Plan
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}