// server/src/routes/upload.routes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @typedef {Object} UserDocument
 * @property {string} _id - User ID
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} role - User role
 */

/**
 * Configure multer for file uploads
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");

    try {
      // Create uploads directory if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, "");
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  },
});

/**
 * File filter for security
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
    "text/plain": "txt",
    "text/csv": "csv",
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

/**
 * Configure multer middleware
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
  },
});

/**
 * @typedef {Object} UploadedFile
 * @property {string} id - File ID
 * @property {string} filename - Original filename
 * @property {string} path - File path on server
 * @property {string} mimetype - File MIME type
 * @property {number} size - File size in bytes
 * @property {string} uploadedBy - User ID who uploaded the file
 * @property {Date} uploadedAt - Upload timestamp
 */

// POST /upload/single - Upload single file
router.post(
  "/single",
  authenticate(),
  upload.single("file"),
  async (req, res) => {
    try {
      const user = /** @type {UserDocument} */ (req.user);
      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file provided",
        });
        return;
      }

      const { folder = "general" } = req.body;

      // Create file record
      const fileRecord = {
        id: req.file.filename.split("-")[1], // Extract unique ID
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        folder: folder,
        uploadedBy: user._id,
        uploadedAt: new Date(),
      };

      // TODO: Save file record to database
      // await FileModel.create(fileRecord);

      res.json({
        success: true,
        message: "File uploaded successfully",
        data: {
          id: fileRecord.id,
          filename: fileRecord.originalName,
          size: fileRecord.size,
          mimetype: fileRecord.mimetype,
          url: `/api/uploads/files/${fileRecord.filename}`,
        },
      });
      return;
    } catch (error) {
      console.error("File upload error:", error);

      // Clean up uploaded file if there's an error
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("Error cleaning up file:", unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: "File upload failed",
        error: error.message,
      });
      return;
    }
  }
);

// POST /upload/multiple - Upload multiple files
router.post(
  "/multiple",
  authenticate(),
  upload.array("files", 5), // Maximum 5 files
  async (req, res) => {
    try {
      const user = /** @type {UserDocument} */ (req.user);
      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!req.files || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: "No files provided",
        });
        return;
      }

      const { folder = "general" } = req.body;
      const uploadedFiles = [];

      // Ensure req.files is an array (when using upload.array())
      const filesArray = Array.isArray(req.files) ? req.files : [];

      for (const file of filesArray) {
        const fileRecord = {
          id: file.filename.split("-")[1],
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          folder: folder,
          uploadedBy: user._id,
          uploadedAt: new Date(),
        };

        // TODO: Save to database
        // await FileModel.create(fileRecord);

        uploadedFiles.push({
          id: fileRecord.id,
          filename: fileRecord.originalName,
          size: fileRecord.size,
          mimetype: fileRecord.mimetype,
          url: `/api/uploads/files/${fileRecord.filename}`,
        });
      }

      res.json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: uploadedFiles,
      });
      return;
    } catch (error) {
      console.error("Multiple file upload error:", error);

      // Clean up uploaded files if there's an error
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error("Error cleaning up file:", unlinkError);
          }
        }
      }

      res.status(500).json({
        success: false,
        message: "File upload failed",
        error: error.message,
      });
      return;
    }
  }
);

// GET /upload/files/:filename - Serve uploaded file
router.get("/files/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    // Security check - prevent path traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
      return;
    }

    const filePath = path.join(__dirname, "../../uploads", filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "File not found",
      });
      return;
    }

    // Get file info
    const stats = await fs.stat(filePath);
    const extension = path.extname(filename).toLowerCase();

    // Set appropriate content type
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".txt": "text/plain",
      ".csv": "text/csv",
    };

    const contentType = mimeTypes[extension] || "application/octet-stream";

    // Set headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day

    // Send file - void the return to prevent TypeScript issues
    res.sendFile(filePath);
    return;
  } catch (error) {
    console.error("File serve error:", error);
    res.status(500).json({
      success: false,
      message: "Error serving file",
      error: error.message,
    });
    return;
  }
});

// DELETE /upload/files/:filename - Delete uploaded file
router.delete("/files/:filename", authenticate(), async (req, res) => {
  try {
    const user = /** @type {UserDocument} */ (req.user);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const { filename } = req.params;

    // Security check
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
      return;
    }

    // TODO: Check if user has permission to delete this file
    // const fileRecord = await FileModel.findOne({ filename });
    // if (!fileRecord || fileRecord.uploadedBy !== user._id) {
    //   res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this file'
    //   });
    //   return;
    // }

    const filePath = path.join(__dirname, "../../uploads", filename);

    // Delete file from filesystem
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        // File not found is okay
        throw error;
      }
    }

    // TODO: Delete file record from database
    // await FileModel.deleteOne({ filename });

    res.json({
      success: true,
      message: "File deleted successfully",
    });
    return;
  } catch (error) {
    console.error("File delete error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting file",
      error: error.message,
    });
    return;
  }
});

// GET /upload/list - List uploaded files (with pagination)
router.get("/list", authenticate(), async (req, res) => {
  try {
    const user = /** @type {UserDocument} */ (req.user);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const { folder, page = "1", limit = "20" } = req.query;

    // Convert query parameters to proper types
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);

    // TODO: Implement database query
    // const query = { uploadedBy: user._id };
    // if (folder) query.folder = folder;

    // const files = await FileModel.find(query)
    //   .sort({ uploadedAt: -1 })
    //   .skip((pageNum - 1) * limitNum)
    //   .limit(limitNum);

    // For now, return empty array
    const files = [];

    res.json({
      success: true,
      data: files,
      pagination: {
        currentPage: pageNum,
        totalPages: 1,
        totalItems: files.length,
        itemsPerPage: limitNum,
      },
    });
    return;
  } catch (error) {
    console.error("File list error:", error);
    res.status(500).json({
      success: false,
      message: "Error listing files",
      error: error.message,
    });
    return;
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "File upload error";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "File size too large. Maximum size is 10MB.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Maximum is 5 files per request.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field.";
        break;
      default:
        message = error.message;
    }

    res.status(400).json({
      success: false,
      message: message,
    });
    return;
  }

  if (
    error.message.includes("File type") &&
    error.message.includes("not allowed")
  ) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  next(error);
});

module.exports = router;
