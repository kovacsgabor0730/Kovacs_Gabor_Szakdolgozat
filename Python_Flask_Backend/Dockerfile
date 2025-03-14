FROM python:3.10

# Mappa beállítása
WORKDIR /app

# NVIDIA tároló hozzáadása és frissítés
RUN apt-get update && apt-get install -y software-properties-common \
    && add-apt-repository -y ppa:graphics-drivers/ppa \
    && apt-get update \
    && apt-get install -y \
       libgl1-mesa-glx \
       libglib2.0-0 \
       libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

# Követelmények telepítése
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kód másolása
COPY .. .

# Port és indítás
EXPOSE 5000
CMD ["python", "main.py"]
