# CerberDoc Frontend

Frontend application for document completeness analysis system using OCR and formal validation.

## Stack

- React 19 + TypeScript — UI & type safety  
- Vite — fast build tool & dev server  
- Tailwind CSS — styling  
- shadcn/ui (Radix) — UI components  
- i18next — internationalization (PL / EN)  
- REST API — communication with backend  

---

## Quick Start

### 1. Prerequisites

- Node.js 24
- npm / pnpm / yarn
- Git

---

### 2. Clone & configure

```bash
git clone <repo-url> && cd frontend
```

---

### 3. Install dependencies

```bash
npm install
```

---

### 4. Start development server

```bash
npm run dev
```

Application will be available at:

http://localhost:5173

---

## Available Scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run preview    # preview build locally
npm run lint       # run linter
```

---

## Project Structure

```text
src/
├── components/
│   ├── layout/        # layout components (header, wrapper)
│   └── ui/            # shadcn/ui components
├── features/          # domain features (e.g. document upload)
├── pages/             # application views (Home, Upload, Results)
├── api/               # API communication layer
├── lib/               # utilities & helpers
├── locales/           # translations (PL / EN)
├── types/             # TypeScript types
├── context/           # Auth context
```

---

## Features (MVP)

- Upload documents (PDF / JPG / PNG)
- Display OCR results
- Basic document analysis
- Generate analysis report
- Prepare for validation rules system
- Multi-language support (PL / EN)

---

## API Integration

Frontend communicates with backend via REST API.

Example endpoints:

- POST /upload — upload document
- GET /result — get analysis result

---

## Git Workflow

Pracujemy w modelu: **`main` = tylko stabilny kod**. Każda zmiana idzie przez osobny branch i Pull Request.

### 1. Zaktualizuj main lokalnie

Zanim zaczniesz nową funkcję:

```bash
git checkout main
git pull origin main
```

### 2. Stwórz branch od main

Wzór nazwy: `typ/jira_task/opis-zadania`

| Typ       | Przykład                    |
| --------- | --------------------------- |
| `feature` | `feature/PP-1/auth-ui`      |
| `fix`     | `fix/PP-3/login-validation` |
| `chore`   | `chore/PP-4/setup-i18n`     |

```bash
git checkout -b feature/PP-1/auth-ui
```

### 3. Commituj zmiany

Commity zgodne z **Conventional Commits**. Wzór: `typ:JIRA_TASK: opis`

```bash
git add .
git commit -m "feat:PP-1: add language switch"
```

Dostępne typy: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`

### 4. Wypchnij branch na GitHuba

```bash
git push -u origin feature/PP-1/auth-ui
```

### 5. Otwórz Pull Request

Na GitHubie otwórz PR z brancha do `main`. PR wymaga review przed mergem.

## Environment Variables

Project uses Vite environment variables.

### Rules

- All variables must start with `VITE_`
- Do not store secrets in frontend
- `.env` file is local only
- `.env.example` is committed

---

### Example `.env.example`

```env
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
```

---

### Usage in code

```ts
const API_URL = import.meta.env.VITE_API_URL;
```

---

## Development Notes

- UI components are based on shadcn/ui
- Project follows modular structure (features/)
- API layer is separated (api/)
- Ready for integration with backend (FastAPI)

----
