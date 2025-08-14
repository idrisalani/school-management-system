// server/src/services/fileService.js
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const crypto = require("crypto");
const logger = require("../utils/logger");

/**
 * @typedef {import('express-serve-static-core').ParamsDictionary} ParamsDictionary
 * @typedef {import('express-serve-static-core').Query} Query
 * @typedef {import('express-serve-static-core').Request<ParamsDictionary, any, any, Query>} BaseRequest
 * @typedef {import('express-serve-static-core').Response} BaseResponse
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * @typedef {'temp' | 'permanent'} LocationType
 */

/**
 * @typedef {Object} MulterFile
 * @property {string} fieldname - Field name from the form
 * @property {string} originalname - Original file name
 * @property {string} encoding - File encoding
 * @property {string} mimetype - MIME type
 * @property {string} destination - Upload destination
 * @property {string} filename - Generated filename
 * @property {string} path - File path
 * @property {number} size - File size in bytes
 */

/**
 * @typedef {Object} FileInfo
 * @property {string} filename - Name of the file
 * @property {string} [originalname] - Original name of the file
 * @property {string} [mimetype] - MIME type of the file
 * @property {number} size - Size of file in bytes
 * @property {Date} created - Creation date
 * @property {Date} modified - Last modified date
 * @property {string} path - Full path to file
 * @property {LocationType} type - File location type
 */

/**
 * @typedef {Object} MulterRequest
 * @property {MulterFile} [file] - Single uploaded file
 */

/**
 * @typedef {BaseRequest & { file?: MulterFile }} FileRequest
 * @typedef {BaseResponse} FileResponse
 * @typedef {NextFunction} FileNextFunction
 */

class FileService {
  /** @type {string} */
  uploadDir;
  /** @type {string} */
  tempDir;
  /** @type {Set<string>} */
  allowedMimes;
  /** @type {multer.Multer} */
  upload;

  constructor() {
    /** @type {string} */
    this.uploadDir = path.join(__dirname, "../../uploads");
    /** @type {string} */
    this.tempDir = path.join(this.uploadDir, "temp");

    /** @type {Set<string>} */
    this.allowedMimes = new Set([
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]);

    this.initializeDirectories();
    this.configureMulter();
  }

  /**
   * Initialize upload directories
   * @returns {Promise<void>}
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error("Error creating upload directories:", error);
      throw error;
    }
  }

  /**
   * Configure multer for file uploads
   */
  configureMulter() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.tempDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString("hex");
        const sanitizedName = this.sanitizeFilename(file.originalname);
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
      },
    });

    const fileFilter = (req, file, cb) => {
      if (this.allowedMimes.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    };

    this.upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5,
      },
    });
  }

  /**
   * Get safe file path
   * @param {string} filename - File name
   * @param {LocationType} [type='temp'] - File location type
   * @returns {string} Safe file path
   */
  getFilePath(filename, type = "temp") {
    const sanitizedName = this.sanitizeFilename(filename);
    const baseDir = type === "permanent" ? this.uploadDir : this.tempDir;
    return path.join(baseDir, sanitizedName);
  }

  /**
   * Sanitize filename
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.{2,}/g, ".");
  }

  /**
   * Save uploaded file
   * @param {MulterFile} file - Uploaded file
   * @param {string} directory - Target directory
   * @returns {Promise<FileInfo>}
   */
  async saveFile(file, directory) {
    if (!file?.path) {
      throw new Error("Invalid file object");
    }

    try {
      const destDir = path.join(
        this.uploadDir,
        this.sanitizeFilename(directory)
      );
      await fs.mkdir(destDir, { recursive: true });

      const finalPath = path.join(destDir, file.filename);
      await fs.rename(file.path, finalPath);

      const stat = await fs.stat(finalPath);

      return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: stat.size,
        created: stat.birthtime,
        modified: stat.mtime,
        path: finalPath,
        type: "permanent",
      };
    } catch (error) {
      logger.error("Error saving file:", error);
      throw error;
    }
  }

  /**
   * Handle file upload middleware
   * @param {string} fieldName - Form field name
   * @returns {(req: FileRequest, res: FileResponse, next: FileNextFunction) => Promise<void>}
   */
  handleUpload(fieldName) {
    return async (req, res, next) => {
      try {
        await new Promise((resolve, reject) => {
          this.upload.single(fieldName)(req, res, (err) => {
            if (err) reject(err);
            else resolve(undefined);
          });
        });

        if (!req.file) {
          res.status(400).json({
            status: "error",
            message: "No file uploaded",
          });
          return;
        }

        if (!this.allowedMimes.has(req.file.mimetype)) {
          await this.deleteFile(req.file.path);
          res.status(400).json({
            status: "error",
            message: "Invalid file type",
          });
          return;
        }

        next();
      } catch (error) {
        if (error instanceof multer.MulterError) {
          res.status(400).json({
            status: "error",
            message: "File upload error",
            error: error.message,
          });
          return;
        }

        logger.error("Upload error:", error);
        res.status(500).json({
          status: "error",
          message: "File upload failed",
        });
        return;
      }
    };
  }

  /**
   * Create file upload middleware
   * @param {string} fieldName - Form field name
   * @returns {(req: FileRequest, res: FileResponse, next: FileNextFunction) => void}
   */
  createUploadMiddleware(fieldName) {
    const upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.tempDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = crypto.randomBytes(16).toString("hex");
          const sanitizedName = this.sanitizeFilename(file.originalname);
          cb(null, `${uniqueSuffix}-${sanitizedName}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (this.allowedMimes.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
          cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5,
      },
    });

    return (req, res, next) => {
      upload.single(fieldName)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          res.status(400).json({
            status: "error",
            message: "File upload error",
            error: err.message,
          });
          return;
        }

        if (err) {
          res.status(400).json({
            status: "error",
            message: err.message || "Unknown upload error",
          });
          return;
        }

        // Explicitly check for file existence
        if (!req.file) {
          res.status(400).json({
            status: "error",
            message: "No file uploaded",
          });
          return;
        }

        // Check MIME type
        if (!this.allowedMimes.has(req.file.mimetype)) {
          res.status(400).json({
            status: "error",
            message: "Invalid file type",
          });
          return;
        }

        next();
      });
    };
  }

  /**
   * Stream file for download
   * @param {string} filepath - Path to file
   * @param {FileResponse} res - Express response
   * @returns {Promise<void>}
   */
  async streamFile(filepath, res) {
    try {
      const stat = await fs.stat(filepath);
      const stream = fsSync.createReadStream(filepath);

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Length", stat.size);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(path.basename(filepath))}"`
      );

      await new Promise((resolve, reject) => {
        stream.pipe(res).on("finish", resolve).on("error", reject);
      });
    } catch (error) {
      logger.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          message: "Error streaming file",
        });
      }
      throw error;
    }
  }

  /**
   * Delete file
   * @param {string} filepath - Path to file
   * @returns {Promise<void>}
   */
  async deleteFile(filepath) {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      logger.error("Error deleting file:", error);
    }
  }

  /**
   * Get file information
   * @param {string} filename - File name
   * @param {LocationType} [type='temp'] - File location type
   * @returns {Promise<FileInfo>} File information
   */
  async getFileInfo(filename, type = "temp") {
    try {
      const filepath = this.getFilePath(filename, type);
      const stat = await fs.stat(filepath);

      return {
        filename,
        size: stat.size,
        created: stat.birthtime,
        modified: stat.mtime,
        path: filepath,
        type,
      };
    } catch (error) {
      logger.error("Error getting file info:", error);
      throw error;
    }
  }
}

module.exports = new FileService();
