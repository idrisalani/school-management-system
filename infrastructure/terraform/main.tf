terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket         = "school-mgmt-terraform-state"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "school-mgmt-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "school-management-system"
      ManagedBy   = "terraform"
    }
  }
}

module "networking" {
  source = "./modules/networking"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
}

module "database" {
  source = "./modules/database"

  environment      = var.environment
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnet_ids
  instance_class  = var.db_instance_class
  database_name   = var.database_name
  master_username = var.db_master_username
  master_password = var.db_master_password
}

module "compute" {
  source = "./modules/compute"

  environment       = var.environment
  vpc_id           = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  instance_type    = var.instance_type
  key_name         = var.key_name
  ami_id           = var.ami_id
}

module "storage" {
  source = "./modules/storage"

  environment = var.environment
  bucket_name = var.bucket_name
}