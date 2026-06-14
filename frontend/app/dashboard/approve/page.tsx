"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Claim, ClaimLog } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, History } from "lucide-react";

export default function ApprovePage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [logClaim, setLogClaim] = useState<Claim | null>(null);
  const [logs, setLogs] = useState<ClaimLog[]>([]);
  const [note, setNote] = useState("");

  const fetchClaims = async () => {
    try {
      const { data } = await api.get<Claim[]>("/api/claims/reviewed");
      setClaims(data);
    } catch {
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/api/claims/${id}/${action}`, { note });
      toast.success(`Claim ${action}d!`);
      setNote("");
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const openLogs = async (claim: Claim) => {
    setLogClaim(claim);
    try {
      const { data } = await api.get<ClaimLog[]>(`/api/claims/${claim.id}/logs`);
      setLogs(data);
    } catch {
      toast.error("Failed to load logs");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Approve Claims</h1>
        <p className="text-muted-foreground text-sm">Make final decisions on reviewed claims</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Reviewed Claims ({claims.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : claims.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No reviewed claims to approve.</p>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{claim.title}</p>
                          <StatusBadge status={claim.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{claim.description}</p>
                        <p className="text-sm font-medium">{formatCurrency(claim.amount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(claim.updated_at)}</p>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <div className="space-y-1">
                          <Label className="text-xs">Note (optional)</Label>
                          <Textarea
                            className="text-xs h-16 resize-none"
                            placeholder="Add a note..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                        </div>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full" disabled={!!processingId} onClick={() => handleAction(claim.id, "approve")}>
                          {processingId === claim.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" /> Approve</>}
                        </Button>
                        <Button size="sm" variant="destructive" className="w-full" disabled={!!processingId} onClick={() => handleAction(claim.id, "reject")}>
                          {processingId === claim.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3 h-3 mr-1" /> Reject</>}
                        </Button>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => openLogs(claim)}>
                          <History className="w-3 h-3 mr-1" /> History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Dialog */}
      <Dialog open={!!logClaim} onOpenChange={(o) => { if (!o) setLogClaim(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Log — {logClaim?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2 max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No activity yet.</p>
            ) : logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">{log.from_status ?? "—"}</span>
                  <span>→</span>
                  <span className="font-medium capitalize">{log.to_status}</span>
                </div>
                {log.note && <p className="text-muted-foreground">{log.note}</p>}
                <p className="text-xs text-muted-foreground">{log.actor_name} · {formatDate(log.created_at)}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
