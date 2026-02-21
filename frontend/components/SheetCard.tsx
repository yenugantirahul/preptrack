"use client";

import React from "react";

interface SheetCardProps {
  id: string;
  title: string;
  description: string;
  createdAt?: string | undefined;
}
const SheetCard = ({ id, title, description, createdAt }: SheetCardProps) => {
  return (
    <div
      className="
      group
      bg-white/5 
      border border-white/10 
      rounded-2xl 
      p-6
      transition-all duration-200
      hover:border-indigo-400/40
      hover:bg-white/10
      hover:-translate-y-1
      hover:shadow-2xl
      cursor-pointer
      min-h-[200px]
      flex flex-col justify-between
    "
    >
      {/* Top Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
          {title}
        </h3>

        <p className="text-sm text-white/50 leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 pt-4 border-t border-white/5 text-xs text-white/30 flex justify-between items-center">
        <span>{new Date(createdAt).toLocaleDateString()}</span>

        <span className="opacity-0 group-hover:opacity-100 transition text-indigo-400">
          Open →
        </span>
      </div>
    </div>
  );
};

export default SheetCard;
