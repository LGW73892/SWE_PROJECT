import ChessBackground from "./ChessBackground";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  Briefcase,
  Castle,
  ChevronDown,
  Code,
  Crown,
  Shield,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  generatePlan,
  getMyProfile,
  isAuthenticated,
  updateMyProfile,
} from "../lib/api";

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

type TopicPreference = "strength" | "neutral" | "weakness";

const topicCategories: Record<string, string[]> = {
  DSA: [
    "Arrays & Strings",
    "Hash Maps & Sets",
    "Two Pointers",
    "Sliding Window",
    "Stacks & Queues",
    "Linked Lists",
    "Trees & Traversals",
    "Binary Search",
    "Heaps & Priority Queues",
    "Graphs (BFS/DFS)",
    "Dynamic Programming",
    "Greedy Algorithms",
    "Backtracking",
    "Recursion",
    "Time/Space Complexity",
  ],
  "System & Software Design": [
    "Object-Oriented Design",
    "Design Patterns",
    "System Design Fundamentals",
    "Scalability & Performance",
    "Caching",
    "Microservices",
    "Distributed Systems",
    "Concurrency & Multithreading",
  ],
  "Backend, Databases & Infra": [
    "Databases & SQL",
    "NoSQL & MongoDB",
    "REST API Design",
    "Authentication & Security",
    "Testing Strategy",
    "Debugging & Troubleshooting",
    "Git & Collaboration",
    "CI/CD Basics",
    "Cloud Fundamentals",
  ],
  "Behavioral & Leadership": [
    "Behavioral Storytelling",
    "Leadership Examples",
    "Conflict Resolution",
    "Stakeholder Communication",
  ],
  "Product & Strategy": [
    "Product Sense",
    "Metrics & Analytics",
    "Prioritization",
    "Roadmapping",
  ],
};

const reviewTopicOptions = Object.values(topicCategories).reduce<string[]>(
  (acc, topics) => acc.concat(topics),
  [],
);

const buildPreferencesSignature = (
  preferences: Record<string, TopicPreference>,
  companies: string[],
) => {
  const topicPart = reviewTopicOptions
    .map((topic) => `${topic}:${preferences[topic] ?? "neutral"}`)
    .join("|");

  const companyPart = [...companies].sort().join("|");
  return `${companyPart}||${topicPart}`;
};

export function Home() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("");
  const [targetCompaniesInput, setTargetCompaniesInput] = useState("");
  const [topicPreferences, setTopicPreferences] = useState<
    Record<string, TopicPreference>
  >(() =>
    Object.fromEntries(
      reviewTopicOptions.map((topic) => [topic, "neutral" as TopicPreference]),
    ),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSavedSignature, setLastSavedSignature] = useState("");

  useEffect(() => {
    const loadSavedPreferences = async () => {
      if (!isAuthenticated()) {
        setProfileLoaded(true);
        return;
      }

      try {
        const profile = await getMyProfile();
        const loadedCompanies = profile.targetCompanies ?? [];
        setTargetCompaniesInput(loadedCompanies.join(", "));

        const loadedPreferences = Object.fromEntries(
          reviewTopicOptions.map((topic) => {
            const status = profile.topicPreferences?.[topic];
            const normalizedStatus: TopicPreference =
              status === "strength" ||
              status === "weakness" ||
              status === "neutral"
                ? status
                : "neutral";
            return [topic, normalizedStatus];
          }),
        ) as Record<string, TopicPreference>;

        setTopicPreferences(loadedPreferences);
        setLastSavedSignature(
          buildPreferencesSignature(loadedPreferences, loadedCompanies),
        );
      } catch {
        // Non-blocking: Home still works with local defaults.
      } finally {
        setProfileLoaded(true);
      }
    };

    void loadSavedPreferences();
  }, []);

  useEffect(() => {
    if (!profileLoaded || !isAuthenticated()) {
      return;
    }

    const currentSignature = buildPreferencesSignature(
      topicPreferences,
      targetCompanies,
    );

    if (currentSignature === lastSavedSignature) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      const profileTopicPreferences = Object.fromEntries(
        reviewTopicOptions.map((topic) => [
          topic,
          topicPreferences[topic] ?? "neutral",
        ]),
      ) as Record<string, TopicPreference>;

      setSaveStatus("saving");
      try {
        await updateMyProfile("", targetCompanies, profileTopicPreferences);
        setLastSavedSignature(currentSignature);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    profileLoaded,
    topicPreferences,
    targetCompaniesInput,
    lastSavedSignature,
  ]);

  const companies = ["Google", "Amazon", "Meta", "Apple", "Microsoft", "Stripe",
                             "OpenAI", "Nvidia", "Adobe", "Palantir", "Netflix", "Uber",
                             "Airbnb", "Oracle", "Salesforce"];
  const [companyText, setCompanyText] = useState("");
  const [companyIndex, setCompanyIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = companies[companyIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCompanyText(current.slice(0, companyText.length + 1));
        if (companyText.length + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setCompanyText(current.slice(0, companyText.length - 1));
        if (companyText.length - 1 === 0) {
          setIsDeleting(false);
          setCompanyIndex((i) => (i + 1) % companies.length);
        }
      }
    }, isDeleting ? 80 : 140);
    return () => clearTimeout(timeout);
  }, [companyText, isDeleting, companyIndex]);

  const style = `
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    .cursor-blink { animation: blink 0.8s step-end infinite; }
  `;

  const targetCompanies = targetCompaniesInput
    .split(",")
    .map((company) => company.trim())
    .filter(Boolean);

  const strengths = reviewTopicOptions.filter(
    (topic) => topicPreferences[topic] === "strength",
  );
  const weaknesses = reviewTopicOptions.filter(
    (topic) => topicPreferences[topic] === "weakness",
  );
  const neutralTopics = reviewTopicOptions.filter(
    (topic) =>
      topicPreferences[topic] !== "strength" &&
      topicPreferences[topic] !== "weakness",
  );

  const cycleTopicPreference = (topic: string) => {
    setTopicPreferences((prev) => ({
      ...prev,
      [topic]:
        prev[topic] === "neutral"
          ? "weakness"
          : prev[topic] === "weakness"
            ? "strength"
            : "neutral",
    }));
  };

  const handleGetStarted = async () => {
    if (!selectedType || !selectedTimeframe) {
      setError("Please select interview type and timeframe.");
      return;
    }

    if (!isAuthenticated()) {
      setError("Please login or sign up first.");
      navigate("/auth");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const profileTopicPreferences = Object.fromEntries(
        reviewTopicOptions.map((topic) => [
          topic,
          topicPreferences[topic] ?? "neutral",
        ]),
      ) as Record<string, TopicPreference>;

      await updateMyProfile("", targetCompanies, profileTopicPreferences);

      await generatePlan({
        interviewType: selectedType as
          | "software"
          | "product"
          | "behavioral"
          | "general",
        timeframe: selectedTimeframe as
          | "1week"
          | "2weeks"
          | "1month"
          | "2months",
        targetCompanies,
        strengths,
        weaknesses,
        neutralTopics,
      });

      navigate("/plan");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-900/12 bg-[#fffaf0]/90 shadow-[0_24px_80px_rgba(31,77,58,0.08)]">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(45deg,#1f4d3a_25%,transparent_25%),linear-gradient(-45deg,#1f4d3a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f4d3a_75%),linear-gradient(-45deg,transparent_75%,#1f4d3a_75%)] [background-size:48px_48px] [background-position:0_0,0_24px,24px_-24px,-24px_0]" />
        <ChessBackground />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.3em] text-emerald-900/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1 text-[11px] tracking-[0.35em] text-emerald-900">
              <Castle className="h-3.5 w-3.5" />
              Opening Prep
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-amber-50 px-3 py-1 text-[11px] tracking-[0.35em] text-stone-700">
              <Crown className="h-3.5 w-3.5" />
              Study Like a King
            </span>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 mb-4">
              Checkmate Your Interview at{" "}
              <span className="text-emerald-900">{companyText}</span>
              <style>{style}</style>
              <span className="cursor-blink text-emerald-700">|</span>
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto">
              Build a board-winning prep plan with opening moves, tactical
              drills, and endgame practice tailored to your interview type.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-12">
            {[
              {
                icon: Shield,
                title: "Defend your strengths",
                text: "Spot weak squares before the interview does.",
              },
              {
                icon: Target,
                title: "Play with purpose",
                text: "Each session moves you closer to checkmate.",
              },
              {
                icon: Crown,
                title: "Finish like a king",
                text: "Arrive with a clear line from prep to offer.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-emerald-900/10 bg-white/80 p-5 text-left shadow-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-[#fffaf0]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-stone-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interview Type Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
          <Castle className="h-5 w-5 text-emerald-900" />
          Choose Your Opening
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviewTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 shadow-sm ${
                  isSelected
                    ? "border-emerald-900 bg-emerald-50"
                    : "border-emerald-900/10 bg-white/85 hover:border-emerald-900/25 hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-emerald-900" : "bg-amber-100"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? "text-[#fffaf0]" : "text-emerald-900"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900 mb-1">
                      {type.name}
                    </h3>
                    <p className="text-sm text-stone-600">{type.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeframe Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-900" />
          How Much Time Do You Have?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {timeframes.map((timeframe) => {
            const isSelected = selectedTimeframe === timeframe.id;
            return (
              <button
                key={timeframe.id}
                onClick={() => setSelectedTimeframe(timeframe.id)}
                className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 shadow-sm ${
                  isSelected
                    ? "border-emerald-900 bg-emerald-50"
                    : "border-emerald-900/10 bg-white/85 hover:border-emerald-900/25 hover:-translate-y-0.5"
                }`}
              >
                <div className="text-2xl font-bold text-stone-900 mb-1">
                  {timeframe.label}
                </div>
                <div className="text-sm text-stone-600">
                  {timeframe.days} days
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Get Started Button */}
      <div className="mb-8 rounded-2xl border border-emerald-900/10 bg-white/85 p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold text-stone-900">
          Topic Customization
        </h2>
        <p className="mb-4 text-sm text-stone-600">
          select the topics you feel strongest in, weakest in, and neutral about
          to tailor your prep plan.
        </p>

        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
            Strengths: {strengths.length}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-stone-700">
            Neutral: {neutralTopics.length}
          </span>
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 font-medium text-red-700">
            Weaknesses: {weaknesses.length}
          </span>
        </div>

        <div className="mb-3 text-xs text-stone-600">
          {saveStatus === "saving" && <span>Saving topic status...</span>}
          {saveStatus === "saved" && (
            <span className="text-emerald-800">
              Topic status saved to your profile.
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-700">
              Unable to save right now. Try again in a moment.
            </span>
          )}
        </div>

        <div className="max-h-[28rem] space-y-2 overflow-y-auto rounded-xl border border-emerald-900/10 bg-[#fffaf0]/70 p-3">
          {Object.entries(topicCategories).map(([category, topics], index) => (
            <details
              key={category}
              className="group rounded-lg border border-emerald-900/10 bg-white/80"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold text-stone-800">
                  {category}
                </span>
                <ChevronDown className="h-4 w-4 text-stone-600 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-emerald-900/10 px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => {
                    const preference = topicPreferences[topic] ?? "neutral";
                    const colorClass =
                      preference === "strength"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : preference === "weakness"
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-amber-300 bg-amber-50 text-stone-700";
                    const stateText =
                      preference === "strength"
                        ? "Strength"
                        : preference === "weakness"
                          ? "Weakness"
                          : "Neutral";

                    return (
                      <button
                        type="button"
                        key={topic}
                        onClick={() => cycleTopicPreference(topic)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${colorClass}`}
                        title={`${topic}: ${stateText}`}
                      >
                        <span>{topic}</span>
                        <span className="rounded-full border border-current/30 px-2 py-0.5 text-xs">
                          {stateText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setTopicPreferences(
                Object.fromEntries(
                  reviewTopicOptions.map((topic) => [
                    topic,
                    "neutral" as TopicPreference,
                  ]),
                ),
              )
            }
            className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-amber-50"
          >
            Reset All to Neutral
          </button>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-emerald-900/10 bg-white/85 p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold text-stone-900">
          Company Targeting
        </h2>
        <p className="mb-4 text-sm text-stone-600">
          Add company names to get a tailored plan and practice set.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Target Companies (comma separated)
            </label>
            <input
              value={targetCompaniesInput}
              onChange={(e) => setTargetCompaniesInput(e.target.value)}
              className="w-full rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              placeholder="Google, Meta, Stripe"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!isAuthenticated() && (
          <div className="mt-4 rounded-xl border border-amber-900/15 bg-amber-50/70 p-4">
            <p className="text-sm text-stone-700">
              You are not logged in yet. Sign in or create an account before
              generating your plan.
            </p>
            <Link
              to="/auth"
              className="mt-3 inline-flex items-center rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-[#fffaf0] transition-colors hover:bg-emerald-800"
            >
              Go to Login / Sign Up
            </Link>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={handleGetStarted}
          disabled={!selectedType || !selectedTimeframe || isSubmitting}
          className={`inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-sm ${
            selectedType && selectedTimeframe && !isSubmitting
              ? "bg-emerald-900 text-[#fffaf0] hover:bg-emerald-800"
              : "bg-stone-300 text-stone-500 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "Generating..." : "Generate My Plan"}
          <ArrowRight className="w-5 h-5" />
        </button>
        {isSubmitting && (
          <p className="mt-3 text-sm text-stone-600">
            This will take a couple minutes.
          </p>
        )}
      </div>
    </div>
  );
}
