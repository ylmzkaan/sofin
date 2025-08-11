#!/bin/bash

# Social Finance Helm Chart Deployment Script
# This script helps deploy the Social Finance application to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RELEASE_NAME="social-finance"
NAMESPACE="social-finance"
CHART_PATH="./social-finance"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
}

# Function to check if helm is available
check_helm() {
    if ! command -v helm &> /dev/null; then
        print_error "Helm is not installed. Please install Helm first."
        exit 1
    fi
}

# Function to check cluster connectivity
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
}

# Function to create namespace
create_namespace() {
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        print_status "Creating namespace: $NAMESPACE"
        kubectl create namespace $NAMESPACE
        print_success "Namespace created successfully"
    else
        print_status "Namespace $NAMESPACE already exists"
    fi
}

# Function to deploy the chart
deploy_chart() {
    print_status "Deploying Social Finance application..."
    
    # Check if release already exists
    if helm list -n $NAMESPACE | grep -q $RELEASE_NAME; then
        print_warning "Release $RELEASE_NAME already exists. Upgrading..."
        helm upgrade $RELEASE_NAME $CHART_PATH \
            --namespace $NAMESPACE \
            --values values.yaml \
            --wait \
            --timeout 10m
    else
        print_status "Installing new release: $RELEASE_NAME"
        helm install $RELEASE_NAME $CHART_PATH \
            --namespace $NAMESPACE \
            --values values.yaml \
            --wait \
            --timeout 10m
    fi
    
    print_success "Deployment completed successfully!"
}

# Function to show deployment status
show_status() {
    print_status "Checking deployment status..."
    
    echo ""
    echo "=== POD STATUS ==="
    kubectl get pods -n $NAMESPACE -l app.kubernetes.io/instance=$RELEASE_NAME
    
    echo ""
    echo "=== SERVICE STATUS ==="
    kubectl get services -n $NAMESPACE -l app.kubernetes.io/instance=$RELEASE_NAME
    
    echo ""
    echo "=== INGRESS STATUS ==="
    kubectl get ingress -n $NAMESPACE -l app.kubernetes.io/instance=$RELEASE_NAME
    
    echo ""
    echo "=== PERSISTENT VOLUME CLAIMS ==="
    kubectl get pvc -n $NAMESPACE -l app.kubernetes.io/instance=$RELEASE_NAME
}

# Function to show logs
show_logs() {
    local component=${1:-"backend"}
    print_status "Showing logs for $component..."
    
    local pod_name=$(kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=$component,app.kubernetes.io/instance=$RELEASE_NAME -o jsonpath='{.items[0].metadata.name}')
    
    if [ -n "$pod_name" ]; then
        kubectl logs -n $NAMESPACE -f $pod_name
    else
        print_error "No pod found for component: $component"
    fi
}

# Function to uninstall the release
uninstall_chart() {
    print_warning "Uninstalling release: $RELEASE_NAME"
    
    if helm list -n $NAMESPACE | grep -q $RELEASE_NAME; then
        helm uninstall $RELEASE_NAME -n $NAMESPACE
        print_success "Release uninstalled successfully"
        
        # Optionally delete the namespace
        read -p "Do you want to delete the namespace $NAMESPACE? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kubectl delete namespace $NAMESPACE
            print_success "Namespace deleted successfully"
        fi
    else
        print_warning "Release $RELEASE_NAME not found"
    fi
}

# Function to show help
show_help() {
    echo "Social Finance Helm Chart Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy      Deploy the application to Kubernetes"
    echo "  status      Show deployment status"
    echo "  logs        Show logs for a component (backend/frontend/postgres/redis)"
    echo "  uninstall   Uninstall the application"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                    # Deploy the application"
    echo "  $0 status                    # Show deployment status"
    echo "  $0 logs backend              # Show backend logs"
    echo "  $0 logs frontend             # Show frontend logs"
    echo "  $0 uninstall                 # Uninstall the application"
}

# Main script logic
main() {
    case "${1:-deploy}" in
        "deploy")
            check_kubectl
            check_helm
            check_cluster
            create_namespace
            deploy_chart
            show_status
            ;;
        "status")
            check_kubectl
            show_status
            ;;
        "logs")
            check_kubectl
            show_logs "$2"
            ;;
        "uninstall")
            check_kubectl
            check_helm
            uninstall_chart
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 