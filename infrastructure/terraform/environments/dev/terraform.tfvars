# Network Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets    = ["10.0.10.0/24", "10.0.11.0/24"]

# Database Configuration
db_instance_class  = "db.t3.micro"
database_name      = "school_mgmt_dev"
db_master_username = "admin"
# db_master_password should be provided via environment variable or secrets management

# Storage Configuration
bucket_name = "school-mgmt-dev-files"

# Compute Configuration
instance_type = "t3.micro"
key_name      = "dev-key"
ami_id        = "ami-0c55b159cbfafe1f0" # Update with latest Amazon Linux 2 AMI

# Application Configuration
domain_name = "dev.schoolmgmt.com"