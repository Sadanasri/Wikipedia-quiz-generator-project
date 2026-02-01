from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import WikiArticle, Quiz, Question
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@127.0.0.1:5432/wiki_quiz")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    print("Listing all articles and their quiz/question counts:")
    articles = db.query(WikiArticle).all()
    for article in articles:
        print(f"\nArticle: {article.title} (ID: {article.id})")
        quizzes = db.query(Quiz).filter(Quiz.article_id == article.id).all()
        print(f"  Quizzes found: {len(quizzes)}")
        for quiz in quizzes:
            questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
            print(f"    Quiz ID: {quiz.id} -> Questions: {len(questions)}")
            for q in questions:
                print(f"      - Question: {q.question_text[:50]}...")
except Exception as e:
    print(f"Error checking DB: {e}")
finally:
    db.close()
