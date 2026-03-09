"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  serialNo: number;
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
    <Suspense fallback={<div className="p-4 sm:p-6 text-white">Loading...</div>}>
      <TrackerContent />
    </Suspense>
  );
}

function TrackerContent() {
  const params = useParams();
  const id = params.id as string;
  const num = Number(id)

  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [platform, setPlatForm] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [si, setSi] = useState<number>(0);

  const [questions, setQuestions] = useState<Question[]>([]);

  const supabase = createClient();

  const fetchQuestions = async () => {
  try {
    setQuestionsLoading(true);

    const res = await fetch(
      `http://localhost:3001/api/questions/getquestions/${num}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) throw new Error("Failed to fetch questions");

    const data = await res.json();
    setQuestions(data.ques);
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
 console.log(questions)
  async function createQuestion() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("http://localhost:3001/api/questions/create", {
        method: "POST",
    
        body: JSON.stringify({
          no: Number(si),
          difficulty,
          url,
          platform,
        }),
      });

      if (!res.ok) throw new Error("Failed to create question");

      const data = await res.json();
      const curid = data.id;

      const link = await fetch("http://localhost:3001/api/questions/linkquestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          qid: curid,
          sid: id,
        }),
      });

      if (!link.ok) throw new Error("Failed to link question");

      setSi(0);
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

  function handleSubmit() {
   
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-gray-200 font-sans">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <StatCard label="Total" value={questions.length} />
          <StatCard
            label="Easy"
            value={questions.filter((q) => q.difficulty === "Easy").length}
          />
          <StatCard
            label="Medium"
            value={questions.filter((q) => q.difficulty === "Medium").length}
          />
          <StatCard
            label="Hard"
            value={questions.filter((q) => q.difficulty === "Hard").length}
          />
        </div>

        <div className="bg-[#0d1018] border border-blue-500/20 rounded-xl p-4 sm:p-5 md:p-6 shadow-lg mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center gap-3 mb-5 sm:mb-6">
            <div className="w-9 h-9 shrink-0 rounded-md flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
              ➕
            </div>

            <div>
              <div className="text-sm sm:text-base font-semibold">Add Coding Problem</div>
              <div className="text-xs sm:text-sm text-gray-500">
                Store problems you solve across platforms
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[90px_minmax(0,1fr)_180px_160px_auto] gap-3">
            <Input setValue={setSi} label="No." type="number" value={si} />
            <Input setValue={setUrl} label="Url" value={url} />

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

            <button
              type="button"
              onClick={createQuestion}
              disabled={loading}
              className="h-[42px] w-full xl:w-auto px-5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:translate-y-[-1px] transition disabled:opacity-50 mt-1 sm:mt-0"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

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
      <div className="bg-[#0d1018] border border-white/10 rounded-xl p-4 sm:p-6">
        <p className="text-sm text-gray-400">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-[#0d1018] border border-white/10 rounded-xl p-4 sm:p-6">
        <p className="text-sm text-gray-400">No questions added yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile / Tablet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-[#0d1018] border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Question No.</p>
                <p className="text-sm font-semibold">{q.serialNo}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10">
                {q.status || "Todo"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Platform</p>
                <p className="text-sm">{q.platform}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                <p className="text-sm">{q.difficulty}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Link</p>
                <a
                  href={`https://leetcode.com/${q.title}`}
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

      {/* Desktop Table */}
      <div className="hidden lg:block bg-[#0d1018] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-white/10">
          <h2 className="text-base sm:text-lg font-semibold">All Questions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="text-left px-4 sm:px-6 py-4 font-medium">No.</th>
                <th className="text-left px-4 sm:px-6 py-4 font-medium">Platform</th>
                <th className="text-left px-4 sm:px-6 py-4 font-medium">Difficulty</th>
                <th className="text-left px-4 sm:px-6 py-4 font-medium">Link</th>
                <th className="text-left px-4 sm:px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-t border-white/5">
                  <td className="px-4 sm:px-6 py-4">{q.si}</td>
                  <td className="px-4 sm:px-6 py-4">{q.platform}</td>
                  <td className="px-4 sm:px-6 py-4">{q.difficulty}</td>
                  <td className="px-4 sm:px-6 py-4 max-w-[320px]">
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline break-all"
                    >
                      {q.title || q.url}
                    </a>
                  </td>
                  <td className="px-4 sm:px-6 py-4">{q.status || "Todo"}</td>
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
    <div className="bg-[#0d1018] border border-white/10 rounded-xl px-4 sm:px-5 py-4 min-h-[92px] flex flex-col justify-center">
      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2">
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Input({
  label,
  setValue,
  type = "text",
  value,
}: {
  label: string;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  type?: string;
  value: any;
}) {
  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        value={value}
        onChange={(e) =>
          setValue(type === "number" ? Number(e.target.value) : e.target.value)
        }
        type={type}
        className="w-full min-w-0 bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
    <div className="flex flex-col gap-1 w-full min-w-0">
      <label className="text-xs text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full min-w-0 bg-black border text-grey border-black/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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