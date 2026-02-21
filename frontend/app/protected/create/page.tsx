"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SheetCard from "@/components/SheetCard";

const CreateSheetPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const fetchSheets = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      const res = await fetch("http://localhost:3001/api/sheets/get", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch sheets");

      const data = await res.json();
      setSheets(data.sheets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function createSheet(title: string, desc: string, token: string) {
    try {
      const response = await fetch("http://localhost:3001/api/sheets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, desc }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
    } catch (err: any) {
      console.error(err.message);
    }
  }

  useEffect(() => {
    fetchSheets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      alert("User not authenticated");
      return;
    }

    await createSheet(title, description, token);

    setTitle("");
    setDescription("");
    setShowForm(false);
    fetchSheets();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#0d0d0d] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 lg:px-10 border-b border-white/5 backdrop-blur-md bg-black/70">
        <div className="font-mono text-sm uppercase tracking-wider text-white/50">
          <span className="text-indigo-400">■</span> Sheets
        </div>

        <div className="text-sm text-white/30 font-mono">
          {sheets.length > 0 &&
            `${sheets.length} document${sheets.length !== 1 ? "s" : ""}`}
        </div>
      </nav>

      {/* CONTENT */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-16">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-2">
              Workspace
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              My Sheets
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Organize and manage your documents
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              showForm
                ? "border border-white/10 text-white/60 hover:bg-white/5"
                : "bg-white text-black hover:bg-neutral-200 hover:-translate-y-0.5 hover:shadow-lg"
            }`}
          >
            {showForm ? "Cancel" : "New Sheet"}
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10 transition-all duration-200">
            <div className="text-xs font-mono uppercase tracking-widest text-white/30 mb-6">
              New document
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col lg:flex-row gap-4"
            >
              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Untitled sheet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:border-indigo-400 focus:bg-indigo-400/5 outline-none transition"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="What's this sheet about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:border-indigo-400 focus:bg-indigo-400/5 outline-none transition"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-indigo-500 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-all"
              >
                Create →
              </button>
            </form>
          </div>
        )}

        {/* GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-52 bg-white/5 rounded-2xl animate-pulse"
              />
            ))
          ) : sheets.length === 0 ? (
            <div className="col-span-full text-center py-24 text-white/30">
              No sheets yet — create one to get started.
            </div>
          ) : (
            sheets.map((sheet) => (
              <SheetCard
                key={sheet.id}
                id={sheet.id}
                title={sheet.title}
                description={sheet.desc}
                createdAt={sheet.createdAt}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSheetPage;
