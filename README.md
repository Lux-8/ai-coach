# 📚 AI-Coach

An AI tutor for exam and olympiad prep — generates practice tasks in the real format of Russian school exams (ВПР) and academic olympiads (ВсОШ), reviews answers, and adapts to the subject, grade, and prep type.

**Built solo by [0x8](https://github.com/Lux-8)**

---

## What it does

A chatbot powered by YandexGPT that acts like a personal tutor:

- 🎯 Subject selection (math, Russian, physics, astronomy, chemistry, biology, history)
- 📝 Two modes: **ВПР prep** (grades 4-8) or **olympiad prep** (grades 4-11)
- 💬 Live conversation — a new task follows right after each answer, alternating task types
- 🌱 Encouraging tone — praises effort, explains mistakes gently

## Stack

- **Python** + **Streamlit** — chat interface and logic
- **YandexGPT API** (yandexgpt-lite) — task generation and answer review
- `requests`, `json` — API handling

## Getting Started

```bash
git clone https://github.com/Lux-8/ai-coach.git
cd ai-coach
pip install -r requirements.txt
streamlit run app.py
```

### ⚠️ API Key Setup

Before running, create a `.env` file in the project root:

```
YANDEX_API_KEY=your_key
YANDEX_FOLDER_ID=your_folder_id
```

And add `.env` to `.gitignore` so the key never gets committed.

## How it works

1. You pick a subject, grade, and prep type from the sidebar
2. The system builds a prompt matching the real ВПР/ВсОШ format for that grade
3. YandexGPT generates a task in the style of real exam/olympiad archives
4. After your answer — feedback + the next task of a different type, to keep it varied

## Roadmap

- [ ] Move system prompts into a separate config
- [ ] Save progress across sessions
- [ ] Track weak topics per student
- [ ] Support more subjects/grades

---

*Solo project. A learning tool for exam and olympiad prep.*
