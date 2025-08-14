resource "aws_kms_key" "bucket_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7
  enable_key_rotation    = true

  tags = {
    Name        = "${var.environment}-s3-kms-key"
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "main" {
  bucket = "${var.environment}-${var.bucket_name}"

  tags = {
    Name        = "${var.environment}-${var.bucket_name}"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.bucket_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_rule" "main" {
  bucket = aws_s3_bucket.main.id
  id     = "file_lifecycle"
  enabled = true

  # Transition objects to infrequent access after 30 days
  transition {
    days          = 30
    storage_class = "STANDARD_IA"
  }

  # Transition objects to glacier after 90 days
  transition {
    days          = 90
    storage_class = "GLACIER"
  }

  # Delete objects after 365 days
  expiration {
    days = 365
  }

  # Clean up incomplete multipart uploads
  abort_incomplete_multipart_upload_days = 7

  noncurrent_version_transition {
    noncurrent_days = 30
    storage_class   = "STANDARD_IA"
  }

  noncurrent_version_expiration {
    noncurrent_days = 90
  }
}

resource "aws_s3_bucket_cors_rule" "main" {
  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.main.id

  lambda_function {
    lambda_function_arn = var.lambda_function_arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }

  depends_on = [aws_lambda_permission.allow_bucket]
}

resource "aws_lambda_permission" "allow_bucket" {
  count         = var.lambda_function_arn != null ? 1 : 0
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.main.arn
}

# Create separate buckets for different purposes if needed
resource "aws_s3_bucket" "uploads" {
  count  = var.create_upload_bucket ? 1 : 0
  bucket = "${var.environment}-${var.bucket_name}-uploads"

  tags = {
    Name        = "${var.environment}-${var.bucket_name}-uploads"
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "backups" {
  count  = var.create_backup_bucket ? 1 : 0
  bucket = "${var.environment}-${var.bucket_name}-backups"

  tags = {
    Name        = "${var.environment}-${var.bucket_name}-backups"
    Environment = var.environment
  }
}