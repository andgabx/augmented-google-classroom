"use client";

import { Fragment, type ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "list" | "grid";

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant={value === "list" ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => onChange("list")}
        aria-label="Ver em lista"
      >
        <List />
      </Button>
      <Button
        type="button"
        variant={value === "grid" ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => onChange("grid")}
        aria-label="Ver em blocos"
      >
        <LayoutGrid />
      </Button>
    </div>
  );
}

export function ViewItems<T>({
  view,
  items,
  keyFor,
  renderListItem,
  renderGridItem,
}: {
  view: ViewMode;
  items: T[];
  keyFor: (item: T) => string;
  renderListItem: (item: T) => ReactNode;
  renderGridItem: (item: T) => ReactNode;
}) {
  const className =
    view === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col gap-2";
  const render = view === "grid" ? renderGridItem : renderListItem;

  return (
    <div className={className}>
      {items.map((item) => (
        <Fragment key={keyFor(item)}>{render(item)}</Fragment>
      ))}
    </div>
  );
}
