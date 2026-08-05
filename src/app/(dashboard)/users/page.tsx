"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Shield, ShieldAlert, Trash2, Mail, Bot, Loader2 } from "lucide-react";

type WebUser = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

type TelegramUser = {
  id: string;
  telegram_user_id: string;
  name: string | null;
  created_at: string;
};

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<"web" | "telegram">("web");
  const [webUsers, setWebUsers] = useState<WebUser[]>([]);
  const [telegramUsers, setTelegramUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isAddingWeb, setIsAddingWeb] = useState(false);
  const [newWebEmail, setNewWebEmail] = useState("");
  const [newWebRole, setNewWebRole] = useState("agent");

  const [isAddingTelegram, setIsAddingTelegram] = useState(false);
  const [newTelegramId, setNewTelegramId] = useState("");
  const [newTelegramName, setNewTelegramName] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [webRes, telRes] = await Promise.all([
        fetch("/api/users/web"),
        fetch("/api/users/telegram"),
      ]);

      if (webRes.status === 401 || telRes.status === 401) {
        setError("Akses Ditolak: Halaman ini hanya dapat diakses oleh admin.");
        setLoading(false);
        return;
      }

      const webData = await webRes.json();
      const telData = await telRes.json();

      if (webRes.ok) setWebUsers(webData.data || []);
      if (telRes.ok) setTelegramUsers(telData.data || []);
    } catch (err: any) {
      setError("Terjadi kesalahan saat mengambil data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddWebUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebEmail) return;
    try {
      const res = await fetch("/api/users/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newWebEmail, role: newWebRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setWebUsers([data.data, ...webUsers]);
      setIsAddingWeb(false);
      setNewWebEmail("");
      setNewWebRole("agent");
    } catch (err: any) {
      alert("Gagal menambah user: " + err.message);
    }
  };

  const handleDeleteWebUser = async (id: string) => {
    if (!confirm("Hapus user ini?")) return;
    try {
      const res = await fetch(`/api/users/web?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setWebUsers(webUsers.filter((u) => u.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus user: " + err.message);
    }
  };

  const handleAddTelegramUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTelegramId) return;
    try {
      const res = await fetch("/api/users/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_user_id: newTelegramId, name: newTelegramName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTelegramUsers([data.data, ...telegramUsers]);
      setIsAddingTelegram(false);
      setNewTelegramId("");
      setNewTelegramName("");
    } catch (err: any) {
      alert("Gagal menambah Telegram user: " + err.message);
    }
  };

  const handleDeleteTelegramUser = async (id: string) => {
    if (!confirm("Hapus telegram user ini?")) return;
    try {
      const res = await fetch(`/api/users/telegram?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setTelegramUsers(telegramUsers.filter((u) => u.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus telegram user: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola akses login dashboard dan penggunaan bot Telegram.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab("web")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "web"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Web Users
        </button>
        <button
          onClick={() => setActiveTab("telegram")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "telegram"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Telegram Users
        </button>
      </div>

      {/* Web Users Tab */}
      {activeTab === "web" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Akses Dashboard Web</h3>
                <p className="text-xs text-muted-foreground">User yang bisa login ke website ini.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setIsAddingWeb(!isAddingWeb)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Web User</span>
            </Button>
          </div>

          {isAddingWeb && (
            <form onSubmit={handleAddWebUser} className="bg-card p-5 rounded-xl border border-border flex flex-col sm:flex-row gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Google</label>
                <input
                  type="email"
                  required
                  value={newWebEmail}
                  onChange={(e) => setNewWebEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="email@gmail.com"
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                <select
                  value={newWebRole}
                  onChange={(e) => setNewWebRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end gap-2 mt-4 sm:mt-0">
                <Button type="submit" size="sm">Simpan</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingWeb(false)}>Batal</Button>
              </div>
            </form>
          )}

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {webUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-500/10 text-purple-500' 
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteWebUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {webUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada data web user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Users Tab */}
      {activeTab === "telegram" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Akses Bot Telegram</h3>
                <p className="text-xs text-muted-foreground">User yang diizinkan chat dengan bot.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setIsAddingTelegram(!isAddingTelegram)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Telegram User</span>
            </Button>
          </div>

          {isAddingTelegram && (
            <form onSubmit={handleAddTelegramUser} className="bg-card p-5 rounded-xl border border-border flex flex-col sm:flex-row gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="w-full sm:w-48">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Telegram User ID</label>
                <input
                  type="text"
                  required
                  value={newTelegramId}
                  onChange={(e) => setNewTelegramId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Contoh: 123456789"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama (Opsional)</label>
                <input
                  type="text"
                  value={newTelegramName}
                  onChange={(e) => setNewTelegramName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Nama Agen"
                />
              </div>
              <div className="flex items-end gap-2 mt-4 sm:mt-0">
                <Button type="submit" size="sm">Simpan</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingTelegram(false)}>Batal</Button>
              </div>
            </form>
          )}

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Telegram ID</th>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Ditambahkan Pada</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {telegramUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{user.telegram_user_id}</td>
                      <td className="px-4 py-3 font-medium">{user.name || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteTelegramUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {telegramUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada data telegram user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
