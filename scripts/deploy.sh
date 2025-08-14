#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Default values
ENVIRONMENT=${ENVIRONMENT:-"staging"}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.azurecr.io"}
APP_NAME="school-management"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    command -v docker >/dev/null 2>&1 || { 
        log_error "Docker is required but not installed. Aborting."
        exit 1
    }
    
    command -v docker-compose >/dev/null 2>&1 || {
        log_error "Docker Compose is required but not installed. Aborting."
        exit 1
    }

    command -v terraform >/dev/null 2>&1 || {
        log_warn "Terraform is not installed. Infrastructure deployment will be skipped."
    }
}

build_images() {
    log_info "Building Docker images for $ENVIRONMENT environment..."
    
    # Build client image
    docker build \
        -t $DOCKER_REGISTRY/$APP_NAME-client:$TIMESTAMP \
        -t $DOCKER_REGISTRY/$APP_NAME-client:latest \
        -f infrastructure/docker/Dockerfile.client \
        --build-arg NODE_ENV=$ENVIRONMENT \
        .

    # Build server image
    docker build \
        -t $DOCKER_REGISTRY/$APP_NAME-server:$TIMESTAMP \
        -t $DOCKER_REGISTRY/$APP_NAME-server:latest \
        -f infrastructure/docker/Dockerfile.server \
        --build-arg NODE_ENV=$ENVIRONMENT \
        .
}

push_images() {
    log_info "Pushing images to registry..."
    
    docker push $DOCKER_REGISTRY/$APP_NAME-client:$TIMESTAMP
    docker push $DOCKER_REGISTRY/$APP_NAME-client:latest
    docker push $DOCKER_REGISTRY/$APP_NAME-server:$TIMESTAMP
    docker push $DOCKER_REGISTRY/$APP_NAME-server:latest
}

deploy_infrastructure() {
    if [ -x "$(command -v terraform)" ]; then
        log_info "Deploying infrastructure for $ENVIRONMENT environment..."
        
        cd infrastructure/terraform/environments/$ENVIRONMENT

        # Initialize Terraform
        terraform init

        # Plan and apply changes
        terraform plan -out=tfplan
        terraform apply -auto-approve tfplan

        cd ../../../../
    else
        log_warn "Skipping infrastructure deployment (Terraform not installed)"
    fi
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Run migrations using Docker
    docker-compose run --rm server npm run migrate
}

deploy_application() {
    log_info "Deploying application to $ENVIRONMENT environment..."
    
    # Update Docker Compose configuration
    export IMAGE_TAG=$TIMESTAMP
    
    # Deploy using Docker Compose
    docker-compose -f docker-compose.$ENVIRONMENT.yml pull
    docker-compose -f docker-compose.$ENVIRONMENT.yml up -d
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Add your smoke tests here
    curl -f http://localhost/health || {
        log_error "Smoke tests failed!"
        exit 1
    }
}

rollback() {
    log_error "Deployment failed! Rolling back..."
    
    # Revert to previous version
    export IMAGE_TAG=latest
    docker-compose -f docker-compose.$ENVIRONMENT.yml up -d
    
    log_info "Rollback completed"
    exit 1
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove old images
    docker image prune -f
    
    # Remove build artifacts
    rm -rf dist build
}

# Main deployment process
main() {
    log_info "Starting deployment to $ENVIRONMENT environment..."

    # Parse command line arguments
    while getopts ":e:s" opt; do
        case $opt in
            e) ENVIRONMENT="$OPTARG";;
            s) SKIP_INFRASTRUCTURE=true;;
            \?) log_error "Invalid option -$OPTARG"; exit 1;;
        esac
    done

    # Check dependencies
    check_dependencies

    # Build and deploy process
    if [ "$ENVIRONMENT" = "production" ]; then
        read -p "Are you sure you want to deploy to production? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 1
        fi
    fi

    # Start deployment steps
    build_images || { log_error "Build failed"; exit 1; }
    push_images || { log_error "Push failed"; exit 1; }

    if [ "$SKIP_INFRASTRUCTURE" != true ]; then
        deploy_infrastructure || { log_error "Infrastructure deployment failed"; exit 1; }
    fi

    run_database_migrations || { log_error "Database migration failed"; rollback; }
    deploy_application || { log_error "Application deployment failed"; rollback; }
    run_smoke_tests || { log_error "Smoke tests failed"; rollback; }
    cleanup

    log_info "Deployment completed successfully!"
}

# Run main function
main "$@"