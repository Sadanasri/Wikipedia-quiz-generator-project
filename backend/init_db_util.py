import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

def create_database():
    # Load env for credentials
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@127.0.0.1:5432/wiki_quiz")
    
    # Connection string for 'postgres' default database to create the new one
    conn_str = "host=127.0.0.1 user=postgres password=admin123 dbname=postgres"
    
    try:
        print(f"Connecting to PostgreSQL to check/create 'wiki_quiz' database...")
        conn = psycopg2.connect(conn_str)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        db_name = "wiki_quiz"
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f"CREATE DATABASE {db_name}")
            print(f"Database '{db_name}' created successfully.")
        else:
            print(f"Database '{db_name}' already exists.")
            
        cursor.close()
        conn.close()
        
        # Now use SQLAlchemy to create tables (Force Reset)
        print("--- DATABASE FRESH START ---")
        from database import engine, Base
        
        # Use raw SQL to drop tables with CASCADE to handle dependencies
        print("Dropping all existing tables (with CASCADE) to ensure a clean schema...")
        with engine.connect() as conn:
            # Drop tables in proper order or with CASCADE
            conn.execute(text("DROP TABLE IF EXISTS questions CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS quizzes CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS articles CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS related_topics CASCADE")) # Just in case
            conn.commit()
            
        print("Creating all tables from current models...")
        Base.metadata.create_all(bind=engine)
        print("All tables recreated successfully.")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Please ensure PostgreSQL is running and the 'postgres' user has the password 'admin123'.")

if __name__ == "__main__":
    create_database()
