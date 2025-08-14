#!/bin/bash

case "$1" in
  "start")
    docker-compose up -d
    ;;
    
  "start-dev")
    docker-compose -f docker-compose.dev.yml up -d
    ;;
    
  "stop")
    docker-compose down
    ;;
    
  "stop-dev")
    docker-compose -f docker-compose.dev.yml down
    ;;
    
  "logs")
    docker-compose logs -f
    ;;
    
  "rebuild")
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    ;;
    
  "clean")
    docker-compose down -v
    docker system prune -f
    ;;
    
  *)
    echo "Usage: $0 {start|start-dev|stop|stop-dev|logs|rebuild|clean}"
    exit 1
    ;;
esac