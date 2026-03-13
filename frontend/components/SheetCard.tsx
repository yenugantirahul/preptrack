"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

interface SheetCardProps {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export default function SheetCard({
  id,
  title,
  description,
  createdAt,
  onDelete,
  isDeleting = false,
}: SheetCardProps) {
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    onDelete?.(id);
  };

  return (
    <Link href={`/protected/questions/${id}`} className="block group">
      <div className="relative h-full rounded-2xl border border-white/10 bg-[#12151d] p-5 transition hover:border-white/20 hover:bg-[#151924]">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/55 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Delete sheet"
          title="Delete sheet"
        >
          <Trash2 size={16} />
        </button>

        <div className="pr-12">
          <h3 className="line-clamp-1 text-lg font-semibold tracking-tight text-white">
            {title}
          </h3>

          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/55">
            {description}
          </p>

          {createdAt && (
            <p className="mt-4 text-xs text-white/35">
              Created: {new Date(createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}