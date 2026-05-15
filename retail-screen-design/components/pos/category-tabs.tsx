"use client";

import { cn } from "@/lib/utils";
import { categories as defaultCategories } from "@/lib/store";

interface CategoryTabsProps {
  selected: string;
  onSelect: (category: string) => void;
  categories?: string[];
}

export function CategoryTabs({
  selected,
  onSelect,
  categories: categoriesProp,
}: CategoryTabsProps) {
  const categories = categoriesProp ?? defaultCategories;
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
            selected === category
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card text-foreground hover:bg-secondary border border-border"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
