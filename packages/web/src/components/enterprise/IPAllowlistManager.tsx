"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface IPAllowlist {
  id: string;
  ipAddress: string;
  description: string;
  createdAt: string;
}

export function IPAllowlistManager() {
  const [allowlist, setAllowlist] = useState<IPAllowlist[]>([]);
  const [newIP, setNewIP] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchAllowlist();
  }, []);

  const fetchAllowlist = async () => {
    try {
      const response = await fetch("/api/enterprise/ip-allowlist");
      if (response.ok) {
        const data = await response.json();
        setAllowlist(data.allowlist || []);
      }
    } catch (error) {
      console.error("Failed to fetch allowlist:", error);
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch("/api/enterprise/ip-allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: newIP, description }),
      });

      if (response.ok) {
        setNewIP("");
        setDescription("");
        await fetchAllowlist();
      }
    } catch (error) {
      console.error("Failed to add IP:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/enterprise/ip-allowlist/${id}`, { method: "DELETE" });
      await fetchAllowlist();
    } catch (error) {
      console.error("Failed to delete IP:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          IP Allowlist
        </CardTitle>
        <CardDescription>Restrict API access to specific IP addresses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Add IP Address</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ip">IP Address or CIDR</Label>
              <Input
                id="ip"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="192.168.1.1 or 192.168.1.0/24"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Office network, VPN, etc."
              />
            </div>
            <Button onClick={handleAdd} disabled={!newIP}>
              <Plus className="w-4 h-4 mr-2" />
              Add IP
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {allowlist.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {item.ipAddress}
                  </Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {item.description}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Added: {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
