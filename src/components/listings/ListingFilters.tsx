"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, LayoutGrid, List, Check, ChevronsUpDown, SlidersHorizontal } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface FilterValues {
  search: string;
  kawasan: string; // comma-separated
  status: string;
  harga_min: string;
  harga_max: string;
  kt_min: string;
  hadap: string;
  lt_min: string;
  lb_min: string;
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
  const [kawasanSearch, setKawasanSearch] = useState("");

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
      hadap: "",
      lt_min: "",
      lb_min: "",
    });
  }, [onFilterChange]);

  const hasActiveFilters =
    filters.search ||
    filters.kawasan ||
    filters.status !== "active" ||
    filters.harga_min ||
    filters.harga_max ||
    filters.kt_min ||
    filters.hadap ||
    filters.lt_min ||
    filters.lb_min;

  // Derived state for kawasan
  const selectedKawasan = filters.kawasan ? filters.kawasan.split(",").filter(Boolean) : [];
  
  const toggleKawasan = (k: string) => {
    if (selectedKawasan.includes(k)) {
      const newSelected = selectedKawasan.filter((item) => item !== k);
      updateFilter("kawasan", newSelected.join(","));
    } else {
      const newSelected = [...selectedKawasan, k];
      updateFilter("kawasan", newSelected.join(","));
    }
  };

  const filteredKawasanOptions = kawasanOptions.filter((k) =>
    k.toLowerCase().includes(kawasanSearch.toLowerCase())
  );

  // Helper for displaying active price filter
  const hasHargaFilter = filters.harga_min || filters.harga_max;
  const getHargaLabel = () => {
    if (filters.harga_min && filters.harga_max) return `Rp ${Number(filters.harga_min)/1000000}M - ${Number(filters.harga_max)/1000000}M`;
    if (filters.harga_min) return `> Rp ${Number(filters.harga_min)/1000000}M`;
    if (filters.harga_max) return `< Rp ${Number(filters.harga_max)/1000000}M`;
    return "Harga";
  };

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
            className="pl-9 h-10 shadow-sm"
          />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden shadow-sm bg-background">
          <button
            onClick={() => onViewModeChange("table")}
            className={`p-2.5 transition-colors ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2.5 transition-colors border-l border-border ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Multi-Select Kawasan Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 justify-between text-sm min-w-[160px] bg-background shadow-sm font-normal"
            >
              <div className="flex items-center gap-2 truncate">
                {selectedKawasan.length > 0 ? (
                  <>
                    <span className="truncate max-w-[100px]">{selectedKawasan.join(", ")}</span>
                    <Badge variant="secondary" className="ml-1 px-1 h-5 rounded-sm">
                      {selectedKawasan.length}
                    </Badge>
                  </>
                ) : (
                  <span className="text-muted-foreground">Semua Kawasan</span>
                )}
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <div className="p-2 border-b border-border">
              <Input 
                placeholder="Cari kawasan..." 
                value={kawasanSearch}
                onChange={(e) => setKawasanSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredKawasanOptions.length === 0 ? (
                <p className="text-xs text-center py-4 text-muted-foreground">Tidak ditemukan.</p>
              ) : (
                filteredKawasanOptions.map((k) => {
                  const isChecked = selectedKawasan.includes(k);
                  return (
                    <div 
                      key={k} 
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                      onClick={() => toggleKawasan(k)}
                    >
                      <Checkbox id={`kws-${k}`} checked={isChecked} onCheckedChange={() => toggleKawasan(k)} />
                      <label htmlFor={`kws-${k}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                        {k}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
            {selectedKawasan.length > 0 && (
              <div className="p-2 border-t border-border">
                <Button variant="ghost" className="w-full h-8 text-xs" onClick={() => updateFilter("kawasan", "")}>
                  Hapus Pilihan
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Harga Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={hasHargaFilter ? "default" : "outline"}
              className="h-9 text-sm bg-background shadow-sm font-normal"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-2" />
              {getHargaLabel()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Rentang Harga (Rp)</h4>
              <div className="flex items-center gap-2">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs text-muted-foreground">Minimal</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={filters.harga_min}
                    onChange={(e) => updateFilter("harga_min", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="mt-5 text-muted-foreground">-</div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs text-muted-foreground">Maksimal</label>
                  <Input 
                    type="number" 
                    placeholder="Tak terhingga" 
                    value={filters.harga_max}
                    onChange={(e) => updateFilter("harga_max", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => { updateFilter("harga_min", ""); updateFilter("harga_max", "1000000000"); }}>
                  &lt; 1 M
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => { updateFilter("harga_min", "1000000000"); updateFilter("harga_max", "3000000000"); }}>
                  1 M - 3 M
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => { updateFilter("harga_min", "3000000000"); updateFilter("harga_max", ""); }}>
                  &gt; 3 M
                </Badge>
              </div>

              {(filters.harga_min || filters.harga_max) && (
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={() => { updateFilter("harga_min", ""); updateFilter("harga_max", ""); }}>
                  Reset Harga
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Dropdown */}
        <Select
          value={filters.status}
          onValueChange={(v) => updateFilter("status", v || "")}
        >
          <SelectTrigger className="w-[120px] h-9 text-sm bg-background shadow-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="sold">Terjual</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.kt_min || "any"}
          onValueChange={(v) => updateFilter("kt_min", v === "any" || v === null ? "" : v)}
        >
          <SelectTrigger className="w-[110px] h-9 text-sm bg-background shadow-sm">
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

        <Input
          placeholder="Hadap (Cth: Selatan)"
          value={filters.hadap || ""}
          onChange={(e) => updateFilter("hadap", e.target.value)}
          className="w-[140px] h-9 text-sm bg-background shadow-sm"
        />

        <Input
          type="number"
          placeholder="Min LT (m²)"
          value={filters.lt_min || ""}
          onChange={(e) => updateFilter("lt_min", e.target.value)}
          className="w-[110px] h-9 text-sm bg-background shadow-sm"
        />

        <Input
          type="number"
          placeholder="Min LB (m²)"
          value={filters.lb_min || ""}
          onChange={(e) => updateFilter("lb_min", e.target.value)}
          className="w-[110px] h-9 text-sm bg-background shadow-sm"
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-xs text-muted-foreground ml-auto sm:ml-0"
          >
            <X className="w-3 h-3 mr-1" />
            Reset Semua
          </Button>
        )}
      </div>
    </div>
  );
}
