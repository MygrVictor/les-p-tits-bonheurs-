"use client";

import { useState } from "react";
import { stones } from "@/lib/catalog";

export function FilterPierres() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          Filtre pierres
        </p>
        <h2 className="font-serif text-2xl text-ink sm:text-3xl">
          Sélectionnez une pierre
        </h2>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex gap-3 pb-2 sm:flex-wrap sm:pb-0">
          {stones.map((stone) => (
            <button
              key={stone.id}
              onClick={() => setActive(active === stone.id ? null : stone.id)}
              className={`group flex shrink-0 flex-col items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-soft transition duration-200 active:scale-95 hover:-translate-y-0.5 ${
                active === stone.id
                  ? "ring-2 ring-blush-400 ring-offset-2"
                  : ""
              }`}
            >
              <span
                className="h-9 w-9 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: stone.color }}
              />
              <span className="text-sm font-semibold text-ink">
                {stone.name}
              </span>
              <span className="max-w-[7rem] text-center text-[11px] leading-4 text-neutral-500">
                {stone.virtues}
              </span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stones.find((s) => s.id === active)?.color }}
          />
          <p className="text-xs text-neutral-600">
            <span className="font-semibold text-ink">
              {stones.find((s) => s.id === active)?.name}
            </span>
            {" — "}
            {stones.find((s) => s.id === active)?.virtues}
          </p>
          <button
            onClick={() => setActive(null)}
            className="ml-auto text-xs text-neutral-400 underline"
          >
            Effacer
          </button>
        </div>
      )}
    </section>
  );
}
