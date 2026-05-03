# InventoryRFID

Projeto organizado em duas partes:

- `backend/`: API Django e banco SQLite local.
- `frontend/`: interface Next.js.

## Executar o backend

```powershell
cd backend
python manage.py runserver
```

A API fica em `http://127.0.0.1:8000`.

## Executar o frontend

Em outro terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

A interface fica em `http://localhost:3000`.
