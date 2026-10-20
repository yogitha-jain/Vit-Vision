"""
VetVision / AnimalCareAI - MongoDB Connection

This module manages the database connection.
It does not perform disease or breed predictions.
"""

import os
from pymongo import MongoClient
from pymongo.errors import PyMongoError


# MongoDB configuration.
# These values can be overridden using environment variables.
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017/"
)

DATABASE_NAME = os.getenv(
    "MONGO_DATABASE",
    "AnimalCareAI"
)

_client = None


def get_client():
    """Create and reuse a MongoDB client."""
    global _client

    if _client is None:
        _client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=3000,
        )

    return _client


def get_database():
    """Return the AnimalCareAI database."""
    return get_client()[DATABASE_NAME]


def get_collection(collection_name):
    """Return a collection from the database."""
    if not collection_name or not collection_name.strip():
        raise ValueError("Collection name cannot be empty.")

    return get_database()[collection_name]


def check_database_connection():
    """Check whether MongoDB is reachable."""
    try:
        get_client().admin.command("ping")
        return {
            "connected": True,
            "database": DATABASE_NAME,
            "message": "MongoDB connection successful.",
        }

    except PyMongoError as error:
        return {
            "connected": False,
            "database": DATABASE_NAME,
            "message": str(error),
        }


def close_database_connection():
    """Close the MongoDB client when the application stops."""
    global _client

    if _client is not None:
        _client.close()
        _client = None