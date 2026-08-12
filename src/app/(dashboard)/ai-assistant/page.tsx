"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, CheckCircle2, AlertCircle, Trash2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing, ParsedListing } from "@/types/listing";
import Link from "next/link";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  intent?: string;
  listings?: Listing[];
  parsedData?: ParsedListing;
  status?: "saving" | "saved" | "error";
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const saved = localStorage.getItem("ai-assistant-messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved messages");
      }
    } else {
      setMessages([{
        id: "welcome",
        role: "ai",
        content: "Halo! Saya adalah HOMIS (Home Assistant). Anda bisa mencari properti (misal: 'Cari rumah di BSD harga 1 M') atau langsung mem-paste spesifikasi rumah untuk saya simpan."
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      localStorage.setItem("ai-assistant-messages", JSON.stringify(messages));
    }
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung fitur Voice Recognition (Gunakan Chrome/Edge terbaru).");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = true; // Keep listening until user stops it manually
    recognition.interimResults = true; // Show results while talking
    recognition.maxAlternatives = 1;

    // We store the current final transcript string in a ref so interim results can be appended properly.
    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      (window as any)._currentRecognition = recognition;
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let currentFinal = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Filter filler words (ah, eh, em, hmm)
      const filterFillers = (text: string) => {
        return text.replace(/\b(ah|eh|em|hmm|ehm|oh)\b/gi, "").replace(/\s+/g, " ").trim();
      };

      if (currentFinal) {
        finalTranscript += " " + filterFillers(currentFinal);
        setInput(prev => {
          // If the user already typed something, keep it
          const base = prev.replace(interimTranscript, "").trim();
          return (base + " " + filterFillers(currentFinal)).trim();
        });
      } else if (interimTranscript) {
        setInput(prev => {
          // just append interim temporarily
          return prev + " " + interimTranscript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      (window as any)._currentRecognition = null;
    };

    recognition.start();
  };

  const stopListening = () => {
    if ((window as any)._currentRecognition) {
      (window as any)._currentRecognition.stop();
    }
    setIsListening(false);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      toggleListening();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: "user", content: userMsg }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, messages: newMessages }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to process request");

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: data.reply,
          intent: data.intent,
          listings: data.listings,
          parsedData: data.parsedData,
        }
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "Maaf, terjadi kesalahan saat memproses permintaan Anda: " + error.message,
          intent: "error"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (messageId: string, field: keyof ParsedListing, value: any) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.parsedData) {
        return {
          ...m,
          parsedData: { ...m.parsedData, [field]: value }
        };
      }
      return m;
    }));
  };

  const handleSaveListing = async (messageId: string, parsedData: ParsedListing) => {
    if (!parsedData.agent_name?.trim()) {
      alert("Mohon isi Nama Agent sebelum menyimpan.");
      return;
    }

    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, status: "saving" } : m
    ));

    try {
      const listingData = {
        ...parsedData,
        source: "web"
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listingData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save listing");
      }
      
      const { data } = await res.json();

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: "saved", content: "✅ Listing berhasil disimpan!", listings: [data] } : m
      ));
    } catch (error: any) {
      alert("Gagal menyimpan listing: " + error.message);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: "error" } : m
      ));
    }
  };

  const clearChat = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua riwayat percakapan?")) {
      const initialMessage: Message = {
        id: "welcome",
        role: "ai",
        content: "Halo! Saya adalah HOMIS (Home Assistant). Anda bisa mencari properti (misal: 'Cari rumah di BSD harga 1 M') atau langsung mem-paste spesifikasi rumah untuk saya simpan."
      };
      setMessages([initialMessage]);
      localStorage.setItem("ai-assistant-messages", JSON.stringify([initialMessage]));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div>
          <h2 className="font-semibold flex items-center gap-2">
            HOMIS 
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-medium tracking-wide">
              BETA
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">Asisten Pencarian & Input Cerdas</p>
        </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={clearChat} 
          title="Hapus riwayat obrolan"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-emerald-500/10 text-emerald-600"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"} min-w-0`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>

              {/* Special UI for Search Results */}
              {msg.intent === "search" && msg.listings && msg.listings.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 w-full max-w-2xl">
                  {msg.listings.map(listing => (
                    <div key={listing.id} className="scale-95 origin-top-left w-[105%]">
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
              )}

              {/* Special UI for Saved Listing */}
              {msg.intent === "template_parse" && msg.status === "saved" && msg.listings && msg.listings.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 w-full max-w-2xl">
                  {msg.listings.map(listing => (
                    <div key={listing.id} className="scale-95 origin-top-left w-[105%]">
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
              )}

              {/* Special UI for Template Parse (Confirmation) */}
              {msg.intent === "template_parse" && msg.parsedData && msg.status !== "saved" && (
                  <div className="mt-2 bg-background border border-border rounded-xl p-4 shadow-sm w-full max-w-md animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Data terdeteksi (Bisa diedit):
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4 bg-muted/30 p-3 rounded-lg max-h-[350px] overflow-y-auto">
                    {[
                      { key: 'judul', label: 'Judul / Nama Properti', colSpan: 2 },
                      { key: 'jenis_properti', label: 'Jenis Properti', options: ['Rumah', 'Ruko', 'Kavling', 'Gudang', 'Villa', 'Apartemen', 'Lainnya'] },
                      { key: 'tipe_transaksi', label: 'Tipe Transaksi', options: ['Jual', 'Sewa', 'Jual/Sewa'] },
                      { key: 'kawasan', label: 'Kawasan' },
                      { key: 'alamat', label: 'Alamat' },
                      { key: 'lt', label: 'Luas Tanah (LT)' },
                      { key: 'lb', label: 'Luas Bangunan (LB)' },
                      { key: 'kt', label: 'Kamar Tidur (KT)' },
                      { key: 'km', label: 'Kamar Mandi (KM)' },
                      { key: 'lantai', label: 'Lantai' },
                      { key: 'hadap', label: 'Hadap' },
                      { key: 'kondisi', label: 'Kondisi', options: ['Baru', 'Lama', 'N/A'] },
                      { key: 'sertifikat', label: 'Sertifikat' },
                      { key: 'furnished', label: 'Furnished' },
                      { key: 'ketersediaan', label: 'Ketersediaan', options: ['Indent', 'Ready', 'N/A'] },
                      { key: 'harga', label: 'Harga (Angka)' },
                      { key: 'harga_text', label: 'Harga (Teks)' },
                      { key: 'agent_name', label: 'Nama Agent' },
                      { key: 'photo_link', label: 'Link Foto' },
                      { key: 'keterangan', label: 'Keterangan Tambahan', colSpan: 2 }
                    ].map(({ key, label, colSpan, options }) => (
                      <div key={key} className={`flex flex-col gap-1 ${colSpan === 2 ? 'col-span-2' : 'col-span-1'}`}>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">{label}</label>
                        {options ? (
                          <select
                            value={msg.parsedData![key as keyof ParsedListing] || ""}
                            onChange={(e) => handleFieldChange(msg.id, key as keyof ParsedListing, e.target.value)}
                            className="w-full text-xs px-2 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                          >
                            <option value="">- Pilih -</option>
                            {options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input 
                            type={['lt', 'lb', 'kt', 'km', 'lantai', 'harga'].includes(key) ? "number" : "text"}
                            value={msg.parsedData![key as keyof ParsedListing] ?? ""}
                            onChange={(e) => {
                              const isNumber = e.target.type === 'number';
                              const val = isNumber ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value;
                              handleFieldChange(msg.id, key as keyof ParsedListing, val);
                            }}
                            placeholder="-"
                            className="w-full text-xs px-2 py-1.5 border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleSaveListing(msg.id, msg.parsedData!)} 
                      className="w-full"
                      disabled={msg.status === "saving"}
                    >
                      {msg.status === "saving" ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                      ) : (
                        "Simpan Listing"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-muted/10">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleToggleListening}
            className={`rounded-xl w-12 h-12 shrink-0 shadow-sm transition-all ${isListening ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' : ''}`}
            disabled={isLoading}
            title={isListening ? "Mendengarkan..." : "Bicara (Voice to Text)"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Mendengarkan suara Anda..." : "Tanya sesuatu atau paste data listing..."}
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
            disabled={isLoading || isListening}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-xl w-12 h-12 shrink-0 shadow-sm transition-transform active:scale-95"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
