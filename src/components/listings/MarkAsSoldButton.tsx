"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MarkAsSoldButtonProps {
  listingId: string;
}

export function MarkAsSoldButton({ listingId }: MarkAsSoldButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMarkAsSold = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sold" }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-violet-600 border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-800 dark:hover:bg-violet-900/50">
          <CheckCircle className="w-4 h-4" />
          Terjual
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tandai sebagai Terjual?</DialogTitle>
          <DialogDescription>
            Status properti ini akan diubah menjadi Terjual (Sold) dan tidak akan tampil sebagai stok aktif.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            variant="default"
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            onClick={handleMarkAsSold}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Ya, Sudah Terjual
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
