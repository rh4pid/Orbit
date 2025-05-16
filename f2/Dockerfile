# Use official Python 3.10 image
FROM python:3.10-slim

# Install Tesseract-OCR and dependencies
RUN apt-get update && \
    apt-get install -y tesseract-ocr libglib2.0-0 libsm6 libxrender1 libxext6 && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port 10000
EXPOSE 10000

# Run the app with gunicorn on port 10000
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "app:app"]