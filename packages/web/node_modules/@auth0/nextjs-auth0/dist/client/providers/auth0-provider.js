"use client";
import React from "react";
import { SWRConfig } from "swr";
export function Auth0Provider({ user, children }) {
    return (React.createElement(SWRConfig, { value: {
            fallback: {
                [process.env.NEXT_PUBLIC_PROFILE_ROUTE || "/auth/profile"]: user
            }
        } }, children));
}
