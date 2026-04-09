import fs from "fs";
import path from "path";
import { Permission, PermissionChecker } from "../Permissions";
import { UserRole } from "../../../domain/entities/User";

function collectRoutePermissions(): Permission[] {
  const routesRoot = path.resolve(__dirname, "../../../routes");
  const discovered = new Set<Permission>();

  const walk = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (!entry.isFile() || !absolutePath.endsWith(".ts")) {
        continue;
      }

      const source = fs.readFileSync(absolutePath, "utf8");
      for (const match of source.matchAll(/Permission\.([A-Z_]+)/g)) {
        const permission = Permission[match[1] as keyof typeof Permission];
        if (permission) {
          discovered.add(permission);
        }
      }
    }
  };

  walk(routesRoot);
  return Array.from(discovered.values()).sort();
}

describe("permission matrix contract", () => {
  it("grants every permission to the owner role", () => {
    for (const permission of Object.values(Permission)) {
      expect(PermissionChecker.hasPermission(UserRole.OWNER, [], permission)).toBe(true);
    }
  });

  it("grants admin and operator permissions to the admin role", () => {
    expect(PermissionChecker.hasPermission(UserRole.ADMIN, [], Permission.ADMIN_READ)).toBe(true);
    expect(PermissionChecker.hasPermission(UserRole.ADMIN, [], Permission.ADMIN_WRITE)).toBe(true);
    expect(PermissionChecker.hasPermission(UserRole.ADMIN, [], Permission.ADMIN_AUDIT)).toBe(true);
    expect(PermissionChecker.hasPermission(UserRole.ADMIN, [], Permission.OPERATOR_READ)).toBe(
      true
    );
    expect(PermissionChecker.hasPermission(UserRole.ADMIN, [], Permission.OPERATOR_WRITE)).toBe(
      true
    );
  });

  it("grants operator read to developer but keeps operator write closed", () => {
    expect(PermissionChecker.hasPermission(UserRole.DEVELOPER, [], Permission.OPERATOR_READ)).toBe(
      true
    );
    expect(PermissionChecker.hasPermission(UserRole.DEVELOPER, [], Permission.OPERATOR_WRITE)).toBe(
      false
    );
  });

  it("ensures every route-guard permission is reachable by at least one built-in role", () => {
    const routePermissions = collectRoutePermissions();
    const roles = Object.values(UserRole);

    for (const permission of routePermissions) {
      const reachable = roles.some((role) => PermissionChecker.hasPermission(role, [], permission));
      expect(reachable).toBe(true);
    }
  });
});
