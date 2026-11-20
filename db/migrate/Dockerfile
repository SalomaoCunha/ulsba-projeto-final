FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir 'psycopg[binary]==3.3.6'
COPY runner.py /app/runner.py
ENTRYPOINT ["python", "/app/runner.py"]
CMD ["migrate"]
