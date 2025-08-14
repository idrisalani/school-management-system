provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "prod"
      Project     = "school-management-system"
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source = "../../modules/networking"

  environment         = "prod"
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
  enable_nat_gateway = true
  single_nat_gateway = false  # Use multiple NAT gateways for HA
  enable_vpn_gateway = true
}

module "database" {
  source = "../../modules/database"

  environment         = "prod"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  instance_class     = var.db_instance_class
  database_name      = var.database_name
  master_username    = var.db_master_username
  master_password    = var.db_master_password
  multi_az           = true
  backup_retention   = 30
  deletion_protection = true
  
  parameter_group_family = "mysql8.0"
  parameters = [
    {
      name  = "max_connections"
      value = "1000"
    },
    {
      name  = "slow_query_log"
      value = "1"
    }
  ]
}

module "storage" {
  source = "../../modules/storage"

  environment          = "prod"
  bucket_name         = var.bucket_name
  create_upload_bucket = true
  create_backup_bucket = true
  
  cors_allowed_origins = var.allowed_origins
  enable_versioning    = true
  enable_encryption    = true
  
  lifecycle_rules = {
    documents = {
      prefix = "documents/"
      enabled = true
      transition_days = 90
      expiration_days = 365
    },
    backups = {
      prefix = "backups/"
      enabled = true
      transition_days = 30
      expiration_days = null
    }
  }
}

module "compute" {
  source = "../../modules/compute"

  environment       = "prod"
  vpc_id           = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  instance_type    = var.instance_type
  key_name         = var.key_name
  ami_id           = var.ami_id

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity
  
  health_check_grace_period = 300
  health_check_type        = "ELB"
  target_group_arns        = [module.load_balancer.target_group_arn]
  
  enable_monitoring        = true
  termination_policies    = ["OldestLaunchConfiguration", "Default"]
  
  root_volume_size        = 50
  root_volume_type        = "gp3"
}

module "load_balancer" {
  source = "../../modules/load_balancer"

  environment       = "prod"
  vpc_id           = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  
  certificate_arn   = var.certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  
  health_check_path = "/health"
  health_check_port = 80
}

module "waf" {
  source = "../../modules/waf"

  environment = "prod"
  alb_arn    = module.load_balancer.alb_arn
  
  rate_limit = 2000
  block_countries = ["CN", "RU", "IR"]
}

module "monitoring" {
  source = "../../modules/monitoring"

  environment = "prod"
  vpc_id     = module.vpc.vpc_id
  
  alarm_email     = var.alarm_email
  sns_topic_name  = "prod-alerts"
  
  enable_dashboard = true
  retention_days  = 30
}

module "backup" {
  source = "../../modules/backup"

  environment = "prod"
  
  backup_resources = [
    module.database.db_arn,
    module.storage.bucket_arn
  ]
  
  retention_days = 30
  schedule      = "cron(0 1 * * ? *)"  # Daily at 1 AM UTC
}