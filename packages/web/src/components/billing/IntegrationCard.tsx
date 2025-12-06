"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  isConnected?: boolean;
  isStandard?: boolean;
  isPurchased?: boolean;
  status?: "active" | "inactive" | "error" | "pending";
  lastSync?: Date;
  onConnect?: (id: string) => Promise<void>;
  onDisconnect?: (id: string) => Promise<void>;
  onConfigure?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function IntegrationCard({
  id,
  name,
  description,
  isConnected = false,
  isStandard = false,
  isPurchased = false,
  status = "inactive",
  lastSync,
  onConnect,
  onDisconnect,
  onConfigure,
  isLoading = false,
  className,
}: IntegrationCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const handleAction = async () => {
    if (isConnected && onDisconnect) {
      await onDisconnect(id);
    } else if (!isConnected && onConnect) {
      await onConnect(id);
    }
  };

  return (
    <Card
      className={cn(
        "w-full transition-all hover:shadow-lg",
        isConnected && "ring-2 ring-green-500",
        !isPurchased && !isStandard && "opacity-50",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge()}
              {isStandard && (
                <Badge variant="secondary">Included</Badge>
              )}
              {!isPurchased && !isStandard && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Add-On Required
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lastSync && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last synced: {lastSync.toLocaleDateString()} {lastSync.toLocaleTimeString()}
            </p>
          )}
          {!isPurchased && !isStandard && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Purchase the add-on to enable this integration
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {isConnected && onConfigure && (
          <Button
            onClick={() => onConfigure(id)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        )}
        <Button
          onClick={handleAction}
          disabled={isLoading || (!isPurchased && !isStandard)}
          variant={isConnected ? "outline" : "default"}
          size="sm"
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isConnected ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Disconnect
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Connect
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
