import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { connectDB } from "./db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

// ──── Rate limiter for auth endpoints ────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window
  message: { message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ──── Auth middleware ────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

/** Helper – get userId from session (or undefined for guests) */
function getUserId(req: Request): string | undefined {
  return req.session.userId;
}

/** Safely extract a single param value (Express 5 may return string[]) */
function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await connectDB();

  // ════════════════════════════════════════
  //  AUTH ROUTES
  // ════════════════════════════════════════

  // POST /api/auth/register
  app.post(api.auth.register.path, authLimiter, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);

      // Check if email already taken
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      const user = await storage.createUser(input);
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // POST /api/auth/login
  app.post(api.auth.login.path, authLimiter, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(input.password, user.hashedPassword);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      // Return user without hashedPassword
      const { hashedPassword, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(401).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // POST /api/auth/logout
  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // GET /api/auth/me — returns user or null (always 200 to avoid console noise)
  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.json(null);
    }
    res.json(user);
  });

  // ════════════════════════════════════════
  //  ARTICLES (public read, auth required for write)
  // ════════════════════════════════════════

  app.get(api.articles.list.path, async (req, res) => {
    const params = api.articles.list.input.parse(req.query);
    const userId = getUserId(req);
    const articles = await storage.getArticles(params, userId);
    res.json(articles);
  });

  app.get(api.articles.get.path, async (req, res) => {
    const userId = getUserId(req);
    const article = await storage.getArticle(param(req, 'id'), userId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.json(article);
  });

  app.post(api.articles.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.articles.create.input.parse(req.body);
      const article = await storage.createArticle(input, req.session.userId);
      res.status(201).json(article);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put(api.articles.update.path, requireAuth, async (req, res) => {
    try {
      // Ownership check: only the author can edit
      const existing = await storage.getArticle(param(req, 'id'));
      if (!existing) {
        return res.status(404).json({ message: "Article not found" });
      }
      if (existing.authorId && existing.authorId !== req.session.userId) {
        return res.status(403).json({ message: "You can only edit your own articles" });
      }
      const input = api.articles.update.input.parse(req.body);
      const article = await storage.updateArticle(param(req, 'id'), input, req.session.userId);
      res.json(article!);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.articles.delete.path, requireAuth, async (req, res) => {
    // Ownership check: only the author can delete
    const existing = await storage.getArticle(param(req, 'id'));
    if (!existing) {
      return res.status(404).json({ message: "Article not found" });
    }
    if (existing.authorId && existing.authorId !== req.session.userId) {
      return res.status(403).json({ message: "You can only delete your own articles" });
    }
    await storage.deleteArticle(param(req, 'id'));
    res.status(204).end();
  });

  // ════════════════════════════════════════
  //  WIKI LINKS — resolve [[Title]] to article IDs
  // ════════════════════════════════════════

  app.post(api.wikiLinks.resolve.path, async (req, res) => {
    try {
      const { titles } = api.wikiLinks.resolve.input.parse(req.body);
      const resolved = await storage.resolveArticleTitles(titles);
      res.json(resolved);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ════════════════════════════════════════
  //  FAVORITES (per-user, auth required)
  // ════════════════════════════════════════

  app.get(api.favorites.list.path, requireAuth, async (req, res) => {
    const ids = await storage.getUserFavoriteIds(req.session.userId!);
    res.json(ids);
  });

  app.post(api.favorites.add.path, requireAuth, async (req, res) => {
    await storage.addFavorite(req.session.userId!, param(req, 'articleId'));
    res.json({ message: "Added to favorites" });
  });

  app.delete(api.favorites.remove.path, requireAuth, async (req, res) => {
    await storage.removeFavorite(req.session.userId!, param(req, 'articleId'));
    res.json({ message: "Removed from favorites" });
  });

  // ════════════════════════════════════════
  //  TAGS (public)
  // ════════════════════════════════════════

  app.get(api.tags.list.path, async (_req, res) => {
    const tags = await storage.getAllTags();
    res.json(tags);
  });

  // ════════════════════════════════════════
  //  VERSIONS (public read, auth required for restore)
  // ════════════════════════════════════════

  app.get(api.versions.list.path, async (req, res) => {
    const versions = await storage.getArticleVersions(param(req, 'id'));
    res.json(versions);
  });

  app.post(api.versions.restore.path, requireAuth, async (req, res) => {
    const article = await storage.restoreVersion(param(req, 'id'), param(req, 'versionId'), req.session.userId);
    if (!article) {
      return res.status(404).json({ message: "Article or version not found" });
    }
    res.json(article);
  });

  return httpServer;
}
