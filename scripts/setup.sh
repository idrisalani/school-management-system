#!/bin/bash

# Exit on error
set -e

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

check_system_requirements() {
    log_info "Checking system requirements..."

    # Check operating system
    case "$(uname -s)" in
        Linux*)     OS=Linux;;
        Darwin*)    OS=Mac;;
        *)         log_error "Unsupported operating system"; exit 1;;
    esac

    # Check minimum RAM
    TOTAL_RAM=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || sysctl -n hw.memsize 2>/dev/null | awk '{print $1/1024}')
    MIN_RAM=$((4 * 1024 * 1024)) # 4GB in KB

    if [ -n "$TOTAL_RAM" ] && [ "$TOTAL_RAM" -lt "$MIN_RAM" ]; then
        log_warn "System has less than 4GB RAM, performance may be affected"
    fi
}

install_dependencies() {
    log_info "Installing system dependencies..."

    case "$(uname -s)" in
        Linux*)
            # Check for apt package manager (Debian/Ubuntu)
            if command -v apt-get >/dev/null; then
                sudo apt-get update
                sudo apt-get install -y \
                    curl \
                    git \
                    make \
                    docker.io \
                    docker-compose \
                    nodejs \
                    npm
            # Check for yum package manager (RHEL/CentOS)
            elif command -v yum >/dev/null; then
                sudo yum update -y
                sudo yum install -y \
                    curl \
                    git \
                    make \
                    docker \
                    docker-compose \
                    nodejs \
                    npm
            else
                log_error "Unsupported Linux distribution"
                exit 1
            fi
            ;;
        Darwin*)
            # Check if Homebrew is installed
            if ! command -v brew >/dev/null; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi

            brew update
            brew install \
                git \
                make \
                docker \
                docker-compose \
                node
            ;;
    esac
}

setup_docker() {
    log_info "Setting up Docker..."

    # Start Docker service if not running
    case "$(uname -s)" in
        Linux*)
            if ! systemctl is-active --quiet docker; then
                sudo systemctl start docker
                sudo systemctl enable docker
            fi
            # Add current user to docker group
            sudo usermod -aG docker "$USER"
            ;;
        Darwin*)
            # Check if Docker Desktop is installed
            if ! command -v docker >/dev/null; then
                log_error "Please install Docker Desktop for Mac"
                exit 1
            fi
            ;;
    esac
}

setup_database() {
    log_info "Setting up development database..."

    # Run database container
    docker-compose -f docker-compose.dev.yml up -d db

    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10

    # Run migrations
    docker-compose -f docker-compose.dev.yml run --rm server npm run migrate

    # Seed database with initial data
    docker-compose -f docker-compose.dev.yml run --rm server npm run seed
}

setup_environment() {
    log_info "Setting up environment files..."

    # Client environment
    if [ ! -f client/.env ]; then
        cp client/.env.example client/.env
        log_info "Created client/.env"
    else
        log_warn "client/.env already exists, skipping"
    fi

    # Server environment
    if [ ! -f server/.env ]; then
        cp server/.env.example server/.env
        log_info "Created server/.env"
    else
        log_warn "server/.env already exists, skipping"
    fi
}

install_node_modules() {
    log_info "Installing Node.js dependencies..."

    # Install client dependencies
    cd client
    npm install
    cd ..

    # Install server dependencies
    cd server
    npm install
    cd ..
}

setup_git_hooks() {
    log_info "Setting up Git hooks..."

    # Install husky
    npm install husky --save-dev
    npx husky install

    # Add pre-commit hook
    npx husky add .husky/pre-commit "npm run lint && npm run test"
    npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
}

generate_ssl_certs() {
    log_info "Generating SSL certificates for local development..."

    mkdir -p ./infrastructure/nginx/ssl

    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ./infrastructure/nginx/ssl/localhost.key \
        -out ./infrastructure/nginx/ssl/localhost.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
}

print_success_message() {
    echo -e "\n${GREEN}Setup completed successfully!${NC}"
    echo -e "\nNext steps:"
    echo "1. Review and update environment variables in client/.env and server/.env"
    echo "2. Start the development server with: npm run dev"
    echo "3. Access the application at: http://localhost:3000"
    echo -e "\nFor more information, see the README.md file"
}

# Main setup process
main() {
    log_info "Starting setup process..."

    # Check if script is run with sudo
    if [ "$EUID" -eq 0 ]; then
        log_error "Please do not run this script with sudo"
        exit 1
    }

    # Check system requirements
    check_system_requirements

    # Install dependencies
    install_dependencies

    # Setup Docker
    setup_docker

    # Setup environment files
    setup_environment

    # Install Node.js dependencies
    install_node_modules

    # Setup database
    setup_database

    # Setup Git hooks
    setup_git_hooks

    # Generate SSL certificates
    generate_ssl_certs

    # Print success message
    print_success_message
}

# Run main function
main