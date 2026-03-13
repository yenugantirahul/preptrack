"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  si?: number;
  title?: string;
  url: string;
  platform: string;
  difficulty: string;
  status?: boolean;
}

const PLATFORMS = ["LeetCode", "Codeforces", "CodeChef", "AtCoder"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function TrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white">
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
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

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

      const normalizedQuestions: Question[] = (data.ques ?? []).map((q: any) => ({
        id: String(q.id),
        si: q.si ?? q.no ?? undefined,
        title: q.title,
        url: q.url,
        platform: q.platform,
        difficulty: q.difficulty,
        status: q.status === true,
      }));

      setQuestions(normalizedQuestions);
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
      if (!url || !platform || !difficulty) {
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

      const linkRes = await fetch(
        "http://localhost:3001/api/questions/linkquestion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            qid: curid,
            sid: id,
          }),
        }
      );

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
      alert(error instanceof Error ? error.message : "Failed to create question");
    } finally {
      setLoading(false);
    }
  }
async function toggleQuestionStatus(
  questionId: string,
  currentStatus?: boolean
) {
  const oldStatus = currentStatus === true;
  const newStatus = !oldStatus;

  try {
    setUpdatingStatusId(questionId);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Authentication failed");
    }

    // Optimistic Update
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, status: newStatus } : q
      )
    );

    const res = await fetch(
      `http://localhost:3001/api/questions/updatestatus/${questionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to update status");
    }

  } catch (error) {
    console.error("toggleQuestionStatus error:", error);

    // Revert if failed
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, status: oldStatus } : q
      )
    );

    alert(error instanceof Error ? error.message : "Update failed");
  } finally {
    setUpdatingStatusId(null);
  }
}

  const easyCount = questions.filter((q) => q.difficulty === "Easy").length;
  const mediumCount = questions.filter((q) => q.difficulty === "Medium").length;
  const hardCount = questions.filter((q) => q.difficulty === "Hard").length;

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <div className="border-b border-white/10 bg-[#0f1117]">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 md:px-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                PrepTrack
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Question Tracker
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/55">
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

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:mb-8 xl:grid-cols-4">
          <StatCard label="Total" value={questions.length} />
          <StatCard label="Easy" value={easyCount} />
          <StatCard label="Medium" value={mediumCount} />
          <StatCard label="Hard" value={hardCount} />
        </div>

        <section className="mb-6 rounded-2xl border border-white/10 bg-[#12151d] p-4 shadow-sm sm:mb-8 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Add question</h2>
            <p className="mt-1 text-sm text-white/50">
              Save a problem you solved or want to revise later.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[100px_minmax(0,1fr)_180px_160px_auto]">
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
                className="h-11 w-full rounded-xl bg-white px-5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
              >
                {loading ? "Adding..." : "Add Question"}
              </button>
            </div>
          </div>
        </section>

        <QuestionsList
          questions={questions}
          loading={questionsLoading}
          onToggleStatus={toggleQuestionStatus}
          updatingStatusId={updatingStatusId}
        />
      </main>
    </div>
  );
}

function QuestionsList({
  questions,
  loading,
  onToggleStatus,
  updatingStatusId,
}: {
  questions: Question[];
  loading: boolean;
  onToggleStatus: (questionId: string, currentStatus?: boolean) => void;
  updatingStatusId: string | null;
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
      <div className="rounded-2xl border border-white/10 bg-[#12151d] p-8 text-center sm:p-10">
        <h3 className="text-lg font-semibold tracking-tight">No questions yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
          Start by adding your first coding question from LeetCode, Codeforces,
          CodeChef, or AtCoder.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
        {questions.map((q) => (
          <div
            key={q.id}
            className="rounded-2xl border border-white/10 bg-[#12151d] p-4"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
             

              <StatusToggle
                status={q.status}
                disabled={updatingStatusId === q.id}
                onChange={() => onToggleStatus(q.id, q.status)}
              />
            </div>

            <div className="space-y-3">
              <InfoRow label="Platform" value={q.platform} />
              <InfoRow label="Difficulty" value={q.difficulty} />
              <div>
                <p className="mb-1 text-xs text-white/40">Link</p>
                <a
                  href={q.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-blue-400 hover:underline"
                >
                  {q.title || q.url}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#12151d] lg:block">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight">All Questions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-white/5 text-white/45">
              <tr>
                <th className="px-5 py-4 text-left font-medium sm:px-6">
                  Link
                </th>
                <th className="px-5 py-4 text-left font-medium sm:px-6">
                  Platform
                </th>
                <th className="px-5 py-4 text-left font-medium sm:px-6">Difficulty</th>
                <th className="px-5 py-4 text-left font-medium sm:px-6">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr
                  key={q.id}
                  className="border-t border-white/5 transition hover:bg-white/[0.03]"
                >
                  <td className="max-w-[340px] px-5 py-4 sm:px-6">
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-blue-400 hover:underline"
                    >
                      {q.title || q.url}
                    </a>
                  </td>
                  <td className="px-5 py-4 sm:px-6">{q.platform}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <DifficultyBadge difficulty={q.difficulty} />
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <StatusToggle
                      status={q.status}
                      disabled={updatingStatusId === q.id}
                      onChange={() => onToggleStatus(q.id, q.status)}
                    />
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
function StatusToggle({
  status,
  onChange,
  disabled = false,
}: {
  status?: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const checked = status === true;

  return (
    <label
      className={`inline-flex select-none items-center gap-3 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />

      <span
        className={`flex h-5 w-5 items-center justify-center rounded border transition ${
          checked
            ? "border-white bg-white text-black"
            : "border-white/25 bg-transparent text-transparent"
        }`}
      >
        <svg
          className={`h-3.5 w-3.5 transition ${
            checked ? "opacity-100" : "opacity-0"
          }`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            d="M5 10.5l3 3 7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="text-xs font-medium text-white/80">
        {disabled ? "Updating..." : checked ? "Solved" : "Unsolved"}
      </span>
    </label>
  );
}
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-[92px] flex-col justify-center rounded-2xl border border-white/10 bg-[#12151d] px-4 py-4 sm:px-5">
      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
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
    <div className="flex min-w-0 w-full flex-col gap-2">
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
        className="h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#0d1016] px-3.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
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
    <div className="flex min-w-0 w-full flex-col gap-2">
      <label className="text-sm text-white/70">{label}</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#0d1016] px-3.5 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
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

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    Easy: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    Medium: "border border-amber-500/20 bg-amber-500/10 text-amber-300",
    Hard: "border border-rose-500/20 bg-rose-500/10 text-rose-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
        styles[difficulty] || "border border-white/10 bg-white/5 text-white/70"
      }`}
    >
      {difficulty}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-white/40">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}