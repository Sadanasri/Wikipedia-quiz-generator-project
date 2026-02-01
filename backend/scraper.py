import requests
from bs4 import BeautifulSoup
import re

def scrape_wikipedia(url):
    """
    Scrapes a Wikipedia article and returns a structured dictionary of content.
    """
    print(f"Scraper: Fetching URL: {url}")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        print("Scraper: Successfully fetched HTML.")
    except Exception as e:
        print(f"Scraper: Error fetching URL: {e}")
        return None

    soup = BeautifulSoup(response.content, 'html.parser')

    # Extract Title
    title = soup.find('h1', id='firstHeading').text.strip()

    # Extract Summary (usually the first few paragraphs before the first heading)
    content_div = soup.find('div', id='mw-content-text').find('div', class_='mw-parser-output')
    
    summary = ""
    paragraphs = content_div.find_all('p', recursive=False)
    for p in paragraphs:
        if p.text.strip():
            summary = p.text.strip()
            # Clean up citations like [1], [2], etc.
            summary = re.sub(r'\[\d+\]', '', summary)
            break

    # Extract Sections
    sections = []
    headers = content_div.find_all(['h2', 'h3'], recursive=False)
    for header in headers:
        text = header.find('span', class_='mw-headline')
        if text:
            sections.append(text.text.strip())

    # Extract Full Text for LLM
    full_text = ""
    for element in content_div.find_all(['p', 'h2', 'h3'], recursive=False):
        text = element.text.strip()
        text = re.sub(r'\[\d+\]', '', text)
        if text:
            full_text += text + "\n\n"

    # Simple Entity Extraction (Mocked or basic regex/heuristic for now)
    # Wikipedia often has links for important entities.
    entities = {
        "people": [],
        "organizations": [],
        "locations": []
    }
    
    # Heuristic: Look for links in the summary or intro
    links = content_div.find_all('a', href=re.compile(r'^/wiki/'), limit=15)
    for link in links:
        entity_name = link.text.strip()
        if entity_name and entity_name not in entities["people"] and not entity_name.startswith('['):
            # Very basic categorization for now
            entities["people"].append(entity_name)

    return {
        "url": url,
        "title": title,
        "summary": summary,
        "sections": sections,
        "full_text": full_text[:10000], # Limit text for LLM token limits
        "key_entities": entities,
        "raw_html": str(response.content)
    }

if __name__ == "__main__":
    # Test scraping
    test_url = "https://en.wikipedia.org/wiki/Alan_Turing"
    data = scrape_wikipedia(test_url)
    if data:
        print(f"Title: {data['title']}")
        print(f"Summary: {data['summary'][:100]}...")
        print(f"Sections: {data['sections'][:5]}")
        print(f"Entities: {data['key_entities']['people'][:5]}")
