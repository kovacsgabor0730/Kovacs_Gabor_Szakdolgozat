FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Mappa létrehozása a statikus fájloknak
RUN mkdir -p static

# API dokumentáció másolása
COPY api-docs.yaml static/api-docs.yaml

EXPOSE 5000

# Egészségügyi ellenőrzés
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["python", "main.py"]