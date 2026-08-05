"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import type { Listing } from "@/types/listing";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingTable } from "@/components/listings/ListingTable";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Building2, Download, Copy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ListingsContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [kawasanOptions, setKawasanOptions] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    kawasan: searchParams.get("kawasan") || "",
    status: searchParams.get("status") || "active",
    harga_min: searchParams.get("harga_min") || "",
    harga_max: searchParams.get("harga_max") || "",
    kt_min: searchParams.get("kt_min") || "",
    hadap: searchParams.get("hadap") || "",
    lt_min: searchParams.get("lt_min") || "",
    lb_min: searchParams.get("lb_min") || "",
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.kawasan) params.set("kawasan", filters.kawasan);
      if (filters.status) params.set("status", filters.status);
      if (filters.harga_min) params.set("harga_min", filters.harga_min);
      if (filters.harga_max) params.set("harga_max", filters.harga_max);
      if (filters.kt_min) params.set("kt_min", filters.kt_min);
      if (filters.hadap) params.set("hadap", filters.hadap);
      if (filters.lt_min) params.set("lt_min", filters.lt_min);
      if (filters.lb_min) params.set("lb_min", filters.lb_min);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/listings?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setListings(result.data || []);
        setTotalCount(result.count || 0);
        setTotalPages(result.totalPages || 1);

        // Extract unique kawasan for filter dropdown
        if (kawasanOptions.length === 0 && result.data) {
          const uniqueKawasan = [
            ...new Set(
              result.data
                .map((l: Listing) => l.kawasan)
                .filter(Boolean) as string[]
            ),
          ];
          setKawasanOptions(uniqueKawasan);
        }
      }
    } catch (error) {
      console.error("Fetch listings error:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, kawasanOptions.length]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const exportToCSV = async () => {
    if (totalCount === 0) return;
    setIsExporting(true);
    
    try {
      // Fetch all data respecting filters but without pagination limit (up to 1000)
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.kawasan) params.set("kawasan", filters.kawasan);
      if (filters.status) params.set("status", filters.status);
      if (filters.harga_min) params.set("harga_min", filters.harga_min);
      if (filters.harga_max) params.set("harga_max", filters.harga_max);
      if (filters.kt_min) params.set("kt_min", filters.kt_min);
      if (filters.hadap) params.set("hadap", filters.hadap);
      if (filters.lt_min) params.set("lt_min", filters.lt_min);
      if (filters.lb_min) params.set("lb_min", filters.lb_min);
      params.set("page", "1");
      params.set("limit", "1000"); // fetch up to 1000 for export

      const response = await fetch(`/api/listings?${params.toString()}`);
      const result = await response.json();
      
      const exportData: Listing[] = result.data || [];
      if (exportData.length === 0) return;

      const headers = ["Kawasan", "Alamat", "LT", "LB", "KT", "KM", "Lantai", "Hadap", "Sertifikat", "Furnished", "Harga", "Harga Text", "Keterangan", "Agent", "Status"];
      const rows = exportData.map(l => [
        l.kawasan || "",
        l.alamat || "",
        l.lt || "",
        l.lb || "",
        l.kt || "",
        l.km || "",
        l.lantai || "",
        l.hadap || "",
        l.sertifikat || "",
        l.furnished || "",
        l.harga || "",
        l.harga_text || "",
        l.keterangan ? l.keterangan.replace(/\n/g, " ") : "",
        l.agent_name || "",
        l.status
      ]);
      
      const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "listings_export.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Gagal mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  };

  const copyResults = async () => {
    if (listings.length === 0) return;
    
    const text = listings.map(l => {
      let res = `🏠 *${l.kawasan || "N/A"}*\n`;
      if (l.alamat) res += `📍 ${l.alamat}\n`;
      if (l.lt || l.lb) res += `📐 LT: ${l.lt || "-"} m² | LB: ${l.lb || "-"} m²\n`;
      if (l.kt || l.km) res += `🛏️ KT: ${l.kt || "-"} | 🚿 KM: ${l.km || "-"}\n`;
      if (l.hadap) res += `🧭 Hadap: ${l.hadap}\n`;
      if (l.harga_text) res += `💰 ${l.harga_text}\n`;
      else if (l.harga) res += `💰 Rp ${l.harga.toLocaleString("id-ID")}\n`;
      return res;
    }).join("\n---\n\n");

    try {
      await navigator.clipboard.writeText(`Hasil Pencarian:\n\n${text}`);
      alert("Hasil disalin ke clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listing Properti</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCount} listing ditemukan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={copyResults} disabled={listings.length === 0}>
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copy Hasil</span>
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportToCSV} disabled={listings.length === 0 || isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExporting ? "Mengekspor..." : "Export CSV"}</span>
          </Button>
          <Link href="/listings/new">
            <Button className="gap-2 shadow-md">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Listing</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <ListingFilters
        filters={filters}
        onFilterChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        kawasanOptions={kawasanOptions}
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg mb-1">Tidak ada listing</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Coba ubah filter atau tambahkan listing baru.
          </p>
          <Link href="/listings/new">
            <Button variant="outline" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Tambah Listing
            </Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <ListingTable listings={listings} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
