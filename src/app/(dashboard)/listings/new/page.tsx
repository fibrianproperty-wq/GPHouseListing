import { ListingForm } from "@/components/listings/ListingForm";

export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tambah Listing Baru
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Isi data properti baru untuk ditambahkan ke database.
        </p>
      </div>

      <ListingForm mode="create" />
    </div>
  );
}
