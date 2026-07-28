import redis
import ssl
from urllib.parse import urlparse

url = "rediss://localhost:6379/0?ssl_cert_reqs=none"
pool = redis.ConnectionPool.from_url(url)
print(pool.connection_kwargs)
