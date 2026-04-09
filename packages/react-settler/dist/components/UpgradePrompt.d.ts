/**
 * UpgradePrompt Component
 * Shows upgrade messaging for commercial features
 */
export interface UpgradePromptProps {
    feature: string;
    featureName?: string;
    compact?: boolean;
    onUpgrade?: () => void;
}
export declare function UpgradePrompt({ feature, featureName, compact, onUpgrade, }: UpgradePromptProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=UpgradePrompt.d.ts.map