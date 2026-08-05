import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { CopyListingButton } from "@/components/listings/CopyListingButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch stats
  const [
    { count: totalListings },
    { count: activeListings },
    { count: soldListings },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "sold"),
  ]);

  // Fetch recent listings
  const { data: recentListings } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      label: "Total Listing",
      value: totalListings || 0,
      icon: Building2,
      gradient: "from-blue-500 to-cyan-500",
      shadowColor: "shadow-blue-500/20",
    },
    {
      label: "Listing Aktif",
      value: activeListings || 0,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-green-500",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      label: "Terjual",
      value: soldListings || 0,
      icon: CheckCircle,
      gradient: "from-violet-500 to-purple-500",
      shadowColor: "shadow-violet-500/20",
    },
    {
      label: "Agent Aktif",
      value: new Set(
        (recentListings || []).map((l) => l.agent_name).filter(Boolean)
      ).size,
      icon: Users,
      gradient: "from-amber-500 to-orange-500",
      shadowColor: "shadow-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ringkasan data listing properti tim Anda.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="relative overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-card to-muted/20"
          >
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="order-2 sm:order-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1 leading-none">{stat.value}</p>
                </div>
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadowColor} order-1 sm:order-2 shrink-0`}
                >
                  <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/listings/new">
          <Card className="group cursor-pointer border-dashed border-2 hover:border-primary/50 hover:bg-accent/50 transition-all duration-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-md group-hover:shadow-lg transition-shadow">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Tambah Listing Baru</h3>
                <p className="text-sm text-muted-foreground">
                  Input data properti baru via web dashboard
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/listings">
          <Card className="group cursor-pointer border-dashed border-2 hover:border-primary/50 hover:bg-accent/50 transition-all duration-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md group-hover:shadow-lg transition-shadow">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Lihat Semua Listing</h3>
                <p className="text-sm text-muted-foreground">
                  Browse, filter, dan kelola data listing
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Listings */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-lg mb-4">Listing Terbaru</h3>
          {recentListings && recentListings.length > 0 ? (
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {listing.kawasan || "N/A"}{" "}
                        {listing.alamat && (
                          <span className="text-muted-foreground font-normal">
                            — {listing.alamat}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        LT {listing.lt || "-"} m² · LB {listing.lb || "-"} m² ·{" "}
                        {listing.kt || "-"} KT · {listing.km || "-"} KM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-right shrink-0 ml-4 gap-3">
                    <div>
                      <p className="font-semibold text-sm">
                        {listing.harga_text ||
                          (listing.harga
                            ? `Rp ${listing.harga.toLocaleString("id-ID")}`
                            : "-")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {listing.agent_name}
                      </p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <CopyListingButton listing={listing} variant="ghost" size="icon" showText={false} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Belum ada listing.</p>
              <p className="text-xs mt-1">
                Mulai tambahkan listing baru atau gunakan Telegram Bot.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
