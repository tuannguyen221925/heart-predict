from mysql.connector.pooling import MySQLConnectionPool


class AppState:
    def __init__(self):
        self.model         = None
        self.scaler        = None
        self.feature_names = None
        self.db_pool: MySQLConnectionPool = None
        self.groq_ready: bool = False

state = AppState()