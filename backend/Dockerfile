FROM python:3.11-slim

WORKDIR /app

# Step 1: Install torch CPU-only FIRST (prevents FlagEmbedding from pulling GPU torch ~1.1 GB)
#   torch >= 2.6 required by transformers for CVE-2025-32434 fix
RUN pip install --no-cache-dir \
    torch==2.6.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Step 2: Install FlagEmbedding without its deps (torch already installed above)
RUN pip install --no-cache-dir --no-deps FlagEmbedding==1.2.11

# Step 3: Install FlagEmbedding's remaining deps from PyPI (excludes torch)
#   - pyarrow<18 keeps numpy 1.x compat (langchain 0.3.x requires numpy<2)
#   - datasets==2.21.0 is compatible with huggingface_hub 0.x
RUN pip install --no-cache-dir \
    "transformers>=4.36.0" \
    "pyarrow>=14,<18" \
    "datasets==2.21.0" \
    "huggingface_hub>=0.25,<1" \
    peft

# Step 4: Install rest of project requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
