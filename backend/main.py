from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, init_db, WikiArticle, Quiz, Question
from scraper import scrape_wikipedia
from generator import generate_quiz
import uvicorn

app = FastAPI(title="Wikipedia Quiz Generator API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/preview-article")
async def preview_article(url: str):
    """
    Fast endpoint to fetch just the title and summary for a preview.
    """
    print(f"Preview Request for: {url}")
    data = scrape_wikipedia(url)
    if not data:
        raise HTTPException(status_code=400, detail="Could not preview article. Check the URL.")
    
    return {
        "title": data["title"],
        "summary": data["summary"]
    }

@app.post("/generate-quiz")
async def create_quiz(url: str, db: Session = Depends(get_db)):
    print(f"\n--- New Quiz Request for URL: {url} ---")
    
    # Check if article already exists
    article_to_use = None
    try:
        print("Checking database for existing article...")
        existing_article = db.query(WikiArticle).filter(WikiArticle.url == url).first()
        
        if existing_article:
            print(f"Article found in DB: ID {existing_article.id}")
            article_to_use = existing_article
            
            # Check if it has a quiz with questions
            existing_quiz = db.query(Quiz).filter(Quiz.article_id == existing_article.id).order_by(Quiz.created_at.desc()).first()
            if existing_quiz:
                questions = db.query(Question).filter(Question.quiz_id == existing_quiz.id).all()
                if len(questions) > 0:
                    print(f"Existing quiz with {len(questions)} questions found. Returning cached data.")
                    return {
                        "id": existing_article.id,
                        "url": existing_article.url,
                        "title": existing_article.title,
                        "summary": existing_article.summary,
                        "key_entities": existing_article.key_entities,
                        "sections": existing_article.sections,
                        "quiz": [
                            {
                                "question": q.question_text,
                                "options": q.options,
                                "answer": q.answer,
                                "difficulty": q.difficulty,
                                "explanation": q.explanation,
                                "section": q.section
                            } for q in questions
                        ],
                        "related_topics": existing_quiz.related_topics
                    }
                else:
                    print("Existing quiz found but it has no questions. Forcing re-generation.")
    except Exception as e:
        print(f"Database query failed: {e}")
        # Safeguard: if tables are somehow missing, init them
        init_db()

    # Scrape Content
    print("Scraping Wikipedia...")
    scraped_data = scrape_wikipedia(url)
    if not scraped_data:
        print("Scraping failed.")
        raise HTTPException(status_code=400, detail="Failed to scrape Wikipedia article.")
    print(f"Scraping successful: {scraped_data['title']}")

    # Save Article (Only if it doesn't exist)
    if not article_to_use:
        print("Saving new article to database...")
        try:
            new_article = WikiArticle(
                url=scraped_data["url"],
                title=scraped_data["title"],
                summary=scraped_data["summary"],
                sections=scraped_data["sections"],
                key_entities=scraped_data["key_entities"],
                raw_html=scraped_data["raw_html"]
            )
            db.add(new_article)
            db.commit()
            db.refresh(new_article)
            article_to_use = new_article
            print(f"Article saved with ID: {article_to_use.id}")
        except Exception as e:
            print(f"Database error while saving article: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error while saving article: {str(e)}")
    else:
        print(f"Using existing article (ID: {article_to_use.id}) for quiz generation.")

    # Generate Quiz
    print("Generating quiz with AI (Gemini)...")
    try:
        # We use the title and full_text from the scraper
        ai_generated = generate_quiz(scraped_data["title"], scraped_data["full_text"])
        if ai_generated and "error" in ai_generated:
            print(f"AI Generation Error: {ai_generated['error']}")
            raise Exception(ai_generated["error"])
        if not ai_generated:
            print("AI generator returned None.")
            raise Exception("AI generator returned None. Check backend logs for details.")
        print("AI generation successful.")
    except Exception as e:
        print(f"AI generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI Quiz Generation failed: {str(e)}")

    # Save Quiz
    print("Saving quiz and questions to database...")
    try:
        new_quiz = Quiz(
            article_id=article_to_use.id,
            related_topics=ai_generated["related_topics"]
        )
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)

        # Save Questions
        question_objs = []
        for q in ai_generated["quiz"]:
            question_objs.append(Question(
                quiz_id=new_quiz.id,
                question_text=q["question"],
                options=q["options"],
                answer=q["answer"],
                difficulty=q["difficulty"],
                explanation=q["explanation"],
                section=q.get("section", "General") # Save section
            ))
        db.add_all(question_objs)
        db.commit()
        print("Quiz and questions saved successfully.")
    except Exception as e:
        print(f"Database error while saving quiz: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error while saving quiz: {str(e)}")

    return {
        "id": article_to_use.id,
        "url": article_to_use.url,
        "title": article_to_use.title,
        "summary": article_to_use.summary,
        "key_entities": article_to_use.key_entities,
        "sections": article_to_use.sections,
        "quiz": ai_generated["quiz"],
        "related_topics": ai_generated["related_topics"]
    }

@app.get("/quizzes")
async def list_quizzes(db: Session = Depends(get_db)):
    try:
        articles = db.query(WikiArticle).order_by(WikiArticle.created_at.desc()).all()
        return articles
    except Exception as e:
        print(f"List quizzes failed: {e}")
        return []

@app.get("/quiz/{article_id}")
async def get_quiz_details(article_id: int, db: Session = Depends(get_db)):
    article = db.query(WikiArticle).filter(WikiArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    quiz = db.query(Quiz).filter(Quiz.article_id == article.id).order_by(Quiz.created_at.desc()).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    
    return {
        "id": article.id,
        "url": article.url,
        "title": article.title,
        "summary": article.summary,
        "key_entities": article.key_entities,
        "sections": article.sections,
        "quiz": [
            {
                "question": q.question_text,
                "options": q.options,
                "answer": q.answer,
                "difficulty": q.difficulty,
                "explanation": q.explanation,
                "section": q.section # Include section
            } for q in questions
        ],
        "related_topics": quiz.related_topics
    }

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
