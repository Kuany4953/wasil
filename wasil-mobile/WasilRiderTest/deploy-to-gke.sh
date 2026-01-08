#!/bin/bash
# ================================================
# Wasil Rider Web App - Deploy to GKE
# ================================================

set -e

# Configuration - UPDATE THESE VALUES
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
CLUSTER_NAME="${GKE_CLUSTER:-wasil-cluster}"
ZONE="${GKE_ZONE:-us-central1-a}"
IMAGE_NAME="wasil-rider-web"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} Wasil Rider Web - GKE Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check required tools
check_tools() {
    echo -e "\n${YELLOW}📋 Checking required tools...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Install from: https://docker.com${NC}"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl not found. Install with: gcloud components install kubectl${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All required tools are installed${NC}"
}

# Authenticate with GCP
authenticate() {
    echo -e "\n${YELLOW}🔐 Authenticating with GCP...${NC}"
    
    # Check if already logged in
    if ! gcloud auth print-access-token &> /dev/null; then
        gcloud auth login
    fi
    
    gcloud config set project $PROJECT_ID
    echo -e "${GREEN}✅ Authenticated to project: $PROJECT_ID${NC}"
}

# Configure Docker for GCR
configure_docker() {
    echo -e "\n${YELLOW}🐳 Configuring Docker for GCR...${NC}"
    gcloud auth configure-docker gcr.io --quiet
    echo -e "${GREEN}✅ Docker configured for GCR${NC}"
}

# Build Docker image
build_image() {
    echo -e "\n${YELLOW}📦 Building Docker image...${NC}"
    docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG .
    echo -e "${GREEN}✅ Image built: gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG${NC}"
}

# Push to GCR
push_image() {
    echo -e "\n${YELLOW}⬆️  Pushing image to GCR...${NC}"
    docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG
    echo -e "${GREEN}✅ Image pushed to GCR${NC}"
}

# Create GKE cluster (if needed)
create_cluster() {
    echo -e "\n${YELLOW}☸️  Checking GKE cluster...${NC}"
    
    if gcloud container clusters describe $CLUSTER_NAME --zone=$ZONE &> /dev/null; then
        echo -e "${GREEN}✅ Cluster $CLUSTER_NAME already exists${NC}"
    else
        echo -e "${YELLOW}Creating GKE cluster: $CLUSTER_NAME${NC}"
        gcloud container clusters create $CLUSTER_NAME \
            --zone=$ZONE \
            --num-nodes=2 \
            --machine-type=e2-small \
            --enable-autoscaling \
            --min-nodes=1 \
            --max-nodes=5 \
            --disk-size=20GB
        echo -e "${GREEN}✅ Cluster created${NC}"
    fi
    
    # Get credentials
    gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE
    echo -e "${GREEN}✅ kubectl configured for cluster${NC}"
}

# Update deployment YAML with project ID
update_deployment() {
    echo -e "\n${YELLOW}📝 Updating deployment configuration...${NC}"
    
    # Create temp deployment file with actual project ID
    sed "s/YOUR_PROJECT_ID/$PROJECT_ID/g" k8s/deployment.yaml > k8s/deployment-gke.yaml
    echo -e "${GREEN}✅ Deployment YAML updated${NC}"
}

# Deploy to GKE
deploy() {
    echo -e "\n${YELLOW}🚀 Deploying to GKE...${NC}"
    kubectl apply -f k8s/deployment-gke.yaml
    echo -e "${GREEN}✅ Deployment applied${NC}"
}

# Wait for deployment and get URL
get_url() {
    echo -e "\n${YELLOW}⏳ Waiting for external IP...${NC}"
    
    # Wait for LoadBalancer IP
    for i in {1..30}; do
        EXTERNAL_IP=$(kubectl get service wasil-rider-web-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
        
        if [ -n "$EXTERNAL_IP" ]; then
            echo -e "\n${GREEN}========================================${NC}"
            echo -e "${GREEN}🎉 Deployment Complete!${NC}"
            echo -e "${GREEN}========================================${NC}"
            echo -e "\n${GREEN}Your Wasil app is live at:${NC}"
            echo -e "${YELLOW}   http://$EXTERNAL_IP${NC}"
            echo -e "\n${GREEN}Cluster: $CLUSTER_NAME${NC}"
            echo -e "${GREEN}Project: $PROJECT_ID${NC}"
            return 0
        fi
        
        echo "Waiting for external IP... ($i/30)"
        sleep 10
    done
    
    echo -e "${YELLOW}⚠️  External IP not ready yet. Check with:${NC}"
    echo "   kubectl get service wasil-rider-web-service"
}

# Main deployment flow
main() {
    check_tools
    authenticate
    configure_docker
    build_image
    push_image
    create_cluster
    update_deployment
    deploy
    get_url
}

# Show help
show_help() {
    echo "Usage: ./deploy-to-gke.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --project-id ID    Set GCP project ID"
    echo "  --cluster NAME     Set GKE cluster name"
    echo "  --zone ZONE        Set GKE zone"
    echo "  --build-only       Only build and push image"
    echo "  --deploy-only      Only deploy (skip build)"
    echo "  --help             Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  GCP_PROJECT_ID     GCP project ID"
    echo "  GKE_CLUSTER        GKE cluster name"
    echo "  GKE_ZONE           GKE zone"
    echo ""
    echo "Example:"
    echo "  export GCP_PROJECT_ID=my-project"
    echo "  ./deploy-to-gke.sh"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        --cluster)
            CLUSTER_NAME="$2"
            shift 2
            ;;
        --zone)
            ZONE="$2"
            shift 2
            ;;
        --build-only)
            check_tools
            authenticate
            configure_docker
            build_image
            push_image
            exit 0
            ;;
        --deploy-only)
            check_tools
            authenticate
            create_cluster
            update_deployment
            deploy
            get_url
            exit 0
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main
main
