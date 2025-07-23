# 🔍 Find Papers Fast

**Find Papers Fast** is a web app that helps researchers, students, and curious minds discover and understand relevant academic papers in seconds — not hours. Whether you're writing a thesis, exploring a new topic, or just trying to make sense of dense PDFs, this tool is built to make your research workflow smoother and faster.

---

## 🚀 Features

- **Smart Paper Search**: Enter a topic or keyword to get relevant research papers from trusted databases.
- **Quick Relevance Summary**: Instantly see if a paper is worth reading with our AI-generated summaries.
- **Simplified PDF Reader**: Read complex papers in plain language, section by section.
- **Figure & Reference Extraction**: View important figures, tables, and references without digging through the PDF.
- **Topic Expansion**: Explore related concepts and follow your curiosity with auto-suggested topics.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Prisma, Python microservices
- **AI Models**: Gemini (for summarization), Grobid (for PDF parsing), PubLayNet (for figure extraction)

---

## 📦 Getting Started

1. Clone the repo:

```bash
git clone https://github.com/yourusername/find-papers-fast.git
cd find-papers-fast
```

2. Install dependencies:

```bash
npm install
```

3. Set up authentication with Clerk:
   - Create a free account at [Clerk.dev](https://clerk.dev)
   - Create a new application in your Clerk dashboard
   - Copy your publishable key and secret key
   - Create a `.env.local` file and add your Clerk keys:

```bash
cp .env.example .env.local
# Edit .env.local with your actual Clerk keys
```

4. Run the development server:

```bash
npm run dev
```

---

## 🔐 Authentication & Search Limits

This app includes built-in search limiting for unauthenticated users:

- **Free users**: 2 searches per session (stored in localStorage)
- **Signed-in users**: Unlimited searches
- **Smooth sign-up flow**: When users hit the limit, they're prompted to sign up via Clerk

The search limiter automatically respects authentication status:

- Signed-in users bypass all search limits
- Only anonymous users are subject to the localStorage-based limiting
