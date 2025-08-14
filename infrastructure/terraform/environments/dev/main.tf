provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "school-management-system"
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source = "../../modules/networking"

  environment         = "dev"
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
}

module "database" {
  source = "../../modules/database"

  environment      = "dev"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  instance_class  = var.db_instance_class
  database_name   = var.database_name
  master_username = var.db_master_username
  master_password = var.db_master_password
}

module "storage" {
  source = "../../modules/storage"

  environment          = "dev"
  bucket_name         = var.bucket_name
  create_upload_bucket = true
  create_backup_bucket = true
  
  cors_allowed_origins = [
    "http://localhost:3000",
    "https://dev.schoolmgmt.com"
  ]
}

module "compute" {
  source = "../../modules/compute"

  environment       = "dev"
  vpc_id           = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  instance_type    = var.instance_type
  key_name         = var.key_name
  ami_id           = var.ami_id

  min_size         = 1
  max_size         = 2
  desired_capacity = 1
}