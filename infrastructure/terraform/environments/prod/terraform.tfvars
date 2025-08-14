# Network Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnets     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnets    = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

# Database Configuration
db_instance_class  = "db.r5.large"
database_name      = "school_mgmt_prod"
db_master_username = "admin"
# db_master_password should be provided via secrets management

# Storage Configuration
bucket_name = "school-mgmt-prod-files"

# Compute Configuration
instance_type     = "t3.large"
key_name          = "prod-key"
ami_id            = "ami-0c55b159cbfafe1f0"  # Update with latest Amazon Linux 2 AMI
min_size         = 2
max_size         = 6
desired_capacity = 2

# Load Balancer Configuration
allowed_origins = [
  "https://schoolmgmt.com",
  "https://www.schoolmgmt.com"
]

# Monitoring Configuration
alarm_email = "ops@schoolmgmt.com"

# Application Configuration
domain_name = "schoolmgmt.com"