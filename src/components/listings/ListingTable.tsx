"use client";

import Link from "next/link";
import type { Listing } from "@/types/listing";
import { formatHargaSingkat, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ListingTableProps {
  listings: Listing[];
}

const statusVariants: Record<string, { label: string; className: string }> = {
  active: {
    label: "Aktif",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  sold: {
    label: "Terjual",
    className: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  },
  inactive: {
    label: "Nonaktif",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
};

export function ListingTable({ listings }: ListingTableProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Tidak ada listing ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Kawasan</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Alamat</TableHead>
            <TableHead className="font-semibold text-center">LT/LB</TableHead>
            <TableHead className="font-semibold text-center">KT/KM</TableHead>
            <TableHead className="font-semibold">Harga</TableHead>
            <TableHead className="font-semibold hidden lg:table-cell">Agent</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold hidden lg:table-cell">Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => {
            const statusInfo =
              statusVariants[listing.status] || statusVariants.active;

            return (
              <TableRow
                key={listing.id}
                className="hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <TableCell>
                  <Link
                    href={`/listings/${listing.id}`}
                    className="font-medium text-sm hover:text-primary transition-colors"
                  >
                    {listing.kawasan || "N/A"}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                  {listing.alamat || "-"}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {listing.lt || "-"}/{listing.lb || "-"}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {listing.kt || "-"}/{listing.km || "-"}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-sm">
                    {listing.harga_text || formatHargaSingkat(listing.harga)}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {listing.agent_name}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={statusInfo.className}>
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(listing.created_at)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
