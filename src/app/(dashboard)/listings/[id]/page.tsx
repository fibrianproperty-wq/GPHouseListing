import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatHarga, formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  User,
  Calendar,
  Edit,
  ArrowLeft,
} from "lucide-react";
import { DeleteListingButton } from "@/components/listings/DeleteListingButton";
import { MarkAsSoldButton } from "@/components/listings/MarkAsSoldButton";

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

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !listing) {
    notFound();
  }

  const statusInfo = statusVariants[listing.status] || statusVariants.active;

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: allowedUser } = await supabase
      .from("allowed_users")
      .select("role")
      .eq("email", user.email)
      .single();
    isAdmin = allowedUser?.role === "admin";
  }
  const isCreator = user && listing.created_by === user.email;
  const canModify = isAdmin || isCreator;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href="/listings">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {canModify && listing.status === 'active' && (
            <MarkAsSoldButton listingId={id} />
          )}
          {canModify && (
            <Link href={`/listings/${id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </Link>
          )}
          {canModify && (
            <DeleteListingButton listingId={id} />
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-violet-600" />
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {listing.kawasan || "N/A"}
                </h1>
                {listing.alamat && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.alamat}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>

          <Separator />

          {/* Price */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Harga
            </p>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {listing.harga_text || formatHarga(listing.harga)}
            </p>
            {listing.harga && listing.harga_text && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatHarga(listing.harga)}
              </p>
            )}
          </div>

          <Separator />

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <Ruler className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold">{listing.lt || "-"}</p>
              <p className="text-xs text-muted-foreground">LT (m²)</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <Ruler className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold">{listing.lb || "-"}</p>
              <p className="text-xs text-muted-foreground">LB (m²)</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <BedDouble className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold">{listing.kt || "-"}</p>
              <p className="text-xs text-muted-foreground">Kamar Tidur</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <Bath className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold">{listing.km || "-"}</p>
              <p className="text-xs text-muted-foreground">Kamar Mandi</p>
            </div>
          </div>

          {/* Additional Specs */}
          {(listing.lantai || listing.hadap || listing.sertifikat || listing.furnished) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {listing.lantai && (
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Building2 className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{listing.lantai}</p>
                  <p className="text-xs text-muted-foreground">Lantai</p>
                </div>
              )}
              {listing.hadap && (
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <MapPin className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{listing.hadap}</p>
                  <p className="text-xs text-muted-foreground">Hadap</p>
                </div>
              )}
              {listing.sertifikat && (
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{listing.sertifikat}</p>
                  <p className="text-xs text-muted-foreground">Sertifikat</p>
                </div>
              )}
              {listing.furnished && (
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Edit className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold">{listing.furnished}</p>
                  <p className="text-xs text-muted-foreground">Furnished</p>
                </div>
              )}
            </div>
          )}

          {/* Keterangan */}
          {listing.keterangan && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Keterangan
                </p>
                <p className="text-sm leading-relaxed bg-muted/50 rounded-xl p-4">
                  {listing.keterangan}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Agent: <span className="text-foreground font-medium">{listing.agent_name}</span></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Dibuat oleh <span className="text-foreground font-medium">{listing.created_by || listing.telegram_user_id || "Web"}</span> pada {formatDateTime(listing.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Update: {formatDate(listing.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
