"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Search } from "lucide-react";

export default function SmartSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/smart-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const params = new URLSearchParams();
        const data = result.data;
        
        if (data.kawasan) params.set("kawasan", data.kawasan);
        if (data.harga_min) params.set("harga_min", data.harga_min.toString());
        if (data.harga_max) params.set("harga_max", data.harga_max.toString());
        if (data.kt_min) params.set("kt_min", data.kt_min.toString());
        if (data.km_min) params.set("km_min", data.km_min.toString());
        if (data.hadap) params.set("hadap", data.hadap);
        if (data.lt_min) params.set("lt_min", data.lt_min.toString());
        if (data.lb_min) params.set("lb_min", data.lb_min.toString());
        if (data.keyword) params.set("search", data.keyword);

        router.push(`/listings?${params.toString()}`);
      }
    } catch (error) {
      console.error("Smart search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Smart Search</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cari properti menggunakan bahasa natural (AI).
        </p>
      </div>

      <Card className="border-primary/20 shadow-lg shadow-primary/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium mb-2">
            <Sparkles className="w-5 h-5" />
            <h3>Pencarian Pintar (AI)</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Ketikkan kriteria rumah yang Anda cari. AI akan otomatis menerjemahkannya ke dalam filter.
          </p>
          
          <Textarea
            placeholder="Contoh: Cari rumah di BSD, budget di bawah 2M, hadap utara, luas tanah minimal 100m, kamar tidur minimal 3..."
            className="min-h-[120px] resize-none bg-accent/50 border-accent focus:bg-background transition-colors text-base p-4"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSearch} 
              disabled={loading || !query.trim()}
              className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? "Memproses..." : "Cari Properti"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-2">Contoh 1:</h4>
            <p className="text-xs text-muted-foreground italic">
              "Tolong carikan rumah di Gading Serpong, budget 3 sampai 4 Miliar, yang ada 4 kamar tidur"
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-2">Contoh 2:</h4>
            <p className="text-xs text-muted-foreground italic">
              "Cari kavling atau rumah di PIK 2, hadap timur laut, luas bangunan di atas 150m2"
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
