FROM python:3.11-slim

WORKDIR /app

# Step 1: Install torch CPU-only FIRST (prevents FlagEmbedding from pulling GPU torch ~1.1 GB)
RUN pip install --no-cache-dir \
    torch==2.5.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Step 2: Install FlagEmbedding without its deps (torch already installed above)
RUN pip install --no-cache-dir --no-deps FlagEmbedding==1.2.11

# Step 3: Install FlagEmbedding's remaining deps from PyPI (excludes torch)
RUN pip install --no-cache-dir \
    "transformers>=4.36.0" \
    datasets \
    peft

# Step 4: Install rest of project requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
