"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Listing, ListingFormData } from "@/types/listing";
import { parseHargaText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft } from "lucide-react";

interface ListingFormProps {
  listing?: Listing;
  mode: "create" | "edit";
}

export function ListingForm({ listing, mode }: ListingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ListingFormData>({
    kawasan: listing?.kawasan || "",
    alamat: listing?.alamat || "",
    lt: listing?.lt || "",
    lb: listing?.lb || "",
    kt: listing?.kt || "",
    km: listing?.km || "",
    harga: listing?.harga || "",
    harga_text: listing?.harga_text || "",
    keterangan: listing?.keterangan || "",
    agent_name: listing?.agent_name || "",
    status: listing?.status || "active",
  });

  const updateField = (
    field: keyof ListingFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-parse harga_text to harga
    if (field === "harga_text" && typeof value === "string") {
      const parsed = parseHargaText(value);
      if (parsed) {
        setFormData((prev) => ({ ...prev, harga: parsed }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.agent_name.trim()) {
      setError("Nama agent wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        lt: formData.lt || null,
        lb: formData.lb || null,
        kt: formData.kt || null,
        km: formData.km || null,
        harga: formData.harga || null,
      };

      const url =
        mode === "create"
          ? "/api/listings"
          : `/api/listings/${listing?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Gagal menyimpan listing.");
        return;
      }

      router.push(`/listings/${result.data.id}`);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Agent Name - Priority field */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <Label htmlFor="agent_name" className="text-sm font-semibold">
            Nama Agent <span className="text-destructive">*</span>
          </Label>
          <Input
            id="agent_name"
            placeholder="Masukkan nama agent..."
            value={formData.agent_name}
            onChange={(e) => updateField("agent_name", e.target.value)}
            className="mt-2"
            required
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Nama agent yang bertanggung jawab atas listing ini.
          </p>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-sm">📍 Lokasi</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kawasan">Kawasan / Cluster</Label>
              <Input
                id="kawasan"
                placeholder="contoh: Gading Serpong"
                value={formData.kawasan}
                onChange={(e) => updateField("kawasan", e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                placeholder="contoh: Jl. Mawar No. 12"
                value={formData.alamat}
                onChange={(e) => updateField("alamat", e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specs */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-sm">📐 Spesifikasi</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="lt">LT (m²)</Label>
              <Input
                id="lt"
                type="number"
                placeholder="90"
                value={formData.lt}
                onChange={(e) => updateField("lt", e.target.value ? Number(e.target.value) : "")}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="lb">LB (m²)</Label>
              <Input
                id="lb"
                type="number"
                placeholder="60"
                value={formData.lb}
                onChange={(e) => updateField("lb", e.target.value ? Number(e.target.value) : "")}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="kt">KT</Label>
              <Input
                id="kt"
                type="number"
                placeholder="3"
                value={formData.kt}
                onChange={(e) => updateField("kt", e.target.value ? Number(e.target.value) : "")}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="km">KM</Label>
              <Input
                id="km"
                type="number"
                placeholder="2"
                value={formData.km}
                onChange={(e) => updateField("km", e.target.value ? Number(e.target.value) : "")}
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-sm">💰 Harga</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="harga_text">Harga (Teks)</Label>
              <Input
                id="harga_text"
                placeholder='contoh: 850 Juta (Nego)'
                value={formData.harga_text}
                onChange={(e) => updateField("harga_text", e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tulis harga seperti biasa, angka akan otomatis terbaca.
              </p>
            </div>
            <div>
              <Label htmlFor="harga">Harga (Angka IDR)</Label>
              <Input
                id="harga"
                type="number"
                placeholder="850000000"
                value={formData.harga}
                onChange={(e) => updateField("harga", e.target.value ? Number(e.target.value) : "")}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Otomatis terisi dari harga teks, bisa diedit manual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional info */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-sm">📝 Keterangan & Status</h3>

          <div>
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              placeholder="Siap huni, SHM, carport 1 mobil..."
              value={formData.keterangan}
              onChange={(e) => updateField("keterangan", e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>

          {mode === "edit" && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  updateField("status", (v || "active") as "active" | "sold" | "inactive")
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="sold">Terjual</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {mode === "create" ? "Simpan Listing" : "Update Listing"}
        </Button>
      </div>
    </form>
  );
}
