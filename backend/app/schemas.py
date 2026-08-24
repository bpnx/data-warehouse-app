"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# Table schemas
class TableBase(BaseModel):
    name: str = Field(..., description="Table name", max_length=255)
    description: Optional[str] = Field(None, description="Table description")


class TableCreate(TableBase):
    pass


class ColumnInfo(BaseModel):
    id: int
    name: str
    data_type: str
    is_primary_key: bool
    is_nullable: bool
    description: Optional[str] = None

    class Config:
        from_attributes = True


class TableResponse(TableBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    row_count: int = 0
    column_count: int = 0
    is_active: bool = True
    columns: List[ColumnInfo] = []

    class Config:
        from_attributes = True


# Query schemas
class QueryRequest(BaseModel):
    """Request to execute a custom SQL query."""
    sql: str = Field(..., description="SQL query to execute")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Query parameters")


class QueryResult(BaseModel):
    """Result of a query execution."""
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: int
    query: str


# Query Builder schemas
class QueryBuilderFilter(BaseModel):
    """Filter condition for query builder."""
    field: str = Field(..., description="Column name")
    operator: str = Field(..., description="Comparison operator (==, !=, >, <, etc.)")
    value: Any = Field(..., description="Value to compare")


class QueryBuilderSort(BaseModel):
    """Sort configuration for query builder."""
    field: str = Field(..., description="Column name")
    direction: str = Field("asc", description="Sort direction (asc/desc)")


class QueryBuilderRequest(BaseModel):
    """Request to build a query using the query builder."""
    table: str = Field(..., description="Table name")
    select: List[str] = Field(default=["*"], description="Columns to select")
    filters: List[QueryBuilderFilter] = Field(default=[], description="Filter conditions")
    sort_by: List[QueryBuilderSort] = Field(default=[], description="Sort configurations")
    limit: Optional[int] = Field(None, description="Maximum number of rows")
    offset: Optional[int] = Field(0, description="Pagination offset")
    group_by: List[str] = Field(default=[], description="Columns to group by")
    having: Optional[str] = Field(None, description="HAVING clause")


# Saved Query schemas
class SavedQueryBase(BaseModel):
    name: str = Field(..., description="Query name", max_length=255)
    query_sql: str = Field(..., description="SQL query")
    description: Optional[str] = Field(None, description="Query description")


class SavedQueryCreate(SavedQueryBase):
    table_id: Optional[int] = Field(None, description="Associated table ID")


class SavedQueryResponse(SavedQueryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    table_id: Optional[int] = None

    class Config:
        from_attributes = True
