import ChessBackground from "./ChessBackground";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  Briefcase,
  Castle,
  Code,
  Crown,
  Shield,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { generatePlan, isAuthenticated, updateMyProfile } from "../lib/api";

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
  const [targetCompaniesInput, setTargetCompaniesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const targetCompanies = targetCompaniesInput
    .split(",")
    .map((company) => company.trim())
    .filter(Boolean);

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
      await updateMyProfile("", targetCompanies);

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
              Checkmate Your Interview
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
      </div>
    </div>
  );
}
