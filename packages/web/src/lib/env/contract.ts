import { BUILD_REQUIRED_ENV_GROUPS, hasConfiguredValue } from "./keys";

export interface EnvGroupResolution {
  label: string;
  keys: readonly string[];
  satisfied: boolean;
  via: string | null;
}

export function resolveEnvGroup(keys: readonly string[]): {
  satisfied: boolean;
  via: string | null;
} {
  for (const key of keys) {
    if (hasConfiguredValue(key)) {
      return { satisfied: true, via: key };
    }
  }
  return { satisfied: false, via: null };
}

export function resolveRequiredBuildGroups(): EnvGroupResolution[] {
  return BUILD_REQUIRED_ENV_GROUPS.map((group) => {
    const result = resolveEnvGroup(group.keys);
    return {
      label: group.label,
      keys: group.keys,
      satisfied: result.satisfied,
      via: result.via,
    };
  });
}

export function formatGroupKeys(keys: readonly string[]): string {
  return keys.join(" or ");
}
