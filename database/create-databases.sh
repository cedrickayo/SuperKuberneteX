#!/bin/bash
set -e

# Script de creation des bases de donnees PostgreSQL
# Execute au demarrage du container PostgreSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE superkube;
    CREATE DATABASE instance1_db;
    CREATE DATABASE instance2_db;
    CREATE DATABASE instance3_db;
    
    GRANT ALL PRIVILEGES ON DATABASE superkube TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE instance1_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE instance2_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE instance3_db TO $POSTGRES_USER;
EOSQL

echo "Databases created successfully"

