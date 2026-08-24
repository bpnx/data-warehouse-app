"""API endpoints for table management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..database import get_db
from ..models import TableMetadata, ColumnMetadata
from ..schemas import TableCreate, TableResponse, ColumnInfo

router = APIRouter(prefix="/api/tables", tags=["tables"])


@router.get("/", response_model=List[TableResponse])
async def list_tables(db: Session = Depends(get_db)):
    """List all available tables."""
    tables = db.query(TableMetadata).filter(TableMetadata.is_active == True).all()
    return tables


@router.post("/", response_model=TableResponse, status_code=status.HTTP_201_CREATED)
async def create_table(table_data: TableCreate, db: Session = Depends(get_db)):
    """Create a new table (placeholder for actual table creation)."""
    # Check if table already exists
    existing = db.query(TableMetadata).filter(TableMetadata.name == table_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Table already exists")
    
    # Create table metadata
    new_table = TableMetadata(
        name=table_data.name,
        description=table_data.description
    )
    db.add(new_table)
    db.commit()
    db.refresh(new_table)
    
    return new_table


@router.get("/{table_name}", response_model=TableResponse)
async def get_table(table_name: str, db: Session = Depends(get_db)):
    """Get table metadata and column information."""
    table = db.query(TableMetadata).filter(TableMetadata.name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table


@router.get("/{table_name}/columns", response_model=List[ColumnInfo])
async def get_table_columns(table_name: str, db: Session = Depends(get_db)):
    """Get column metadata for a specific table."""
    table = db.query(TableMetadata).filter(TableMetadata.name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    return table.columns


@router.get("/{table_name}/data")
async def get_table_data(
    table_name: str,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get data from a table with pagination."""
    # Verify table exists
    table = db.query(TableMetadata).filter(TableMetadata.name == table_name).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    try:
        # Execute raw SQL to get data
        query = text(f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}")
        result = db.execute(query)
        
        # Get column names
        columns = result.keys()
        
        # Convert to list of dicts
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        
        # Get total count
        count_query = text(f"SELECT COUNT(*) as count FROM {table_name}")
        count_result = db.execute(count_query).fetchone()
        total = count_result[0] if count_result else 0
        
        return {
            "data": rows,
            "columns": list(columns),
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying table: {str(e)}")


@router.get("/all-metadata")
async def get_all_tables_metadata(db: Session = Depends(get_db)):
    """Get metadata for all tables in the database (including non-registered)."""
    try:
        inspector = inspect(db.bind)
        schema_names = inspector.get_schema_names()
        
        all_tables = []
        for schema in schema_names:
            table_names = inspector.get_table_names(schema=schema)
            for table_name in table_names:
                columns = []
                for column in inspector.get_columns(table_name, schema=schema):
                    columns.append({
                        "name": column["name"],
                        "type": str(column["type"]),
                        "nullable": column["nullable"],
                        "primary_key": column["primary_key"]
                    })
                
                all_tables.append({
                    "schema": schema,
                    "name": table_name,
                    "columns": columns
                })
        
        return all_tables
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting metadata: {str(e)}")
