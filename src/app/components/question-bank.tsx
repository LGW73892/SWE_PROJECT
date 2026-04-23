import { useEffect, useState } from "react";
import {
  CompanyQuestionBankSearchResult,
  getQuestionBankForCompany,
  searchQuestionBankCompanies,
} from "../lib/api";

export function QuestionBank() {
  const QUESTIONS_PER_PAGE = 10;
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [result, setResult] = useState<CompanyQuestionBankSearchResult | null>(
    null,
  );
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCategoryPages({});
  }, [result?.company]);

  const handleSearchCompanies = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await searchQuestionBankCompanies(query);
      setCompanies(response.companies);
      if (response.companies.length === 0) {
        setSelectedCompany("");
        setResult(null);
        return;
      }

      const autoSelectedCompany = response.companies[0];
      setSelectedCompany(autoSelectedCompany);
      const questionResponse = await getQuestionBankForCompany(
        autoSelectedCompany,
      );
      setResult(questionResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to search companies.");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyQuestions = async (company: string) => {
    setSelectedCompany(company);
    setError("");
    setLoading(true);
    try {
      const response = await getQuestionBankForCompany(company);
      setResult(response);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load company questions.",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="rounded-2xl border border-emerald-900/10 bg-[#fffaf0]/90 p-6">
        <h1 className="text-3xl font-bold text-stone-900">
          Company Question Bank
        </h1>
        <p className="mt-2 text-stone-600">
          Search for a company and browse curated LeetCode, system design, and
          behavioral interview questions from our internal database.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSearchCompanies();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company (Google, Meta, Amazon...)"
            className="flex-1 rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-900 px-4 py-2 text-[#fffaf0] hover:bg-emerald-800"
          >
            Search
          </button>
        </form>

        {companies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {companies.map((company) => (
              <button
                key={company}
                type="button"
                onClick={() => void loadCompanyQuestions(company)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  selectedCompany === company
                    ? "border-emerald-900 bg-emerald-50 text-emerald-900"
                    : "border-emerald-900/20 bg-white text-stone-700 hover:bg-amber-50"
                }`}
              >
                {company}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="text-stone-600">Loading...</p>}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">
              {result.company}
            </h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900">
              {result.total} questions
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(result.categories).map(([category, questions]) => (
              <details
                key={category}
                className="group rounded-xl border border-emerald-900/10 bg-[#fffaf0]/80"
                open
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide text-stone-700">
                  <span>{category}</span>
                  <span
                    aria-hidden="true"
                    className="text-base text-stone-500 transition-transform duration-200 group-open:rotate-180"
                  >
                    ▼
                  </span>
                </summary>
                <div className="space-y-3 border-t border-emerald-900/10 px-4 py-3">
                  {(() => {
                    const currentPage = categoryPages[category] ?? 1;
                    const totalPages = Math.max(
                      1,
                      Math.ceil(questions.length / QUESTIONS_PER_PAGE),
                    );
                    const startIndex =
                      (currentPage - 1) * QUESTIONS_PER_PAGE;
                    const visibleQuestions = questions.slice(
                      startIndex,
                      startIndex + QUESTIONS_PER_PAGE,
                    );

                    return (
                      <>
                        {visibleQuestions.map((q, index) => (
                    <div
                      key={`${category}-${startIndex + index}`}
                      className="rounded-lg border border-emerald-900/10 bg-white p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <p className="font-medium text-stone-900">
                          {q.question}
                        </p>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-stone-700">
                          {q.difficulty}
                        </span>
                      </div>
                      {q.tips?.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm text-stone-600">
                          {q.tips.map((tip, tipIndex) => (
                            <li key={`${startIndex + index}-tip-${tipIndex}`}>
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                        ))}

                        {totalPages > 1 && (
                          <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-900/10 bg-emerald-50/40 px-3 py-2 text-sm">
                            <span className="text-stone-700">
                              Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() =>
                                  setCategoryPages((prev) => ({
                                    ...prev,
                                    [category]: Math.max(1, currentPage - 1),
                                  }))
                                }
                                className="rounded-md border border-emerald-900/20 bg-white px-3 py-1 text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() =>
                                  setCategoryPages((prev) => ({
                                    ...prev,
                                    [category]: Math.min(
                                      totalPages,
                                      currentPage + 1,
                                    ),
                                  }))
                                }
                                className="rounded-md border border-emerald-900/20 bg-white px-3 py-1 text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
