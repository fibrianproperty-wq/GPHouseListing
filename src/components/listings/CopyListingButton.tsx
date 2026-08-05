"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/types/listing";
import { formatHargaSingkat } from "@/lib/utils";

interface CopyListingButtonProps {
  listing: Listing;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function CopyListingButton({
  listing,
  variant = "outline",
  size = "default",
  className = "",
  showText = true,
}: CopyListingButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering row clicks if placed in a table
    e.preventDefault();

    let text = `*DIJUAL/DISEWA PROPERTI DI ${listing.kawasan?.toUpperCase() || "N/A"}*\n\n`;
    
    if (listing.jenis_properti || listing.tipe_transaksi) {
      text += `🏢 Tipe: ${listing.jenis_properti || "-"} | ${listing.tipe_transaksi || "-"}\n`;
    }
    if (listing.alamat) text += `📍 Alamat: ${listing.alamat}\n`;
    
    const lt = listing.lt || "-";
    const lb = listing.lb || "-";
    if (lt !== "-" || lb !== "-") {
      text += `📐 LT/LB: ${lt}/${lb} m²\n`;
    }

    const kt = listing.kt || "-";
    const km = listing.km || "-";
    if (kt !== "-" || km !== "-") {
      text += `🛏️ Kamar: ${kt} KT, ${km} KM\n`;
    }

    if (listing.kondisi || listing.ketersediaan) {
      text += `🏠 Status: ${listing.kondisi || "-"} / ${listing.ketersediaan || "-"}\n`;
    }
    if (listing.sertifikat) text += `📜 Sertifikat: ${listing.sertifikat}\n`;
    if (listing.furnished) text += `🛋️ Furnished: ${listing.furnished}\n`;
    if (listing.hadap) text += `🧭 Hadap: ${listing.hadap}\n`;
    if (listing.lantai) text += `🏢 Lantai: ${listing.lantai}\n`;

    text += `\n*Harga: ${listing.harga_text || formatHargaSingkat(listing.harga)}*\n`;
    
    if (listing.keterangan) text += `\nKeterangan:\n${listing.keterangan}\n`;
    
    text += `\nAgent: ${listing.agent_name}`;
    if (listing.photo_link) text += `\nLink Foto: ${listing.photo_link}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      alert("Gagal menyalin teks.");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      onClick={handleCopy}
      title="Copy detail untuk WhatsApp"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {showText && <span className="hidden sm:inline">{copied ? "Tersalin" : "Copy WA"}</span>}
    </Button>
  );
}
