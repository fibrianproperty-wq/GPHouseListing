"use client";

import Link from "next/link";
import type { Listing } from "@/types/listing";
import { formatHargaSingkat, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  User,
  Calendar,
} from "lucide-react";

interface ListingCardProps {
  listing: Listing;
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

export function ListingCard({ listing }: ListingCardProps) {
  const statusInfo = statusVariants[listing.status] || statusVariants.active;

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="group hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden h-full">
        {/* Color accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-600 group-hover:h-1.5 transition-all" />

        <CardContent className="p-5 space-y-4">
          {/* Header: Kawasan + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/10 to-violet-500/10 shrink-0">
                <Building2 className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {listing.kawasan || "N/A"}
                </h3>
                {listing.alamat && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {listing.alamat}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Ruler className="w-3.5 h-3.5" />
              <span>
                LT {listing.lt || "-"} / LB {listing.lb || "-"} m²
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BedDouble className="w-3.5 h-3.5" />
              <span>{listing.kt || "-"} KT</span>
              <Bath className="w-3.5 h-3.5 ml-1" />
              <span>{listing.km || "-"} KM</span>
            </div>
          </div>

          {/* Price */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  {listing.harga_text || formatHargaSingkat(listing.harga)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {listing.agent_name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {formatDate(listing.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Keterangan preview */}
          {listing.keterangan && (
            <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/50 rounded-lg p-2">
              {listing.keterangan}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
