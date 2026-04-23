import { useEffect, useState } from "react";
import {
  isAuthenticated,
  getMyProfile,
  updateMyProfile,
  updateMyApplications,
  updateMyLeetCodeEntries,
  JobApplication,
  LeetCodeEntry,
} from "../lib/api";

const applicationStatuses = [
  "Applied",
  "OA Scheduled",
  "OA Completed",
  "Interviewing",
  "Offer",
  "Rejected",
  "On Hold",
];

const leetCodeStatuses = [
  "Not Started",
  "In Progress",
  "Completed",
  "Needs Review",
];
const leetCodeDifficulties = ["Easy", "Medium", "Hard"];

const emptyApplication: JobApplication = {
  company: "",
  role: "",
  status: "Applied",
  notes: "",
};

const emptyLeetCode: LeetCodeEntry = {
  title: "",
  difficulty: "Medium",
  status: "Completed",
  notes: "",
};

export function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingApplications, setSavingApplications] = useState(false);
  const [savingLeetCode, setSavingLeetCode] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [leetCodeEntries, setLeetCodeEntries] = useState<LeetCodeEntry[]>([]);
  const [profileNotes, setProfileNotes] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated()) {
        setError("Please log in to view your profile.");
        setLoading(false);
        return;
      }

      try {
        const profile = await getMyProfile();
        setFullName(profile.fullName ?? "");
        setTargetCompanies(profile.targetCompanies ?? []);
        setApplications(profile.applications ?? []);
        setLeetCodeEntries(profile.leetCodeEntries ?? []);
        setProfileNotes(profile.profileNotes ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const updateApplication = (index: number, patch: Partial<JobApplication>) => {
    setApplications((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateLeetCode = (index: number, patch: Partial<LeetCodeEntry>) => {
    setLeetCodeEntries((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const handleSave = async () => {
    setSaveMessage("");
    setError("");
    setSaving(true);

    try {
      const saved = await updateMyProfile(
        fullName,
        targetCompanies,
        undefined,
        applications,
        leetCodeEntries,
        profileNotes,
      );

      setApplications(saved.applications ?? []);
      setLeetCodeEntries(saved.leetCodeEntries ?? []);
      setProfileNotes(saved.profileNotes ?? "");
      setSaveMessage("Profile saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApplications = async () => {
    setSaveMessage("");
    setError("");
    setSavingApplications(true);
    try {
      const saved = await updateMyApplications(applications);
      setApplications(saved.applications ?? []);
      setSaveMessage("Applications saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save applications.");
    } finally {
      setSavingApplications(false);
    }
  };

  const handleSaveLeetCode = async () => {
    setSaveMessage("");
    setError("");
    setSavingLeetCode(true);
    try {
      const saved = await updateMyLeetCodeEntries(leetCodeEntries);
      setLeetCodeEntries(saved.leetCodeEntries ?? []);
      setSaveMessage("LeetCode tracker saved.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to save LeetCode tracker.",
      );
    } finally {
      setSavingLeetCode(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-stone-700">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div className="rounded-2xl border border-emerald-900/10 bg-[#fffaf0]/90 p-6">
        <h1 className="text-3xl font-bold text-stone-900">
          My Profile Tracker
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Track applications, LeetCode progress, and notes in one place.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-stone-900">Profile Basics</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Target Companies (comma separated)
            </label>
            <input
              value={targetCompanies.join(", ")}
              onChange={(e) =>
                setTargetCompanies(
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="w-full rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-900">Applications</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setApplications((prev) => [...prev, { ...emptyApplication }])
              }
              className="rounded-lg bg-emerald-900 px-3 py-2 text-sm font-medium text-[#fffaf0] hover:bg-emerald-800"
            >
              Add Application
            </button>
            <button
              type="button"
              onClick={() => void handleSaveApplications()}
              disabled={savingApplications}
              className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingApplications ? "Saving..." : "Save Applications"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {applications.length === 0 && (
            <p className="text-sm text-stone-600">No applications yet.</p>
          )}
          {applications.map((app, index) => (
            <div
              key={`app-${index}`}
              className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-900/10 p-3 md:grid-cols-4"
            >
              <input
                value={app.company}
                onChange={(e) =>
                  updateApplication(index, { company: e.target.value })
                }
                placeholder="Company"
                className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              />
              <input
                value={app.role}
                onChange={(e) =>
                  updateApplication(index, { role: e.target.value })
                }
                placeholder="Role"
                className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              />
              <select
                value={app.status}
                onChange={(e) =>
                  updateApplication(index, { status: e.target.value })
                }
                className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              >
                {applicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setApplications((prev) => prev.filter((_, i) => i !== index))
                }
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Remove
              </button>
              <textarea
                value={app.notes}
                onChange={(e) =>
                  updateApplication(index, { notes: e.target.value })
                }
                placeholder="Notes"
                className="md:col-span-4 min-h-[72px] rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-900">
            LeetCode Tracker
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setLeetCodeEntries((prev) => [...prev, { ...emptyLeetCode }])
              }
              className="rounded-lg bg-emerald-900 px-3 py-2 text-sm font-medium text-[#fffaf0] hover:bg-emerald-800"
            >
              Add Problem
            </button>
            <button
              type="button"
              onClick={() => void handleSaveLeetCode()}
              disabled={savingLeetCode}
              className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingLeetCode ? "Saving..." : "Save LeetCode"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {leetCodeEntries.length === 0 && (
            <p className="text-sm text-stone-600">No LeetCode entries yet.</p>
          )}
          {leetCodeEntries.map((entry, index) => (
            <div
              key={`lc-${index}`}
              className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-900/10 p-3 md:grid-cols-4"
            >
              <input
                value={entry.title}
                onChange={(e) =>
                  updateLeetCode(index, { title: e.target.value })
                }
                placeholder="Problem Title"
                className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              />
              <select
                value={entry.difficulty}
                onChange={(e) =>
                  updateLeetCode(index, { difficulty: e.target.value })
                }
                className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              >
                {leetCodeDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
              <select
                value={entry.status}
                onChange={(e) =>
                  updateLeetCode(index, { status: e.target.value })
                }
                className="rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              >
                {leetCodeStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setLeetCodeEntries((prev) =>
                    prev.filter((_, i) => i !== index),
                  )
                }
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Remove
              </button>
              <textarea
                value={entry.notes}
                onChange={(e) =>
                  updateLeetCode(index, { notes: e.target.value })
                }
                placeholder="Notes"
                className="md:col-span-4 min-h-[72px] rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-stone-900">General Notes</h2>
        <textarea
          value={profileNotes}
          onChange={(e) => setProfileNotes(e.target.value)}
          className="min-h-[120px] w-full rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
          placeholder="Anything else you want to track..."
        />
      </div>

      {(error || saveMessage) && (
        <div className="rounded-xl border border-emerald-900/10 bg-white/90 p-4">
          {error && <p className="text-sm text-red-700">{error}</p>}
          {saveMessage && (
            <p className="text-sm text-emerald-800">{saveMessage}</p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-emerald-900 px-5 py-3 text-sm font-semibold text-[#fffaf0] hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
