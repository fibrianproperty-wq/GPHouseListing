"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, LayoutGrid, List } from "lucide-react";

interface FilterValues {
  search: string;
  kawasan: string;
  status: string;
  harga_min: string;
  harga_max: string;
  kt_min: string;
}

interface ListingFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  kawasanOptions: string[];
}

export function ListingFilters({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  kawasanOptions,
}: ListingFiltersProps) {
  const updateFilter = useCallback(
    (key: keyof FilterValues, value: string) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange]
  );

  const clearFilters = useCallback(() => {
    onFilterChange({
      search: "",
      kawasan: "",
      status: "active",
      harga_min: "",
      harga_max: "",
      kt_min: "",
    });
  }, [onFilterChange]);

  const hasActiveFilters =
    filters.search ||
    filters.kawasan ||
    filters.status !== "active" ||
    filters.harga_min ||
    filters.harga_max ||
    filters.kt_min;

  return (
    <div className="space-y-3">
      {/* Top row: Search + View toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari kawasan, alamat, agent..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("table")}
            className={`p-2 transition-colors ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.kawasan || "all"}
          onValueChange={(v) => updateFilter("kawasan", v === "all" || v === null ? "" : v)}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Kawasan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kawasan</SelectItem>
            {kawasanOptions.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => updateFilter("status", v || "")}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="sold">Terjual</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Harga Min"
          value={filters.harga_min}
          onChange={(e) => updateFilter("harga_min", e.target.value)}
          className="w-[130px] h-9 text-sm"
        />

        <Input
          type="number"
          placeholder="Harga Max"
          value={filters.harga_max}
          onChange={(e) => updateFilter("harga_max", e.target.value)}
          className="w-[130px] h-9 text-sm"
        />

        <Select
          value={filters.kt_min || "any"}
          onValueChange={(v) => updateFilter("kt_min", v === "any" || v === null ? "" : v)}
        >
          <SelectTrigger className="w-[110px] h-9 text-sm">
            <SelectValue placeholder="Min KT" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">KT: Any</SelectItem>
            <SelectItem value="1">≥ 1 KT</SelectItem>
            <SelectItem value="2">≥ 2 KT</SelectItem>
            <SelectItem value="3">≥ 3 KT</SelectItem>
            <SelectItem value="4">≥ 4 KT</SelectItem>
            <SelectItem value="5">≥ 5 KT</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-xs text-muted-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
