import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "@node-saml/passport-saml";
import { config } from "../../config";
import { query } from "../../db";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { storeRefreshToken } from "../../infrastructure/security/token-rotation";

const router: Router = Router({ mergeParams: true });

// Check if SAML config exists in env
const SAML_ENTRY_POINT =
  process.env.SAML_ENTRY_POINT || "https://example.okta.com/app/example/sso/saml";
const SAML_ISSUER = process.env.SAML_ISSUER || "settler-api";
const SAML_CERT = process.env.SAML_CERT || "fake-cert"; // in prod, this would be the actual IdP cert

// Passport SAML Strategy setup
passport.use(
  new SamlStrategy(
    {
      entryPoint: SAML_ENTRY_POINT,
      issuer: SAML_ISSUER,
      callbackUrl: `${process.env.PUBLIC_URL || "http://localhost:3000"}/api/v1/sso/saml/acs`,
      cert: SAML_CERT,
    },
    (profile: any, done: any) => {
      // In a real application, map profile to user here
      if (!profile) {
        return done(new Error("No profile returned from SAML provider"), null);
      }

      const email = profile.nameID || profile.email;
      if (!email) {
        return done(new Error("SAML profile missing email/nameID"), null);
      }

      return done(null, {
        id: profile.nameID, // typically we'd look up the user by email
        email: email,
        ...profile,
      });
    }
  )
);

// Middleware to initialize passport (should be mounted in app, but doing it locally here for isolation)
router.use(passport.initialize());

// Endpoint to initiate SSO login
router.get(
  "/saml/login",
  passport.authenticate("saml", { failureRedirect: "/login", failureFlash: true }),
  (req: Request, res: Response) => {
    res.redirect("/");
  }
);

// Assertion Consumer Service (ACS) endpoint for SAML POST callbacks
router.post(
  "/saml/acs",
  passport.authenticate("saml", { failureRedirect: "/login", failureFlash: true, session: false }),
  async (req: Request, res: Response) => {
    try {
      const samlUser = req.user as any;
      if (!samlUser || !samlUser.email) {
        res.status(401).json({ error: "Invalid SAML assertion" });
        return;
      }

      // JIT Provisioning / User Lookup
      let users = await query<{ id: string; role: string; tenant_id: string }>(
        `SELECT id, role, tenant_id FROM users WHERE email = $1 AND deleted_at IS NULL`,
        [samlUser.email]
      );

      let user = users[0];

      // Just-In-Time (JIT) Provisioning
      if (!user) {
        // If SAML is configured to allow JIT provisioning, create the user
        const newUserId = uuidv4();
        // Assuming there is a default tenant or tenant comes from SAML assertion
        const tenantId = samlUser.tenantId || "default-tenant"; // fallback

        await query(
          `INSERT INTO users (id, tenant_id, email, role, password_hash, created_at, updated_at) VALUES ($1, $2, $3, 'operator', 'SSO_USER', NOW(), NOW())`,
          [newUserId, tenantId, samlUser.email]
        );

        user = {
          id: newUserId,
          role: "operator",
          tenant_id: tenantId,
        };
      }

      // Generate JWT Access & Refresh Tokens for the SSO user
      const jwtSecret = config.jwt.secret || "fallback_secret";
      const refreshSecret = config.jwt.refreshSecret || jwtSecret;

      const accessToken = jwt.sign(
        { userId: user.id, type: "access", tenantId: user.tenant_id },
        jwtSecret,
        {
          expiresIn: "15m",
          issuer: "settler-api",
          audience: "settler-client",
        }
      );

      const refreshTokenId = uuidv4();
      const refreshToken = jwt.sign(
        { userId: user.id, tokenId: refreshTokenId, type: "refresh", tenantId: user.tenant_id },
        refreshSecret,
        {
          expiresIn: "7d",
          issuer: "settler-api",
        }
      );

      await storeRefreshToken(refreshTokenId, user.id, 7 * 24 * 60 * 60);

      // Return tokens (in a real app, might set cookies and redirect to frontend Dashboard)
      res.status(200).json({
        message: "SSO login successful",
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: samlUser.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("SSO ACS Error:", error);
      res.status(500).json({ error: "Internal server error processing SSO login" });
    }
  }
);

export { router as ssoRouter };
