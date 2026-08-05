"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Halo! Saya adalah AI Assistant. Anda bisa mencari properti (misal: 'Cari rumah di BSD harga 1 M') atau langsung mem-paste template data rumah untuk saya simpan."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentName, setAgentName] = useState(""); // For saving templates
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        body: JSON.stringify({ message: userMsg }),
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

  const handleSaveListing = async (messageId: string, parsedData: ParsedListing) => {
    if (!agentName.trim()) {
      alert("Mohon isi Nama Agent sebelum menyimpan.");
      return;
    }

    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, status: "saving" } : m
    ));

    try {
      const listingData = {
        ...parsedData,
        agent_name: agentName,
        source: "web"
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listingData),
      });

      if (!res.ok) throw new Error("Failed to save listing");

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: "saved", content: "✅ Listing berhasil disimpan!" } : m
      ));
    } catch (error) {
      alert("Gagal menyimpan listing");
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: "error" } : m
      ));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold">AI Assistant</h2>
          <p className="text-xs text-muted-foreground">Pencarian cerdas & input data otomatis</p>
        </div>
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

              {/* Special UI for Template Parse (Confirmation) */}
              {msg.intent === "template_parse" && msg.parsedData && msg.status !== "saved" && (
                <div className="mt-2 bg-background border border-border rounded-xl p-4 shadow-sm w-full max-w-md animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Data terdeteksi:
                  </h4>
                  <div className="space-y-1 text-sm mb-4 bg-muted/50 p-3 rounded-lg">
                    <p><span className="text-muted-foreground inline-block w-20">Kawasan:</span> {msg.parsedData.kawasan || "-"}</p>
                    <p><span className="text-muted-foreground inline-block w-20">Alamat:</span> {msg.parsedData.alamat || "-"}</p>
                    <p><span className="text-muted-foreground inline-block w-20">Spesifikasi:</span> LT {msg.parsedData.lt || 0} / LB {msg.parsedData.lb || 0}</p>
                    <p><span className="text-muted-foreground inline-block w-20">Kamar:</span> {msg.parsedData.kt || 0} KT / {msg.parsedData.km || 0} KM</p>
                    <p><span className="text-muted-foreground inline-block w-20">Harga:</span> {msg.parsedData.harga_text || "Rp " + msg.parsedData.harga}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Agent</label>
                      <input
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="Masukkan nama agent..."
                        className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
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
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya sesuatu atau paste data listing..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
            disabled={isLoading}
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
