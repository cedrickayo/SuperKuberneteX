#!/bin/bash
set -e # Arret du script à la premiere error detecté

#Chargement des variables d'environnement
set -a          # export auto
#source .env     # charge .env
set +a          # stop export auto


#clone du projet
rm -rf SuperKuberneteX
git clone 'https://github.com/cedrickayo/SuperKuberneteX.git'
cd SuperKuberneteX

# Build Docker Images
echo "Starting step build images..."
docker-compose -f docker-compose.yml build --no-cache # on se rassure que l'image est reconstruite si une modification est faite


# Push vers Docker Hub
echo "Starting pushing images to registry"
docker-compose push
echo "push reussi"

# Deployment du backend
echo " Deployment of postgres DB + PV "
kubectl apply -k ./k8s/database/

# Deploy all app + instances
echo " Deploy Application in application layer " 
kubectl apply -k ./k8s/frontend/ # Deployment du frontend va utiliser le fichier kustomization 

echo " Deploy Payment in application layer " 
kubectl apply -k ./k8s/payment/ # Deployment de payment

echo " Deploy Application in instance layer " 
kubectl apply -k ./k8s/instance/ # Deployment de instance

# Deploy  Ingress + SSL
echo " Configure Ingress + SSL " 
kubectl apply -f ./k8s/superkubernetes-ingress-nginx.yaml


# Install Promeheus + Grafana
echo " Installation de Grafana et prometheus "

# Créer le namespace s'il n'existe pas
kubectl get namespace monitoring || kubectl create namespace monitoring

# Ajouter repo Helm si pas déjà présent
helm repo list | grep prometheus-community || helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Mettre à jour repo
helm repo update

# Installer ou upgrade (important pour relancer script sans erreur)
helm upgrade --install prometheus-operator prometheus-community/kube-prometheus-stack \
  --namespace monitoring

echo " Prometheus + Grafana installés avec succès "









