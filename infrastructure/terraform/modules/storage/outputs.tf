output "bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for bucket encryption"
  value       = aws_kms_key.bucket_key.arn
}

output "bucket_domain_name" {
  description = "Domain name of the bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "upload_bucket_name" {
  description = "Name of the uploads bucket if created"
  value       = var.create_upload_bucket ? aws_s3_bucket.uploads[0].id : null
}

output "backup_bucket_name" {
  description = "Name of the backups bucket if created"
  value       = var.create_backup_bucket ? aws_s3_bucket.backups[0].id : null
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the bucket"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}