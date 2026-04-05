// ============================================================
// server/src/routes/uploads.ts — File Upload API Routes
//
// Handles image file uploads using Multer library.
// Files are saved to server/uploads/ with UUID (random) filenames.
// All routes are mounted under: /api/uploads/
//
// Endpoints:
//  - POST /avatar  → Upload user profile picture (saved to uploads/avatars/)
//  - POST /pod     → Upload Proof of Delivery photo (saved to uploads/pod/)
//
// Restrictions:
//  - Only image files allowed: .jpg, .jpeg, .png, .webp
//  - Max file size: 5MB (configurable via MAX_FILE_SIZE_MB in .env)
// ============================================================

import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || "5")) * 1024 * 1024;

// Ensure upload directories exist
const AVATAR_DIR = path.join(UPLOAD_DIR, "avatars");
const POD_DIR = path.join(UPLOAD_DIR, "pod");
fs.mkdirSync(AVATAR_DIR, { recursive: true });
fs.mkdirSync(POD_DIR, { recursive: true });

// Multer storage with UUID filenames
function createStorage(subDir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(UPLOAD_DIR, subDir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${crypto.randomUUID()}${ext}`;
      cb(null, name);
    },
  });
}

// File filter — images only
function imageFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${ext}. Allowed: ${allowed.join(", ")}`));
  }
}

const avatarUpload = multer({
  storage: createStorage("avatars"),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imageFilter,
});

const podUpload = multer({
  storage: createStorage("pod"),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imageFilter,
});

export function uploadRoutes() {
  const router = Router();

  // POST /api/uploads/avatar — Upload profile avatar
  router.post("/avatar", avatarUpload.single("avatar"), (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const url = `/uploads/avatars/${req.file.filename}`;
      console.log(`📸 [Upload] Avatar: ${url}`);
      res.json({
        success: true,
        url,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // POST /api/uploads/pod — Upload proof of delivery
  router.post("/pod", podUpload.single("pod"), (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const url = `/uploads/pod/${req.file.filename}`;
      console.log(`📸 [Upload] POD: ${url}`);
      res.json({
        success: true,
        url,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Error handler for multer
  router.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 5}MB` });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  return router;
}
