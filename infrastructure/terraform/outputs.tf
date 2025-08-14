# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

# Database Outputs
output "db_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "db_name" {
  description = "Name of the database"
  value       = module.database.db_name
}

output "db_port" {
  description = "Port of the database"
  value       = module.database.db_port
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = module.compute.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the application load balancer"
  value       = module.compute.alb_zone_id
}

# Security Group Outputs
output "app_security_group_id" {
  description = "ID of the application security group"
  value       = module.compute.app_security_group_id
}

output "db_security_group_id" {
  description = "ID of the database security group"
  value       = module.database.db_security_group_id
}

# Storage Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.storage.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.storage.bucket_arn
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Zone ID of the Route53 hosted zone"
  value       = module.dns.zone_id
}

output "domain_name" {
  description = "Domain name of the application"
  value       = var.domain_name
}

# Autoscaling Outputs
output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = module.compute.asg_name
}

output "asg_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = module.compute.asg_arn
}

# CloudWatch Outputs
output "log_group_name" {
  description = "Name of the CloudWatch Log Group"
  value       = module.monitoring.log_group_name
}

output "alarm_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch Alarms"
  value       = module.monitoring.alarm_topic_arn
}

# Certificate Outputs
output "certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = module.certificate.certificate_arn
}

# KMS Outputs
output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = module.kms.key_arn
  sensitive   = true
}

# Environment Outputs
output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# Tags Outputs
output "common_tags" {
  description = "Common tags applied to all resources"
  value       = {
    Environment = var.environment
    Project     = "school-management-system"
    ManagedBy   = "terraform"
  }
}