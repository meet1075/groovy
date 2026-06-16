# Python SDK — Groq API
# API key loaded from .env
# Run: .venv/bin/python groq_hello.py

from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "user",
            "content": "Say hello and tell me what you can help me with.",
        }
    ],
)

print("Model  :", response.model)
print("Role   :", response.choices[0].message.role)
print("Content:", response.choices[0].message.content)
