# Question Bank Ingestion Tool

This tool ingests interview questions from multiple sources and upserts them into MongoDB collection `company_question_bank`.

## What it supports

- GitHub repository scraping (clone + parse markdown)
- GitHub repository scraping (clone + parse company `all.csv` files)
- Generic web page scraping (extract list items / paragraphs that look like questions)
- Manual JSON source files (great for behavioral and system design curation)

## Quick start

1. Set env vars:

- `MONGODB_URI` (required)
- `QUESTION_BANK_DB` (optional, defaults to DB in URI)
- `QUESTION_BANK_COLLECTION` (optional, defaults to `company_question_bank`)

2. Run ingest:

```bash
npm run question-bank:ingest
```

## Source config

Edit `tools/question-bank-ingest/sources.json`.

Each source has one of these types:

- `github-repo-markdown`
- `github-repo-csv`
- `web-pages`
- `manual-json`

For `github-repo-csv`, use:

- `repoUrl`
- `csvFileName` (defaults to `all.csv`)
- `category`
- `defaultDifficulty`

## Notes

- Upsert key: `companyNormalized + category + question`
- Avoids duplicate inserts.
- You can run this repeatedly as sources grow.
