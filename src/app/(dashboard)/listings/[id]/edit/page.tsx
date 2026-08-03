import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ListingForm } from "@/components/listings/ListingForm";
import type { Listing } from "@/types/listing";

export default async function EditListingPage({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Listing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {listing.kawasan || "N/A"} — {listing.alamat || ""}
        </p>
      </div>

      <ListingForm listing={listing as Listing} mode="edit" />
    </div>
  );
}
