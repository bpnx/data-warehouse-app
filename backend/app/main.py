"""Main FastAPI application for Data Warehouse."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi

from .config import settings
from .database import init_db
from .routers import tables, queries

# Create FastAPI app
app = FastAPI(
    title="Data Warehouse API",
    description="API for PostgreSQL Data Warehouse with Query Builder",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tables.router)
app.include_router(queries.router)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    """Initialize database tables on application startup."""
    init_db()


# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Data Warehouse API",
        version="1.0.0",
        description="API for PostgreSQL Data Warehouse with Query Builder",
        routes=app.routes,
    )
    
    openapi_schema["info"]["x-logo"] = {
        "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/api/")
async def api_info():
    """API information."""
    return {
        "name": "Data Warehouse API",
        "version": "1.0.0",
        "description": "PostgreSQL Data Warehouse with Query Builder",
        "docs": "/api/docs",
        "endpoints": {
            "tables": {
                "list": "GET /api/tables/",
                "get": "GET /api/tables/{table_name}",
                "columns": "GET /api/tables/{table_name}/columns",
                "data": "GET /api/tables/{table_name}/data",
                "metadata": "GET /api/tables/all-metadata"
            },
            "queries": {
                "execute": "POST /api/queries/execute",
                "build": "POST /api/queries/build",
                "saved_list": "GET /api/queries/saved",
                "saved_create": "POST /api/queries/saved",
                "saved_get": "GET /api/queries/saved/{query_id}",
                "saved_execute": "POST /api/queries/saved/{query_id}/execute",
                "saved_delete": "DELETE /api/queries/saved/{query_id}"
            }
        }
    }
