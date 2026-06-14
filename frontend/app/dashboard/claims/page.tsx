"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Claim } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Loader2, Send } from "lucide-react";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitingId, setSubmittingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", amount: "" });

  const fetchClaims = async () => {
    try {
      const { data } = await api.get<Claim[]>("/api/claims/my");
      setClaims(data);
    } catch {
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post("/api/claims", { ...form, amount: parseFloat(form.amount) });
      toast.success("Claim created!");
      setOpen(false);
      setForm({ title: "", description: "", amount: "" });
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to create claim");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (id: number) => {
    if (submitingId) return;
    setSubmittingId(id);
    try {
      await api.post(`/api/claims/${id}/submit`);
      toast.success("Claim submitted!");
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to submit");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Claims</h1>
          <p className="text-muted-foreground text-sm">Manage your insurance claims</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 text-sm font-medium gap-2">
            <Plus className="w-4 h-4" /> New Claim
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Claim</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input placeholder="Claim title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea placeholder="Describe your claim..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Amount (IDR)</Label>
                <Input type="number" placeholder="5000000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min={1} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Claim"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Claims ({claims.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : claims.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No claims yet. Create your first claim!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.title}</TableCell>
                    <TableCell>{formatCurrency(claim.amount)}</TableCell>
                    <TableCell><StatusBadge status={claim.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(claim.created_at)}</TableCell>
                    <TableCell>
                      {claim.status === "draft" && (
                        <Button size="sm" variant="outline" disabled={submitingId === claim.id} onClick={() => handleSubmit(claim.id)}>
                          {submitingId === claim.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3 mr-1" /> Submit</>}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
