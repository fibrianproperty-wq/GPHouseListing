"use client";

import { useState, useEffect, useCallback } from "react";
import type { Listing } from "@/types/listing";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingTable } from "@/components/listings/ListingTable";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Building2 } from "lucide-react";
import Link from "next/link";

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [kawasanOptions, setKawasanOptions] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    search: "",
    kawasan: "",
    status: "active",
    harga_min: "",
    harga_max: "",
    kt_min: "",
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
        <Link href="/listings/new">
          <Button className="gap-2 shadow-md">
            <PlusCircle className="w-4 h-4" />
            Tambah Listing
          </Button>
        </Link>
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
