# SuperKuberneteX - Application Source

Application multi-instances fournie a l'equipe Big Data pour le deploiement Kubernetes.

## Structure du projet

```
superkubernetex-app/
├── auth-service/              # Service d'authentification
│   ├── Dockerfile
│   ├── package.json
│   ├── env.example
│   └── src/index.js
│
├── payment-service/           # Service de paiement Stripe
│   ├── Dockerfile
│   ├── package.json
│   ├── env.example
│   └── src/index.js
│
├── instance-service/          # Service instance (template x3)
│   ├── Dockerfile
│   ├── package.json
│   ├── env.example
│   └── src/index.js
│
├── frontend/                  # Application Next.js
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── src/app/
│       ├── page.js            # Page d'accueil
│       ├── login/page.js      # Connexion
│       ├── register/page.js   # Inscription
│       ├── dashboard/page.js  # Tableau de bord
│       ├── pricing/page.js    # Page tarifs
│       ├── instance/[id]/page.js  # Gestion instance
│       └── payment/           # Success/Cancel
│
├── database/
│   ├── create-databases.sh    # Creation des 4 bases
│   └── init.sql               # Schema + donnees test
│
├── docker-compose.yml         # Production
├── docker-compose.dev.yml     # Developpement
└── README.md
```

## Description

Cette application comprend :

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Application Next.js |
| Auth Service | 4000 | API d'authentification JWT |
| Payment Service | 4001 | Integration Stripe |
| Instance 1 | 5001 | Service de gestion de contenu |
| Instance 2 | 5002 | Service de gestion de contenu |
| Instance 3 | 5003 | Service de gestion de contenu |
| PostgreSQL | 5432 | Base de donnees |
| Redis | 6379 | Cache et sessions |

## Prerequis

- Docker et Docker Compose installes
- Node.js 18+ (optionnel, pour le developpement local)

## Demarrage rapide

### Option 1 : Mode production (avec build)

```bash
cd superkubernetex-app
docker-compose up --build
```

### Option 2 : Mode developpement (hot-reload)

```bash
cd superkubernetex-app
docker-compose -f docker-compose.dev.yml up
```

## Acces aux services

| Service | URL locale |
|---------|------------|
| Frontend | http://localhost:3000 |
| Auth API | http://localhost:4000 |
| Payment API | http://localhost:4001 |
| Instance 1 API | http://localhost:5001 |
| Instance 2 API | http://localhost:5002 |
| Instance 3 API | http://localhost:5003 |

## Compte de test

- Email: `test@superkubernetex.com`
- Password: `password123`

Ce compte a acces aux 3 instances.

## Structure des bases de donnees

```
PostgreSQL
├── superkube          # Base principale
│   ├── users          # Utilisateurs
│   ├── plans          # Plans d'abonnement
│   ├── subscriptions  # Abonnements
│   └── refresh_tokens # Tokens de rafraichissement
│
├── instance1_db       # Base Instance 1
│   ├── pages          # Pages de contenu
│   └── assets         # Fichiers uploades
│
├── instance2_db       # Base Instance 2
│   ├── pages
│   └── assets
│
└── instance3_db       # Base Instance 3
    ├── pages
    └── assets
```

## Architecture des services

```
                    ┌─────────────┐
                    │   Frontend  │
                    │  (Next.js)  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    Auth     │   │   Payment   │   │  Instance   │
│   Service   │   │   Service   │   │  Services   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └────────────────┼────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              │   (4 bases)     │
              └─────────────────┘
```

## API Endpoints

### Auth Service (port 4000)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness probe |
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/verify | Verification token |
| POST | /api/auth/logout | Deconnexion |
| GET | /api/auth/profile | Profil utilisateur |

### Payment Service (port 4001)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness probe |
| GET | /api/payment/plans | Liste des plans |
| POST | /api/payment/checkout | Creer une session Stripe |
| POST | /api/payment/webhook | Webhook Stripe |
| GET | /api/payment/subscription | Abonnement actuel |
| POST | /api/payment/cancel | Annuler abonnement |

### Instance Services (ports 5001-5003)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness probe |
| GET | /api/instance/info | Info de l'instance |
| GET | /api/pages | Liste des pages |
| GET | /api/pages/:id | Detail d'une page |
| GET | /api/pages/slug/:slug | Page par slug (public) |
| POST | /api/pages | Creer une page |
| PUT | /api/pages/:id | Modifier une page |
| DELETE | /api/pages/:id | Supprimer une page |
| GET | /api/assets | Liste des assets |
| POST | /api/assets | Upload un asset |
| GET | /api/assets/:id/file | Telecharger un asset |
| DELETE | /api/assets/:id | Supprimer un asset |
| GET | /api/stats | Statistiques |

## Variables d'environnement

### Auth Service
```
PORT=4000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=superkube
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Payment Service
```
PORT=4001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=superkube
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=http://localhost:3000
```

### Instance Service
```
PORT=5001
INSTANCE_NAME=instance1
DB_HOST=postgres
DB_PORT=5432
DB_NAME=instance1_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
UPLOAD_DIR=/app/uploads
```

## Stripe (mode test)

Pour tester les paiements :
1. Creer un compte Stripe (https://stripe.com)
2. Recuperer les cles de test
3. Configurer les variables d'environnement
4. Utiliser les cartes de test Stripe (ex: 4242 4242 4242 4242)

## Exemples de requetes API (curl)

### Inscription
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

### Connexion
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@superkubernetex.com","password":"password123"}'
```

### Creer une page (avec token)
```bash
curl -X POST http://localhost:5001/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"title":"Ma Page","slug":"ma-page","content":"Contenu de la page"}'
```

### Health check
```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:5001/health
```

## Schema detaille des tables

### Base superkube

```sql
-- Table users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table plans
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features TEXT[],
    max_pages INTEGER DEFAULT 10,
    max_assets INTEGER DEFAULT 100
);

-- Table subscriptions
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    plan_id INTEGER REFERENCES plans(id),
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    instance_access TEXT[]  -- ['instance1', 'instance2', 'instance3']
);
```

### Bases instance1_db, instance2_db, instance3_db

```sql
-- Table pages
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table assets
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    mimetype VARCHAR(100),
    size_bytes BIGINT
);
```

## Images Docker a construire

| Image | Contexte | Port expose |
|-------|----------|-------------|
| superkube-frontend | ./frontend | 3000 |
| superkube-auth | ./auth-service | 4000 |
| superkube-payment | ./payment-service | 4001 |
| superkube-instance | ./instance-service | 5001-5003 |

Commandes de build :
```bash
docker build -t superkube-frontend ./frontend
docker build -t superkube-auth ./auth-service
docker build -t superkube-payment ./payment-service
docker build -t superkube-instance ./instance-service
```

## Ressources recommandees (Kubernetes)

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Frontend | 100m | 500m | 128Mi | 512Mi |
| Auth | 100m | 300m | 128Mi | 256Mi |
| Payment | 100m | 300m | 128Mi | 256Mi |
| Instance | 100m | 300m | 128Mi | 256Mi |
| PostgreSQL | 250m | 1000m | 256Mi | 1Gi |
| Redis | 100m | 200m | 64Mi | 128Mi |

## Probes de sante (deja implementees)

Tous les services backend exposent :
- `GET /health` - Liveness probe (le service fonctionne)
- `GET /ready` - Readiness probe (le service peut recevoir du trafic)

Exemple de configuration Kubernetes :
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## MISSION DE L'EQUIPE BIG DATA

Votre mission est de migrer cette architecture Docker Compose vers **Kubernetes**.

### Ce que vous devez livrer :

1. **Manifests Kubernetes**
   - Deployments pour chaque service
   - Services (ClusterIP, NodePort, LoadBalancer)
   - Ingress Controller avec routes
   - ConfigMaps et Secrets
   - StatefulSet pour PostgreSQL
   - PersistentVolumeClaims

2. **Monitoring**
   - Deploiement de Prometheus
   - Deploiement de Grafana
   - Dashboards pour chaque instance
   - Alertes configurees

3. **Securite**
   - Secrets Kubernetes pour les credentials
   - Network Policies (optionnel)
   - TLS/SSL via Ingress

4. **Scalabilite**
   - Horizontal Pod Autoscaler (HPA)
   - Liveness et Readiness probes
   - Rolling updates

5. **Documentation**
   - Diagrammes d'architecture
   - Guide de deploiement
   - Guide de maintenance

### Domaines suggeres

| Service | Domaine |
|---------|---------|
| Frontend | superkubernetex.local |
| Auth | auth.superkubernetex.local |
| Payment | pay.superkubernetex.local |
| Instance 1 | inst1.superkubernetex.local |
| Instance 2 | inst2.superkubernetex.local |
| Instance 3 | inst3.superkubernetex.local |
| Grafana | monitoring.superkubernetex.local |

### Namespaces suggeres

```
superkube-app        # Frontend, Auth, Payment
superkube-instances  # Instance 1, 2, 3
superkube-data       # PostgreSQL, Redis
superkube-monitoring # Prometheus, Grafana, Alertmanager
```

### Metriques a surveiller (Grafana)

1. **Charge CPU par pod/instance**
2. **Memoire utilisee par service**
3. **Nombre de requetes HTTP par seconde**
4. **Temps de reponse moyen (latence)**
5. **Nombre de pods en cours d'execution**
6. **Redemarrages de pods**
7. **Espace disque PostgreSQL**
8. **Connexions actives a la base**

### Alertes recommandees

| Alerte | Condition | Severite |
|--------|-----------|----------|
| HighCPU | CPU > 80% pendant 5min | Warning |
| HighMemory | Memory > 90% | Critical |
| PodCrashLoop | Restarts > 3 en 10min | Critical |
| HighLatency | Latence > 2s | Warning |
| DatabaseDown | PostgreSQL unreachable | Critical |
| DiskSpaceLow | Disk > 85% | Warning |

### Sauvegardes a implementer

- `pg_dump` quotidien des 4 bases via CronJob
- Retention de 7 jours minimum
- Stockage dans un PVC dedie ou export S3

Exemple CronJob :
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"  # Tous les jours a 2h
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command: ["/bin/sh", "-c"]
            args:
              - pg_dump -h postgres -U postgres superkube > /backups/superkube_$(date +%Y%m%d).sql
```

---

## Criteres d'evaluation

1. **Infrastructure fonctionnelle** - Tous les services accessibles
2. **Isolation des donnees** - Chaque instance a sa propre base
3. **Scalabilite** - HPA configure et fonctionnel
4. **Monitoring** - Dashboards Grafana operationnels
5. **Securite** - Secrets Kubernetes, pas de credentials en clair
6. **Documentation** - Guide de deploiement clair et complet
7. **Resilience** - Probes configurees, rolling updates

Bonne chance !
