"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Claim } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

export default function VerifyPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchClaims = async () => {
    try {
      const { data } = await api.get<Claim[]>("/api/claims/submitted");
      setClaims(data);
    } catch {
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleReview = async (id: number) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/api/claims/${id}/review`);
      toast.success("Claim marked as reviewed!");
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to review");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verify Claims</h1>
        <p className="text-muted-foreground text-sm">Review submitted claims</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Submitted Claims ({claims.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : claims.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No submitted claims to review.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{claim.description}</TableCell>
                    <TableCell>{formatCurrency(claim.amount)}</TableCell>
                    <TableCell><StatusBadge status={claim.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(claim.updated_at)}</TableCell>
                    <TableCell>
                      <Button size="sm" disabled={processingId === claim.id} onClick={() => handleReview(claim.id)}>
                        {processingId === claim.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" /> Review</>}
                      </Button>
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
