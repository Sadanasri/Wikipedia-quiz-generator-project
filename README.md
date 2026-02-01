# Wikipedia Quiz Generator

A professional full-stack application that generates interactive quizzes from Wikipedia articles using **FastAPI**, **React**, and **Google Gemini AI**.

---

## 🚀 Key Features

### **Core Functionality**
- **Generate Quiz**: Scrapes Wikipedia content and generates 5-10 high-quality questions.
- **Past Quizzes**: A persistent history of all processed articles stored in PostgreSQL.
- **Details Modal**: Re-displays any previous quiz in a structured view.

### **Bonus Features (Implemented)**
- ✅ **“Take Quiz” Mode**: Interactive answering with instant scoring and explanations.
- ✅ **Try Again**: Reset your answers and retake a quiz instantly.
- ✅ **URL Preview**: Debounced auto-fetch that shows article title/summary before generation.
- ✅ **Raw HTML Storage**: Stores original article HTML in the database for reference.
- ✅ **Intelligent Caching**: Skips re-scraping and AI calls if a URL has already been processed.
- ✅ **Section-wise Grouping**: Questions are visually categorized by their Wikipedia section headers.

---

## 🛠️ Tech Stack
- **Backend**: Python FastAPI, SQLAlchemy, BeautifulSoup4, Google Gemini API.
- **Database**: PostgreSQL (Relational persistence).
- **Frontend**: React (Vite), CSS3 (Modern Glassmorphism), Lucide-Icons.

---

## 📖 Setup Instructions

### 1. Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. Activate venv: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. `pip install -r requirements.txt`
5. Create `.env` with:
   ```env
   GOOGLE_API_KEY=your_key
   DATABASE_URL=postgresql://postgres:admin123@127.0.0.1:5432/wiki_quiz
   ```
6. Run server: `uvicorn main:app --reload`

### 2. Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## 🔗 API Endpoints

- `GET /preview-article?url=<URL>`: Fast preview of title/summary.
- `POST /generate-quiz?url=<URL>`: Full scrape, AI generation, and DB storage.
- `GET /quizzes`: List all historical quiz articles.
- `GET /quiz/{article_id}`: Get full details (questions/topics) for a specific ID.

---

## 🤖 AI Prompt Template
The system uses the following prompt for the **Gemini 1.5 Flash** model via LangChain logic:

```text
You are a professional quiz generator. Based on the following article about "{article_title}", generate a quiz.

Requirements:
1. Generate 5-10 questions.
2. Each question must have 4 options (A, B, C, D).
3. Identify the correct answer (exact string match).
4. Provide a short explanation grounded in the text.
5. Assign a difficulty level (easy, medium, hard).
6. Specify the "section" header the question was derived from.
7. Suggest 3-5 related Wikipedia topics.

Return response as VALID JSON.
```

---

## 📂 Sample Data
- Representative outputs can be found in the `sample_data/` directory.
- `social_media_output.json`: A full API response example.

