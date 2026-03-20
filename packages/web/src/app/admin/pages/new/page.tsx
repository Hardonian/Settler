"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPage } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const result = await createPage(formData);

    if (result.success && result.data) {
      router.push(`/admin/pages/${result.data.id}/editor`);
    } else {
      setError(result.error || "Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/pages">
          <Button variant="ghost" size="sm" className="mb-4 pl-0 hover:bg-transparent">
            <ArrowLeft size={16} className="mr-2" /> Back to Pages
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Create New Page</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
          <CardDescription>Define the basic information for your new page.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input id="title" name="title" placeholder="e.g. About Us" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" name="slug" placeholder="e.g. about-us" required />
              <p className="text-xs text-muted-foreground">
                The URL path where this page will be accessible.
              </p>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

            <div className="flex justify-end gap-2">
              <Link href="/admin/pages">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Page
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
