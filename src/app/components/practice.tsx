import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Filter } from "lucide-react";

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  tips: string[];
  answered: boolean;
}

export function Practice() {
  const [interviewType, setInterviewType] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  useEffect(() => {
    const type = localStorage.getItem("interviewType") || "software";
    setInterviewType(type);
    
    const generatedQuestions = generateQuestions(type);
    
    // Load answered status
    const savedAnswered = localStorage.getItem("answeredQuestions");
    if (savedAnswered) {
      const answered = JSON.parse(savedAnswered);
      const updatedQuestions = generatedQuestions.map(q => ({
        ...q,
        answered: answered[q.id] || false
      }));
      setQuestions(updatedQuestions);
    } else {
      setQuestions(generatedQuestions);
    }
  }, []);

  const toggleAnswered = (questionId: string) => {
    const updatedQuestions = questions.map(q =>
      q.id === questionId ? { ...q, answered: !q.answered } : q
    );
    
    setQuestions(updatedQuestions);
    
    // Save progress
    const answered: Record<string, boolean> = {};
    updatedQuestions.forEach(q => {
      answered[q.id] = q.answered;
    });
    localStorage.setItem("answeredQuestions", JSON.stringify(answered));
  };

  const generateQuestions = (type: string): Question[] => {
    switch (type) {
      case "software":
        return [
          {
            id: "se1",
            question: "Reverse a linked list",
            category: "Data Structures",
            difficulty: "easy",
            tips: ["Consider iterative vs recursive approach", "Track previous, current, and next nodes", "Handle edge cases: null and single node"],
            answered: false
          },
          {
            id: "se2",
            question: "Find the longest substring without repeating characters",
            category: "Strings",
            difficulty: "medium",
            tips: ["Use sliding window technique", "Track characters with a hash map", "Update max length as you go"],
            answered: false
          },
          {
            id: "se3",
            question: "Implement an LRU Cache",
            category: "Design",
            difficulty: "hard",
            tips: ["Combine hash map and doubly linked list", "O(1) get and put operations", "Track capacity and eviction policy"],
            answered: false
          },
          {
            id: "se4",
            question: "Validate if a binary tree is a valid BST",
            category: "Trees",
            difficulty: "medium",
            tips: ["Track min and max bounds for each node", "In-order traversal should be sorted", "Consider both recursive and iterative solutions"],
            answered: false
          },
          {
            id: "se5",
            question: "Design a URL shortening service",
            category: "System Design",
            difficulty: "hard",
            tips: ["Discuss hashing vs base62 encoding", "Consider database choice and scaling", "Handle collisions and expiration"],
            answered: false
          },
          {
            id: "se6",
            question: "Merge K sorted linked lists",
            category: "Data Structures",
            difficulty: "hard",
            tips: ["Use a min-heap for efficiency", "Compare first elements of each list", "Time complexity: O(N log K)"],
            answered: false
          },
          {
            id: "se7",
            question: "Find all anagrams in a string",
            category: "Strings",
            difficulty: "medium",
            tips: ["Use sliding window with character frequency map", "Compare frequencies instead of sorting", "Optimize by updating window incrementally"],
            answered: false
          },
          {
            id: "se8",
            question: "Implement a thread-safe singleton pattern",
            category: "Concurrency",
            difficulty: "medium",
            tips: ["Double-checked locking pattern", "Use volatile or synchronized keywords", "Consider lazy vs eager initialization"],
            answered: false
          }
        ];
      case "product":
        return [
          {
            id: "pm1",
            question: "How would you improve Instagram Stories?",
            category: "Product Design",
            difficulty: "medium",
            tips: ["Define goals and metrics first", "Identify user pain points", "Prioritize features based on impact"],
            answered: false
          },
          {
            id: "pm2",
            question: "Estimate the number of Uber rides per day in San Francisco",
            category: "Estimation",
            difficulty: "easy",
            tips: ["Break down population and usage rate", "Make clear assumptions", "Show your calculation process"],
            answered: false
          },
          {
            id: "pm3",
            question: "Design a product for elderly people",
            category: "Product Design",
            difficulty: "medium",
            tips: ["Consider accessibility needs", "Focus on simplicity and clarity", "Think about different use cases"],
            answered: false
          },
          {
            id: "pm4",
            question: "Should Amazon build a competitor to TikTok?",
            category: "Strategy",
            difficulty: "hard",
            tips: ["Analyze market opportunity and competition", "Consider Amazon's strengths and weaknesses", "Think about build vs buy vs partner"],
            answered: false
          },
          {
            id: "pm5",
            question: "How would you measure success for YouTube Shorts?",
            category: "Metrics",
            difficulty: "medium",
            tips: ["Define north star metric", "Consider engagement, growth, and revenue metrics", "Discuss trade-offs between metrics"],
            answered: false
          },
          {
            id: "pm6",
            question: "Prioritize these 5 features for a food delivery app",
            category: "Prioritization",
            difficulty: "medium",
            tips: ["Use a framework (RICE, Value vs Effort)", "Consider user impact and business value", "Explain your reasoning clearly"],
            answered: false
          },
          {
            id: "pm7",
            question: "Design a product for small business owners",
            category: "Product Design",
            difficulty: "hard",
            tips: ["Research pain points in SMB segment", "Consider multiple stakeholders", "Think about scalability and pricing"],
            answered: false
          }
        ];
      case "behavioral":
        return [
          {
            id: "bh1",
            question: "Tell me about a time you failed",
            category: "Growth Mindset",
            difficulty: "medium",
            tips: ["Choose a real failure with learning", "Focus on what you learned", "Show how you applied lessons"],
            answered: false
          },
          {
            id: "bh2",
            question: "Describe a time you had a conflict with a coworker",
            category: "Teamwork",
            difficulty: "medium",
            tips: ["Focus on resolution, not blame", "Show empathy and listening skills", "Highlight positive outcome"],
            answered: false
          },
          {
            id: "bh3",
            question: "Give an example of when you showed leadership",
            category: "Leadership",
            difficulty: "easy",
            tips: ["Leadership can be informal", "Quantify the impact", "Highlight how you influenced others"],
            answered: false
          },
          {
            id: "bh4",
            question: "Tell me about a time you had to make a difficult decision with incomplete information",
            category: "Decision Making",
            difficulty: "hard",
            tips: ["Explain your decision framework", "Discuss risks and trade-offs", "Show adaptability to new information"],
            answered: false
          },
          {
            id: "bh5",
            question: "Describe a time you went above and beyond",
            category: "Initiative",
            difficulty: "easy",
            tips: ["Show intrinsic motivation", "Quantify extra effort and results", "Connect to company values"],
            answered: false
          },
          {
            id: "bh6",
            question: "Tell me about a time you received critical feedback",
            category: "Growth Mindset",
            difficulty: "medium",
            tips: ["Show openness to feedback", "Describe specific actions taken", "Highlight improvement and results"],
            answered: false
          },
          {
            id: "bh7",
            question: "Give an example of a time you had to influence others without authority",
            category: "Leadership",
            difficulty: "hard",
            tips: ["Focus on persuasion techniques", "Show understanding of stakeholder needs", "Highlight collaboration skills"],
            answered: false
          },
          {
            id: "bh8",
            question: "Describe a time you had to adapt to significant change",
            category: "Adaptability",
            difficulty: "medium",
            tips: ["Show flexibility and resilience", "Discuss initial challenges", "Highlight how you helped others adapt"],
            answered: false
          }
        ];
      default:
        return [
          {
            id: "gn1",
            question: "Tell me about yourself",
            category: "Introduction",
            difficulty: "easy",
            tips: ["Keep it under 2 minutes", "Focus on relevant experience", "End with why you're interested in this role"],
            answered: false
          },
          {
            id: "gn2",
            question: "Why do you want to work here?",
            category: "Motivation",
            difficulty: "easy",
            tips: ["Research the company thoroughly", "Connect to personal values", "Be specific about what excites you"],
            answered: false
          },
          {
            id: "gn3",
            question: "What are your greatest strengths?",
            category: "Self-Assessment",
            difficulty: "easy",
            tips: ["Choose relevant strengths", "Provide specific examples", "Show self-awareness"],
            answered: false
          },
          {
            id: "gn4",
            question: "What are your greatest weaknesses?",
            category: "Self-Assessment",
            difficulty: "medium",
            tips: ["Choose real but not critical weaknesses", "Show what you're doing to improve", "Be authentic"],
            answered: false
          },
          {
            id: "gn5",
            question: "Where do you see yourself in 5 years?",
            category: "Career Goals",
            difficulty: "medium",
            tips: ["Show ambition but be realistic", "Align with company career paths", "Focus on growth, not specific titles"],
            answered: false
          },
          {
            id: "gn6",
            question: "Why are you leaving your current job?",
            category: "Motivation",
            difficulty: "medium",
            tips: ["Stay positive about previous employer", "Focus on growth opportunities", "Be honest but diplomatic"],
            answered: false
          },
          {
            id: "gn7",
            question: "Do you have any questions for us?",
            category: "Engagement",
            difficulty: "easy",
            tips: ["Always have 2-3 questions ready", "Ask about team culture and challenges", "Show genuine interest"],
            answered: false
          }
        ];
    }
  };

  const categories = Array.from(new Set(questions.map(q => q.category)));
  
  const filteredQuestions = questions.filter(q => {
    if (filterCategory !== "all" && q.category !== filterCategory) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  const answeredCount = questions.filter(q => q.answered).length;
  const completionRate = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Questions</h1>
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
          <span className="text-sm font-semibold text-purple-600">{completionRate}%</span>
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
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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
                    {question.answered ? (
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
                        onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
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
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-900 mb-3">💡 Tips:</h4>
                    <ul className="space-y-2">
                      {question.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
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