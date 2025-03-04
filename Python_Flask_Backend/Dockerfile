# Python alap image
FROM python:3.10

# Szükséges csomagok telepítése (OpenCV-hez szükséges libGL és egyéb függőségek)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Mappa beállítása
WORKDIR /app

# Követelmények telepítése
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Kód másolása
COPY . .

# Port és indítás
EXPOSE 5000
CMD ["python", "main.py"]
