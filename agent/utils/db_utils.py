import logging
import asyncio
import traceback
import os
from typing import Any, Callable, TypeVar
from contextlib import asynccontextmanager

from prisma import Prisma
from prisma.errors import PrismaError
from dotenv import load_dotenv


load_dotenv(dotenv_path=".env.local")

logger = logging.getLogger(__name__)

T = TypeVar('T')

_prisma_client = None
_connection_lock = asyncio.Lock()

async def get_prisma_client() -> Prisma:
    """
    Get or create a Prisma client instance with connection pooling.
    
    Returns:
        A connected Prisma client instance
    """
    global _prisma_client
    
    async with _connection_lock:
        if _prisma_client is None:
            logger.info("Initializing Prisma client")
            _prisma_client = Prisma()
            try:
                await _prisma_client.connect()
                logger.info("Successfully connected to database")
            except Exception as e:
                logger.error(f"Failed to connect to database: {str(e)}")
                _prisma_client = None
                raise
        
        return _prisma_client

async def close_prisma_client() -> None:
    """Close the Prisma client connection if it exists."""
    global _prisma_client
    
    async with _connection_lock:
        if _prisma_client is not None:
            try:
                logger.info("Disconnecting Prisma client")
                await _prisma_client.disconnect()
                logger.info("Successfully disconnected from database")
            except Exception as e:
                logger.error(f"Error disconnecting from database: {str(e)}")
            finally:
                _prisma_client = None

@asynccontextmanager
async def get_db():
    """Context manager for database operations."""
    client = await get_prisma_client()
    try:
        yield client
    except Exception as e:
        logger.error(f"Database operation failed: {str(e)}")
        raise

async def execute_db_operation(operation: Callable, *args: Any, **kwargs: Any) -> T:
    """
    Execute a database operation with error handling and retries.
    
    Args:
        operation: The async function to execute
        *args: Positional arguments to pass to the operation
        **kwargs: Keyword arguments to pass to the operation
        
    Returns:
        The result of the operation
        
    Raises:
        Exception: If the operation fails after retries
    """
    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            async with get_db() as client:
                result = await operation(client, *args, **kwargs)
                return result
        except PrismaError as e:
            if attempt == max_retries - 1:
                error_message = f"Database operation failed after {max_retries} attempts: {str(e)}"
                logger.error(error_message)
                logger.error(traceback.format_exc())
                raise Exception(error_message) from e
            logger.warning(f"Database operation failed, attempt {attempt + 1}/{max_retries}: {str(e)}")
            await asyncio.sleep(retry_delay * (attempt + 1))  # Exponential backoff
        except Exception as e:
            error_message = f"Unexpected error during database operation: {str(e)}"
            logger.error(error_message)
            logger.error(traceback.format_exc())
            raise

# Functions needed for seed_responders.py compatibility
async def connect_db() -> Prisma:
    """
    Connect to the database and return the Prisma client.
    This is an alias for get_prisma_client for backwards compatibility.
    
    Returns:
        A connected Prisma client instance
    """
    return await get_prisma_client()

async def disconnect_db() -> None:
    """
    Disconnect from the database.
    This is an alias for close_prisma_client for backwards compatibility.
    """
    await close_prisma_client() 