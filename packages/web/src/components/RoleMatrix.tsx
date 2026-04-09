"use client";

import React from "react";
import { Shield, AlertTriangle } from "lucide-react";

const RoleMatrix: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted/40 p-4 mb-4">
        <Shield className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        Role Management Not Yet Implemented
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        Backend role and permission management infrastructure is not yet connected. The role matrix
        will be activated once the permission system is fully wired to this interface.
      </p>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 max-w-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-left">
            <p className="text-xs font-semibold text-amber-900 mb-1">Implementation Note</p>
            <p className="text-xs text-amber-700">
              This surface has been downgraded from a misleading interactive role manager to an
              honest unavailable state. Role enforcement exists at the route level via Permission
              checks, but UI-level role management is not yet supported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleMatrix;
