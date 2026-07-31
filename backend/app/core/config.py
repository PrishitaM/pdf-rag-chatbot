from pydantic_settings import BaseSettings
from typing import List
class Settings(BaseSettings):
    # SQL Server
    SQL_SERVER: str = "localhost"
    SQL_DATABASE: str = "rag_chatbot"
    SQL_USERNAME: str = "sa"
    SQL_PASSWORD: str = ""
    SQL_DRIVER: str = "ODBC Driver 17 for SQL Server"

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    LLM_NUM_PREDICT: int = 512
    LLM_NUM_CTX: int = 2048
    LLM_TEMPERATURE: float = 0.1
    # ChromaDB
    CHROMA_DB_PATH: str = "./chroma_db"
    # Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def sqlalchemy_url(self) -> str:
        return (
            f"mssql+pyodbc://@{self.SQL_SERVER}/{self.SQL_DATABASE}"
            f"?driver={self.SQL_DRIVER.replace(' ', '+')}"
            f"&trusted_connection=yes"
            f"&TrustServerCertificate=yes"
        )

    class Config:
        env_file = ".env"


settings = Settings()
