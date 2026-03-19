"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import SheetCard from "@/components/SheetCard";

interface Sheet {
  id: string;
  title: string;
  desc: string;
  createdAt?: string;
}

const CreateSheetPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return session?.access_token ?? null;
  }, [supabase]);

  const fetchSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      console.time("fetchSheets total");

      console.time("getSession");
      const token = await getAccessToken();
      console.timeEnd("getSession");

      if (!token) {
        setSheets([]);
        return;
      }

      console.time("apiFetch");
      const res = await fetch(`http://localhost:3001/api/sheets/get`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.timeEnd("apiFetch");

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch sheets");
      }

      const rawSheets = Array.isArray(data)
        ? data
        : Array.isArray(data?.sheets)
        ? data.sheets
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const normalizedSheets: Sheet[] = rawSheets.map((sheet: any) => ({
        id: String(sheet.id),
        title: sheet.title ?? "",
        desc: sheet.desc ?? sheet.description ?? "",
        createdAt: sheet.createdAt ?? sheet.created_at ?? "",
      }));

      setSheets(normalizedSheets);
    } catch (err) {
      console.error("fetchSheets error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sheets");
      setSheets([]);
    } finally {
      console.timeEnd("fetchSheets total");
      setLoading(false);
    }
  }, [getAccessToken]);

  const createSheet = async (sheetTitle: string, sheetDesc: string) => {
    try {
      setCreating(true);

      const token = await getAccessToken();

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`http://localhost:3001/api/sheets/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: sheetTitle,
          desc: sheetDesc,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create sheet");
      }

      return data;
    } catch (err: any) {
      console.error("createSheet error:", err);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  const deleteSheet = async (sheetId: string) => {
    try {
      setDeletingId(sheetId);

      const token = await getAccessToken();

      if (!token) {
        throw new Error("User not authenticated");
      }

      const res = await fetch(`http://localhost:3001/api/sheets/delete/${sheetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete sheet");
      }

      setSheets((prev) => prev.filter((sheet) => sheet.id !== sheetId));
    } catch (err) {
      console.error("deleteSheet error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete sheet");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        fetchSheets();
      }

      if (event === "SIGNED_OUT") {
        setSheets([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchSheets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      alert("Please fill all fields");
      return;
    }

    try {
      await createSheet(trimmedTitle, trimmedDescription);

      setTitle("");
      setDescription("");
      setShowForm(false);

      await fetchSheets();
    } catch (err) {
      console.error("handleSubmit error:", err);
      alert(err instanceof Error ? err.message : "Failed to create sheet");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="border-b border-white/10 bg-[#0f1117]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                PrepTrack
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                My Sheets
              </h1>
              <p className="mt-2 text-sm text-white/55">
                Organize your preparation sheets in one place.
              </p>
            </div>

            <div className="text-sm text-white/45">
              {sheets.length} sheet{sheets.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Workspace</h2>
            <p className="mt-1 text-sm text-white/45">
              Create and manage your coding sheets.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className={`h-11 rounded-xl px-5 text-sm font-medium transition ${
              showForm
                ? "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            {showForm ? "Cancel" : "New Sheet"}
          </button>
        </div>

        {showForm && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-[#12151d] p-4 sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold tracking-tight">
                Create a new sheet
              </h3>
              <p className="mt-1 text-sm text-white/50">
                Add a title and description for your sheet.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Title</label>
                <input
                  type="text"
                  placeholder="Arrays Revision"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-[#0d1016] px-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Description</label>
                <input
                  type="text"
                  placeholder="Important problems for arrays"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-[#0d1016] px-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="h-11 w-full rounded-xl bg-white px-5 text-sm font-medium text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                >
                  {creating ? "Creating..." : "Create Sheet"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl border border-white/10 bg-[#12151d]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-500/20 bg-[#12151d] px-6 text-center">
              <h3 className="text-xl font-semibold tracking-tight text-red-400">
                Failed to load sheets
              </h3>
              <p className="mt-2 max-w-md text-sm text-white/45">{error}</p>
              <button
                onClick={fetchSheets}
                className="mt-6 h-11 rounded-xl bg-white px-5 text-sm font-medium text-black hover:bg-neutral-200"
              >
                Retry
              </button>
            </div>
          ) : sheets.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#12151d] px-6 text-center">
              <h3 className="text-xl font-semibold tracking-tight">
                No sheets yet
              </h3>
              <p className="mt-2 max-w-md text-sm text-white/45">
                Create your first sheet to start organizing your preparation.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 h-11 rounded-xl bg-white px-5 text-sm font-medium text-black hover:bg-neutral-200"
              >
                Create First Sheet
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sheets.map((sheet) => (
                <SheetCard
                  key={sheet.id}
                  id={sheet.id}
                  title={sheet.title}
                  description={sheet.desc}
                  createdAt={sheet.createdAt}
                  onDelete={deleteSheet}
                  isDeleting={deletingId === sheet.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CreateSheetPage;