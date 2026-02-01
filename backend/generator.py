import os
import json
import re
import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv

# Load environment variables with absolute path
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

print(f"Debug: .env path used: {env_path}")
print(f"Debug: API Key present: {'Yes' if os.getenv('GOOGLE_API_KEY') else 'No'}")

# Define Pydantic models for structured output (used for type hints/reference)
class QuestionModel(BaseModel):
    question: str
    options: List[str]
    answer: str
    difficulty: str
    explanation: str
    section: str # New field

class QuizModel(BaseModel):
    quiz: List[QuestionModel]
    related_topics: List[str]

def generate_quiz(article_title: str, article_content: str):
    """
    Generates a quiz and related topics using Gemini LLM (Direct Library).
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("GOOGLE_API_KEY not found in environment variables.")
        return None

    genai.configure(api_key=api_key)
    
    # Use a robust current model
    model = genai.GenerativeModel('gemini-flash-latest')

    prompt = f"""You are a professional quiz generator. Based on the following Wikipedia article content about "{article_title}", generate a quiz.
    
    Requirements:
    1. Generate 5-10 questions.
    2. Each question must have 4 options (A, B, C, D).
    3. Identify the correct answer (MUST be an exact string match to one of the options you provided).
    4. Provide a short explanation grounded in the text.
    5. Assign a difficulty level (easy, medium, hard).
    6. For each question, specify the "section" header from the article it was derived from (e.g. "Early life", "Career", "Legacy").
    7. Suggest 3-5 related Wikipedia topics for further reading.
    
    Article Content:
    {article_content[:15000]}
    
    Return the response as a valid JSON object with the following structure:
    {{
      "quiz": [
        {{
          "question": "question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option C",
          "difficulty": "easy",
          "explanation": "why it is correct",
          "section": "History"
        }}
      ],
      "related_topics": ["Topic 1", "Topic 2"]
    }}
    
    IMPORTANT: The "answer" field MUST exactly match one of the entries in the "options" array.
    Example: If options are ["A. Python", "B. Java"], answer MUST be "A. Python" (not just "A" or "Python").
    
    Return ONLY the JSON object. Do not provide any conversational text.
    """

    try:
        print("Sending request to Gemini (Direct API)...")
        response = model.generate_content(prompt)
        content = response.text
        
        print("--- RAW AI RESPONSE START ---")
        print(content)
        print("--- RAW AI RESPONSE END ---")
        
        # Parse JSON from response
        # Remove potential markdown code blocks
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            content = json_match.group(0)
        
        parsed_data = json.loads(content)
        
        # Basic validation
        if "quiz" not in parsed_data or not parsed_data["quiz"]:
            raise Exception("AI response missing 'quiz' field or is empty.")
            
        print("Successfully generated and parsed quiz.")
        return parsed_data
        
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    # Test generation with dummy content
    test_title = "Alan Turing"
    test_content = "Alan Turing was a British mathematician, computer scientist, logician, cryptanalyst, philosopher, and theoretical biologist. Turing was highly influential in the development of theoretical computer science, providing a formalisation of the concepts of algorithm and computation with the Turing machine, which can be considered a model of a general-purpose computer. Turing is widely considered to be the father of theoretical computer science and artificial intelligence."
    print("Testing AI Quiz Generation...")
    result = generate_quiz(test_title, test_content)
    if result and "error" not in result:
        print("Success! Generated Result:")
        print(json.dumps(result, indent=2))
    else:
        print(f"Failed to generate quiz: {result.get('error') if result else 'Unknown error'}")
