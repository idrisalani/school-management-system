// @ts-nocheck
// client/src/features/teacher/components/assignments/shared/FileUploader.jsx
import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  AlertCircle,
  Paperclip,
  CheckCircle,
  Download,
} from "lucide-react";

const FileUploader = ({
  onFileUpload,
  onFileRemove,
  maxFiles = 5,
  maxSize = 5242880, // 5MB
  acceptedTypes = "*/*",
  multiple = true,
  disabled = false,
  existingFiles = [],
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = useCallback(
    (file) => {
      // Check file size
      if (file.size > maxSize) {
        return `File ${file.name} is too large. Maximum size is ${(maxSize / 1048576).toFixed(1)}MB`;
      }

      // Check file type
      if (acceptedTypes !== "*/*") {
        const acceptedTypesArray = acceptedTypes
          .split(",")
          .map((type) => type.trim());
        const fileType = file.type;
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        const isTypeAllowed = acceptedTypesArray.some((type) => {
          // Handle MIME types
          if (type.includes("/")) {
            return fileType.match(new RegExp(type.replace("*", ".*")));
          }
          // Handle file extensions
          if (type.startsWith(".")) {
            return type.substring(1) === fileExtension;
          }
          return false;
        });

        if (!isTypeAllowed) {
          return `File ${file.name} type is not supported. Accepted types: ${acceptedTypes}`;
        }
      }

      return null;
    },
    [maxSize, acceptedTypes]
  );

  const uploadFile = useCallback(async (file) => {
    // Simulated file upload with progress
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(
        () => {
          progress += Math.random() * 15 + 5; // More realistic progress increments
          progress = Math.min(progress, 100);

          setUploading((prev) => ({
            ...prev,
            [file.name]: Math.round(progress),
          }));

          if (progress >= 100) {
            clearInterval(interval);

            // Simulate potential upload failure (5% chance)
            if (Math.random() < 0.05) {
              reject(new Error("Upload failed due to network error"));
            } else {
              resolve({
                id: Date.now() + Math.random(), // More unique ID
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
                uploadDate: new Date().toISOString(),
              });
            }
          }
        },
        100 + Math.random() * 200
      ); // Variable interval for more realistic feel
    });
  }, []);

  const processFiles = useCallback(
    async (newFiles) => {
      // Clear previous general errors
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.maxFiles;
        return newErrors;
      });

      if (files.length + newFiles.length > maxFiles) {
        setErrors((prev) => ({
          ...prev,
          maxFiles: `Maximum ${maxFiles} files allowed. You can upload ${maxFiles - files.length} more file${maxFiles - files.length !== 1 ? "s" : ""}.`,
        }));
        return;
      }

      for (const file of newFiles) {
        // Clear previous errors for this file
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[file.name];
          return newErrors;
        });

        const error = validateFile(file);
        if (error) {
          setErrors((prev) => ({ ...prev, [file.name]: error }));
          continue;
        }

        // Check if file already exists
        if (files.some((f) => f.name === file.name && f.size === file.size)) {
          setErrors((prev) => ({
            ...prev,
            [file.name]: `File ${file.name} already exists`,
          }));
          continue;
        }

        setUploading((prev) => ({ ...prev, [file.name]: 0 }));

        try {
          const uploadedFile = await uploadFile(file);
          setFiles((prev) => [...prev, uploadedFile]);
          onFileUpload?.(uploadedFile);
        } catch (error) {
          setErrors((prev) => ({
            ...prev,
            [file.name]: `Failed to upload ${file.name}: ${error.message}`,
          }));
        } finally {
          setUploading((prev) => {
            const newState = { ...prev };
            delete newState[file.name];
            return newState;
          });
        }
      }
    },
    [files, maxFiles, validateFile, uploadFile, onFileUpload]
  );

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      await processFiles(droppedFiles);
    },
    [disabled, processFiles]
  );

  const handleFileInput = useCallback(
    async (e) => {
      const selectedFiles = Array.from(e.target.files || []);
      await processFiles(selectedFiles);
      // Reset input value to allow same file selection
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [processFiles]
  );

  const handleRemoveFile = useCallback(
    (fileId) => {
      const fileToRemove = files.find((f) => f.id === fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      onFileRemove?.(fileId);

      // Clean up object URL to prevent memory leaks
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
    },
    [files, onFileRemove]
  );

  const clearError = useCallback((errorKey) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }, []);

  const getFileIcon = useCallback((fileType) => {
    if (fileType.startsWith("image/")) return Image;
    if (fileType.startsWith("text/")) return FileText;
    if (fileType.includes("pdf")) return FileText;
    if (fileType.includes("document") || fileType.includes("word"))
      return FileText;
    return File;
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  const handleUploadClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleDownloadFile = useCallback((file) => {
    if (file.url) {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Calculate remaining upload slots
  const remainingSlots = maxFiles - files.length;
  const hasErrors = Object.keys(errors).length > 0;
  const isUploading = Object.keys(uploading).length > 0;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${
            dragActive
              ? "border-blue-400 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-gray-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}
          ${hasErrors ? "border-red-300" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        <div className="text-center">
          <div
            className={`mx-auto h-12 w-12 transition-colors duration-200 ${
              dragActive ? "text-blue-500" : "text-gray-400"
            }`}
          >
            <Upload className="h-full w-full" />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 font-medium">
              {dragActive
                ? "Drop files here to upload"
                : disabled
                  ? "File upload disabled"
                  : "Drag files here or click to browse"}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {remainingSlots > 0
                ? `${remainingSlots} of ${maxFiles} slots remaining • Up to ${(maxSize / 1048576).toFixed(1)}MB per file`
                : `Maximum ${maxFiles} files reached`}
            </p>
            {acceptedTypes !== "*/*" && (
              <p className="mt-1 text-xs text-blue-600 font-medium">
                Accepted: {acceptedTypes.replace(/\*/g, "").replace(/,/g, ", ")}
              </p>
            )}
          </div>
        </div>

        {/* Upload progress indicator */}
        {isUploading && (
          <div className="absolute top-2 right-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {hasErrors && (
        <div className="space-y-2">
          {Object.entries(errors).map(([key, error]) => (
            <div
              key={key}
              className="flex items-start space-x-3 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200"
            >
              <AlertCircle
                size={16}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => clearError(key)}
                className="text-red-400 hover:text-red-600 transition-colors"
                title="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {(files.length > 0 || isUploading) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              {files.length > 0 && `Uploaded Files (${files.length})`}
              {isUploading && files.length === 0 && "Uploading..."}
            </h4>
            {files.length > 0 && (
              <span className="text-xs text-gray-500">
                {formatFileSize(
                  files.reduce((total, file) => total + file.size, 0)
                )}{" "}
                total
              </span>
            )}
          </div>

          {/* Uploaded Files */}
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg group hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <FileIcon size={20} className="text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      {file.uploadDate && (
                        <>
                          <span>•</span>
                          <span>
                            Uploaded{" "}
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-3">
                  {file.url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      className="p-1 hover:bg-green-200 rounded transition-colors"
                      title="Download file"
                      disabled={disabled}
                    >
                      <Download size={16} className="text-green-600" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.id);
                    }}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Remove file"
                    disabled={disabled}
                  >
                    <X size={16} className="text-gray-500 hover:text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Uploading Files */}
          {Object.entries(uploading).map(([fileName, progress]) => (
            <div
              key={fileName}
              className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <Paperclip
                size={20}
                className="text-blue-500 animate-pulse flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileName}
                </p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && !isUploading && (
        <div className="text-center py-4 text-gray-500">
          <File className="mx-auto h-8 w-8 opacity-50 mb-2" />
          <p className="text-sm">No files uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
