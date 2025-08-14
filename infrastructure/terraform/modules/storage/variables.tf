variable "environment" {
  description = "Environment name"
  type        = string
}

variable "bucket_name" {
  description = "Base name of the S3 bucket"
  type        = string
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "lambda_function_arn" {
  description = "ARN of Lambda function for bucket notifications"
  type        = string
  default     = null
}

variable "create_upload_bucket" {
  description = "Whether to create a separate bucket for uploads"
  type        = bool
  default     = false
}

variable "create_backup_bucket" {
  description = "Whether to create a separate bucket for backups"
  type        = bool
  default     = false
}

variable "enable_versioning" {
  description = "Enable versioning on the bucket"
  type        = bool
  default     = true
}

variable "enable_encryption" {
  description = "Enable server-side encryption"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for the bucket"
  type        = map(string)
  default     = {}
}