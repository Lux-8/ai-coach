"""
AI-репетитор для подготовки к ВПР и олимпиадам.
FastAPI backend + Groq API (бесплатно, без карты, без возрастных ограничений).

Запуск:
    1. Зарегистрируйся на console.groq.com (email или Google-аккаунт)
    2. Создай ключ на console.groq.com/keys
    3. Скопируй .env.example в .env и впиши GROQ_API_KEY
    4. pip install -r requirements.txt
    5. uvicorn app:app --reload
    6. Открой http://127.0.0.1:8000
"""

import os
import logging
from typing import Literal

import requests
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from prompts import get_system_prompt

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-coach")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

if not GROQ_API_KEY:
    logger.warning(
        "GROQ_API_KEY не задан! Зарегистрируйся на console.groq.com, создай ключ "
        "на console.groq.com/keys и впиши его в .env (см. .env.example)."
    )

app = FastAPI(title="AI-репетитор: ВПР и Олимпиады")


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    text: str


class ChatRequest(BaseModel):
    subject: str
    exam_type: Literal["ВПР", "Олимпиада"]
    grade: int = Field(ge=4, le=11)
    history: list[ChatMessage] = []
    # Если это первый запрос в диалоге — history пустая, а модель сама
    # генерирует приветствие и первое задание.


def call_groq(system_prompt: str, history: list[ChatMessage]) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY не настроен на сервере. Смотри .env.example.",
        )

    # Groq — OpenAI-совместимый формат: роли "system"/"user"/"assistant"
    messages = [{"role": "system", "content": system_prompt}]
    if not history:
        messages.append({"role": "user", "content": "Начнём урок. Дай первое задание."})
    else:
        for m in history:
            role = "assistant" if m.role == "model" else "user"
            messages.append({"role": role, "content": m.text})

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000,
    }

    try:
        resp = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except requests.exceptions.HTTPError as e:
        logger.error("Groq API error: %s | %s", e, resp.text)
        raise HTTPException(status_code=502, detail=f"Ошибка Groq API: {resp.text[:300]}")
    except (KeyError, IndexError) as e:
        logger.error("Unexpected Groq response shape: %s", e)
        raise HTTPException(status_code=502, detail="Неожиданный формат ответа от Groq.")
    except requests.exceptions.RequestException as e:
        logger.error("Network error calling Groq: %s", e)
        raise HTTPException(status_code=502, detail="Не удалось связаться с Groq API.")


@app.post("/api/chat")
def chat(req: ChatRequest):
    system_prompt = get_system_prompt(req.subject, req.exam_type, req.grade)
    reply = call_groq(system_prompt, req.history)
    return {"reply": reply}


@app.get("/api/health")
def health():
    return {"ok": True, "model": GROQ_MODEL, "key_configured": bool(GROQ_API_KEY)}


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    return FileResponse("static/index.html")
