import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, loginSchema, registerSchema } from "@shared/schema";
import { sendVerificationEmail } from "./services/email";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.JWT_ACCESS_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          if (!user.isVerified) {
            return done(null, false, { message: "Please verify your email before logging in" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      // If user no longer exists, return false (not an error) so passport doesn't crash
      if (!user) return done(null, false);
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      // Return no user on error to avoid crashing the whole server
      return done(null, false);
    }
  });

  // MARK: teacher-review - Registration endpoint with email verification
  app.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const verificationToken = randomUUID();
      const user = await storage.createUser({
        name: validatedData.name,
        email: validatedData.email,
        password: await hashPassword(validatedData.password),
        role: validatedData.role || "customer",
        verificationToken,
      });

      // Send verification email (gracefully handle failures)
      const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken);
      
      let message = "Registration successful!";
      if (emailResult.sent) {
        message = "Registration successful. Please check your email to verify your account.";
      } else {
        message = "Registration successful. Email verification is currently unavailable. Please contact support to verify your account.";
        console.log(`[DEV MODE] Manual verification URL for ${user.email}: http://localhost:5000/verify-email/${verificationToken}`);
      }

      res.status(201).json({ 
        message,
        userId: user.id,
        emailSent: emailResult.sent
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.issues[0].message });
      }
      next(error);
    }
  });

  // MARK: teacher-review - Email verification endpoint
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      await storage.verifyUser(user.id);
      res.json({ message: "Email verified successfully! You can now log in." });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Plain HTML verification page (so email links work even if SPA fails to load)
  app.get("/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).send(`
          <html>
            <head><title>Verification Failed</title></head>
            <body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
              <div style="max-width:600px;text-align:center;padding:20px;border:1px solid #eee;border-radius:8px;">
                <h1 style="color:#e11d48">Verification Failed</h1>
                <p>The verification link is invalid or has expired.</p>
                <p><a href="/auth">Go to Sign In / Register</a></p>
              </div>
            </body>
          </html>
        `);
      }

      await storage.verifyUser(user.id);

      return res.send(`
        <html>
          <head><title>Verification Successful</title></head>
          <body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="max-width:600px;text-align:center;padding:20px;border:1px solid #eee;border-radius:8px;">
              <h1 style="color:#10b981">Email Verified</h1>
              <p>Thank you, your email has been verified. You can now sign in to your account.</p>
              <p><a href="/auth">Continue to Sign In</a></p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in HTML verify route:', error);
      return res.status(500).send(`
        <html>
          <head><title>Server Error</title></head>
          <body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="max-width:600px;text-align:center;padding:20px;border:1px solid #eee;border-radius:8px;">
              <h1 style="color:#ef4444">Server Error</h1>
              <p>Something went wrong while verifying your email. Please try again later.</p>
              <p><a href="/auth">Go to Sign In</a></p>
            </div>
          </body>
        </html>
      `);
    }
  });

  app.post("/api/login", (req, res, next) => {
    const validatedData = loginSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ message: validatedData.error.issues[0].message });
    }

    passport.authenticate("local", (err: any, user: SelectUser, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      const newToken = randomUUID();
      await storage.updateVerificationToken(user.id, newToken);
      await sendVerificationEmail(user.email, user.name, newToken);

      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Change password endpoint
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(req.user.id, { password: hashedNewPassword } as any);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Delete account endpoint
  app.delete("/api/delete-account", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password confirmation is required" });
      }

      // Verify password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Password is incorrect" });
      }

      // Delete user account and all related data
      console.log(`Attempting to delete user account: ${req.user.id}`);
      const success = await storage.deleteUser(req.user.id);
      console.log(`Delete user result: ${success}`);
      
      if (!success) {
        console.error(`Failed to delete user account: ${req.user.id}`);
        return res.status(500).json({ message: "Failed to delete account. Please try again." });
      }

      // Logout user after successful deletion
      req.logout((err) => {
        if (err) {
          console.error("Error during logout after account deletion:", err);
        }
      });

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account. Please try again." });
    }
  });
}
