# Network Configuration
vpc_cidr = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
public_subnets     = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnets    = ["10.1.10.0/24", "10.1.11.0/24"]

# Database Configuration
db_instance_class  = "db.t3.medium"
database_name      = "school_mgmt_staging"
db_master_username = "admin"
# db_master_password should be provided via secrets management

# Storage Configuration
bucket_name = "school-mgmt-staging-files"

# Compute Configuration
instance_type     = "t3.medium"
key_name          = "staging-key"
ami_id            = "ami-0c55b159cbfafe1f0"  # Update with latest Amazon Linux 2 AMI
min_size         = 1
max_size         = 3
desired_capacity = 2

# Load Balancer Configuration
allowed_origins = [
  "https://staging.schoolmgmt.com"
]

# Monitoring Configuration
alarm_email = "staging-ops@schoolmgmt.com"