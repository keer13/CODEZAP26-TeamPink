import os
import requests
import logging
from typing import Optional

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # We assume dotenv is loaded in the main server.py
        self.ai_url = os.getenv("AI_URL", "https://partners-defend-highest-minute.trycloudflare.com/generate")
        self.api_key = os.getenv("AI_API_KEY", "medixo-ai-engine-2026")
        
    def generate_response(self, prompt: str) -> Optional[str]:
        """
        Sends a prompt to the JarvisLabs AI Engine and returns the text response.
        Handles connection errors, timeouts, and invalid HTTP statuses.
        """
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key
        }
        
        payload = {
            "prompt": prompt
        }
        
        try:
            logger.info(f"Sending request to AI Engine at {self.ai_url}")
            response = requests.post(
                self.ai_url,
                json=payload,
                headers=headers,
                timeout=30 # 30 seconds timeout
            )
            
            # Raise an exception for HTTP errors (4xx, 5xx)
            response.raise_for_status()
            
            # Assuming the AI engine returns JSON with a 'response' or 'text' field, 
            # or maybe just plain text. Let's try to parse JSON first.
            try:
                data = response.json()
                # Extract text based on common RAG/Ollama response formats
                # Adjust this if the actual JarvisLabs engine uses a specific key
                if isinstance(data, dict):
                    return data.get("response", data.get("text", str(data)))
                return str(data)
            except requests.exceptions.JSONDecodeError:
                # If it's not JSON, return the raw text
                return response.text
                
        except requests.exceptions.Timeout:
            logger.error("AI Engine request timed out.")
            return "Error: AI Engine is taking too long to respond. Please try again later."
            
        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to the AI Engine.")
            return "Error: Could not connect to the AI Engine. Please check your connection."
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"AI Engine returned an HTTP error: {e}")
            return f"Error: AI Engine returned status code {response.status_code}."
            
        except Exception as e:
            logger.error(f"An unexpected error occurred while calling the AI Engine: {e}")
            return "Error: An unexpected error occurred while communicating with the AI Engine."

# Create a singleton instance to be used across the application
ai_service = AIService()
