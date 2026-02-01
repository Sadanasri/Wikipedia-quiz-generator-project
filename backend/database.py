from sqlalchemy import create_engine, Column, Integer, String, Text, JSON, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables with absolute path
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# Database URL - Default to PostgreSQL
# Use SQLite for testing if PG is not configured
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@127.0.0.1:5432/wiki_quiz")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class WikiArticle(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(String)
    summary = Column(Text)
    sections = Column(JSON)
    key_entities = Column(JSON)
    raw_html = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    quizzes = relationship("Quiz", back_populates="article")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"))
    related_topics = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    article = relationship("WikiArticle", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(Text)
    options = Column(JSON) # ["A", "B", "C", "D"]
    answer = Column(String)
    explanation = Column(Text)
    difficulty = Column(String)
    section = Column(String) # For grouping

    quiz = relationship("Quiz", back_populates="questions")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
