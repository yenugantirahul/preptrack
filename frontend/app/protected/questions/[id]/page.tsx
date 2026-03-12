"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  si: number;
  title?: string;
  url: string;
  platform: string;
  difficulty: string;
  status?: "Solved" | "Attempted" | "Todo";
}

const PLATFORMS = ["LeetCode", "Codeforces", "CodeChef", "AtCoder"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function TrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center">
          <div className="text-sm text-white/60">Loading...</div>
        </div>
      }
    >
      <TrackerContent />
    </Suspense>
  );
}

function TrackerContent() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [platform, setPlatForm] = useState("");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [si, setSi] = useState<number | "">("");

  const [questions, setQuestions] = useState<Question[]>([]);

  const supabase = useMemo(() => createClient(), []);

  const fetchQuestions = async () => {
    try {
      setQuestionsLoading(true);

      const res = await fetch(
        `http://localhost:3001/api/questions/getquestions/${id}`,
        {
          method: "GET",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await res.json();
      setQuestions(data.ques ?? []);
    } catch (error) {
      console.error("fetchQuestions error:", error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchQuestions();
  }, [id]);

  async function createQuestion() {
    try {
      if (!si || !url || !platform || !difficulty) {
        alert("Please fill all fields");
        return;
      }

      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error(
          "Authentication failed: " + (sessionError?.message || "No session")
        );
      }

      const res = await fetch("http://localhost:3001/api/questions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          no: Number(si),
          difficulty,
          url,
          platform,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to create question");
      }

      const data = await res.json();
      const curid = data.question?.id;

      if (!curid) {
        throw new Error("Question ID not returned from backend");
      }

      const linkRes = await fetch("http://localhost:3001/api/questions/linkquestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          qid: curid,
          sid: id,
        }),
      });

      if (!linkRes.ok) {
        const errData = await linkRes.json().catch(() => null);
        throw new Error(errData?.error || "Failed to link question");
      }

      setSi("");
      setUrl("");
      setPlatForm("");
      setDifficulty("");

      await fetchQuestions();
    } catch (error) {
      console.error("createQuestion error:", error);
    } finally {
      setLoading(false);
    }
  }

  const easyCount = questions.filter((q) => q.difficulty === "Easy").length;
  const mediumCount = questions.filter((q) => q.difficulty === "Medium").length;
  const hardCount = questions.filter((q) => q.difficulty === "Hard").length;

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <div className="border-b border-white/10 bg-[#0f1117]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                PrepTrack
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
                Question Tracker
              </h1>
              <p className="mt-2 text-sm text-white/55 max-w-2xl">
                Add and organize coding problems from different platforms in one
                simple workspace.
              </p>
            </div>

            <div className="text-sm text-white/45">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <StatCard label="Total" value={questions.length} />
          <StatCard label="Easy" value={easyCount} />
          <StatCard label="Medium" value={mediumCount} />
          <StatCard label="Hard" value={hardCount} />
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#12151d] p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Add question</h2>
            <p className="mt-1 text-sm text-white/50">
              Save a problem you solved or want to revise later.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[100px_minmax(0,1fr)_180px_160px_auto] gap-4">
            <Input setValue={setSi} label="No." type="number" value={si} />
            <Input
              setValue={setUrl}
              label="Problem URL"
              value={url}
              placeholder="https://..."
            />
            <Select
              setValue={setPlatForm}
              label="Platform"
              options={PLATFORMS}
              value={platform}
            />
            <Select
              setValue={setDifficulty}
              label="Difficulty"
              options={DIFFICULTIES}
              value={difficulty}
            />

            <div className="flex items-end">
              <button
                type="button"
                onClick={createQuestion}
                disabled={loading}
                className="h-11 w-full xl:w-auto px-5 rounded-xl bg-white text-black text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add Question"}
              </button>
            </div>
          </div>
        </section>

        <QuestionsList questions={questions} loading={questionsLoading} />
      </main>
    </div>
  );
}

function QuestionsList({
  questions,
  loading,
}: {
  questions: Question[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12151d] p-5 sm:p-6">
        <p className="text-sm text-white/55">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12151d] p-8 sm:p-10 text-center">
        <h3 className="text-lg font-semibold tracking-tight">No questions yet</h3>
        <p className="mt-2 text-sm text-white/50 max-w-md mx-auto">
          Start by adding your first coding question from LeetCode, Codeforces,
          CodeChef, or AtCoder.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {questions.map((q) => (
          <div
            key={q.id}
            className="rounded-2xl border border-white/10 bg-[#12151d] p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Question No.</p>
                <p className="text-sm font-semibold">{q.si}</p>
              </div>
              <StatusBadge status={q.status || "Todo"} />
            </div>

            <div className="space-y-3">
              <InfoRow label="Platform" value={q.platform} />
              <InfoRow label="Difficulty" value={q.difficulty} />
              <div>
                <p className="text-xs text-white/40 mb-1">Link</p>
                <a
                  href={q.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-400 hover:underline break-all"
                >
                  {q.title || q.url}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block rounded-2xl border border-white/10 bg-[#12151d] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold tracking-tight">All Questions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-white/5 text-white/45">
              <tr>
                <th className="text-left px-5 sm:px-6 py-4 font-medium">No.</th>
                <th className="text-left px-5 sm:px-6 py-4 font-medium">Platform</th>
                <th className="text-left px-5 sm:px-6 py-4 font-medium">Difficulty</th>
                <th className="text-left px-5 sm:px-6 py-4 font-medium">Link</th>
                <th className="text-left px-5 sm:px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr
                  key={q.id}
                  className="border-t border-white/5 hover:bg-white/[0.03] transition"
                >
                  <td className="px-5 sm:px-6 py-4">{q.si}</td>
                  <td className="px-5 sm:px-6 py-4">{q.platform}</td>
                  <td className="px-5 sm:px-6 py-4">
                    <DifficultyBadge difficulty={q.difficulty} />
                  </td>
                  <td className="px-5 sm:px-6 py-4 max-w-[340px]">
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline break-all"
                    >
                      {q.title || q.url}
                    </a>
                  </td>
                  <td className="px-5 sm:px-6 py-4">
                    <StatusBadge status={q.status || "Todo"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12151d] px-4 sm:px-5 py-4 min-h-[92px] flex flex-col justify-center">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2">
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Input({
  label,
  setValue,
  type = "text",
  value,
  placeholder,
}: {
  label: string;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  type?: string;
  value: any;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <label className="text-sm text-white/70">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          setValue(
            type === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value
          )
        }
        type={type}
        className="h-11 w-full min-w-0 rounded-xl bg-[#0d1016] border border-white/10 px-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
      />
    </div>
  );
}

function Select({
  label,
  setValue,
  options,
  value,
}: {
  label: string;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  options: string[];
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <label className="text-sm text-white/70">{label}</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 w-full min-w-0 rounded-xl bg-[#0d1016] text-white border border-white/10 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "Solved" | "Attempted" | "Todo";
}) {
  const styles = {
    Solved: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
    Attempted: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
    Todo: "bg-white/5 text-white/70 border border-white/10",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    Easy: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
    Hard: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
        styles[difficulty] || "bg-white/5 text-white/70 border border-white/10"
      }`}
    >
      {difficulty}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}