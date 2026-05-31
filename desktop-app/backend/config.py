"""
Configuración centralizada del Sistema POS
Carga variables de entorno desde .env
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Config:
    """Configuración base de la aplicación"""
    
    # ===== BASE DE DATOS =====
    DATABASE_URL = os.getenv(
        'DATABASE_URL',
        'postgresql://localhost/posdb'  # Fallback (nunca se usará si .env existe)
    )
    
    # ===== FLASK =====
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-not-secure')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    ENV = os.getenv('FLASK_ENV', 'production')
    
    # ===== JWT (Para autenticación - FASE 3) =====
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-key')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '3600'))
    
    # ===== POOL DE CONEXIONES =====
    DB_POOL_MIN_CONN = int(os.getenv('DB_POOL_MIN_CONN', '1'))
    DB_POOL_MAX_CONN = int(os.getenv('DB_POOL_MAX_CONN', '10'))
    
    # ===== API (Para frontend - FASE 4) =====
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000')
    
    @staticmethod
    def validate():
        """Valida que las variables críticas estén configuradas"""
        if 'localhost' in Config.DATABASE_URL:
            print("⚠️  ADVERTENCIA: Usando base de datos local (no Neon.tech)")
        
        if Config.SECRET_KEY == 'dev-key-not-secure':
            print("⚠️  ADVERTENCIA: SECRET_KEY no configurada en .env")
        
        return True

# Validar configuración al importar
Config.validate()