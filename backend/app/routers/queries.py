"""API endpoints for query execution and query builder."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import time
from datetime import datetime

from ..database import get_db
from ..models import QueryHistory, SavedQuery, TableMetadata
from ..schemas import (
    QueryRequest, QueryResult, QueryBuilderRequest,
    SavedQueryCreate, SavedQueryResponse
)

router = APIRouter(prefix="/api/queries", tags=["queries"])


@router.post("/execute", response_model=QueryResult)
async def execute_query(query: QueryRequest, db: Session = Depends(get_db)):
    """Execute a custom SQL query."""
    start_time = time.time()
    
    try:
        # Execute the query
        result = db.execute(text(query.sql), query.parameters or {})
        
        # Get column names
        columns = result.keys()
        
        # Convert to list of dicts
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        # Log query history
        query_history = QueryHistory(
            query_sql=query.sql,
            execution_time_ms=execution_time_ms,
            row_count=len(rows),
            status="success",
            user="anonymous"
        )
        db.add(query_history)
        db.commit()
        
        return QueryResult(
            columns=list(columns),
            rows=rows,
            row_count=len(rows),
            execution_time_ms=execution_time_ms,
            query=query.sql
        )
    except Exception as e:
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        # Log failed query
        query_history = QueryHistory(
            query_sql=query.sql,
            execution_time_ms=execution_time_ms,
            row_count=0,
            status="error",
            error_message=str(e),
            user="anonymous"
        )
        db.add(query_history)
        db.commit()
        
        raise HTTPException(
            status_code=400,
            detail=f"Query execution failed: {str(e)}"
        )


@router.post("/build", response_model=QueryResult)
async def build_query(query_builder: QueryBuilderRequest, db: Session = Depends(get_db)):
    """Build and execute a query using the query builder."""
    # Build SQL query from builder request
    sql = _build_sql_from_builder(query_builder)
    
    # Execute the built query
    return await execute_query(QueryRequest(sql=sql), db)


def _build_sql_from_builder(builder: QueryBuilderRequest) -> str:
    """Build SQL query from QueryBuilderRequest."""
    # SELECT clause
    select_clause = ", ".join(builder.select) if builder.select else "*"
    
    # FROM clause
    from_clause = builder.table
    
    # WHERE clause
    where_conditions = []
    for filter_ in builder.filters:
        # Sanitize field name
        field = filter_.field.replace("'", "'")
        operator = filter_.operator
        
        # Handle different operators
        if operator in ["==", "=", "eq"]:
            where_conditions.append(f"{field} = :{field}")
        elif operator in ["!=", "<>", "ne"]:
            where_conditions.append(f"{field} != :{field}")
        elif operator in [">", "gt"]:
            where_conditions.append(f"{field} > :{field}")
        elif operator in ["<", "lt"]:
            where_conditions.append(f"{field} < :{field}")
        elif operator in [">=", "ge"]:
            where_conditions.append(f"{field} >= :{field}")
        elif operator in ["<=", "le"]:
            where_conditions.append(f"{field} <= :{field}")
        elif operator in ["like", "LIKE"]:
            where_conditions.append(f"{field} LIKE :{field}")
        elif operator in ["in", "IN"]:
            where_conditions.append(f"{field} IN :{field}")
    
    where_clause = " AND ".join(where_conditions) if where_conditions else ""
    
    # GROUP BY clause
    group_by_clause = f" GROUP BY {', '.join(builder.group_by)}" if builder.group_by else ""
    
    # HAVING clause
    having_clause = f" HAVING {builder.having}" if builder.having else ""
    
    # SORT BY clause
    sort_clauses = []
    for sort in builder.sort_by:
        direction = sort.direction.upper() if sort.direction else "ASC"
        sort_clauses.append(f"{sort.field} {direction}")
    order_by_clause = f" ORDER BY {', '.join(sort_clauses)}" if sort_clauses else ""
    
    # LIMIT and OFFSET
    limit_clause = f" LIMIT {builder.limit}" if builder.limit else ""
    offset_clause = f" OFFSET {builder.offset}" if builder.offset else ""
    
    # Build final query
    sql_parts = [f"SELECT {select_clause}", f"FROM {from_clause}"]
    
    if where_clause:
        sql_parts.append(f"WHERE {where_clause}")
    if group_by_clause:
        sql_parts.append(group_by_clause)
    if having_clause:
        sql_parts.append(having_clause)
    if order_by_clause:
        sql_parts.append(order_by_clause)
    if limit_clause:
        sql_parts.append(limit_clause)
    if offset_clause:
        sql_parts.append(offset_clause)
    
    return " ".join(sql_parts) + ";"


@router.post("/saved", response_model=SavedQueryResponse, status_code=status.HTTP_201_CREATED)
async def save_query(query: SavedQueryCreate, db: Session = Depends(get_db)):
    """Save a query for later use."""
    new_query = SavedQuery(
        name=query.name,
        query_sql=query.query_sql,
        description=query.description,
        table_id=query.table_id,
        created_by="anonymous"
    )
    db.add(new_query)
    db.commit()
    db.refresh(new_query)
    
    return new_query


@router.get("/saved", response_model=List[SavedQueryResponse])
async def list_saved_queries(db: Session = Depends(get_db)):
    """List all saved queries."""
    queries = db.query(SavedQuery).all()
    return queries


@router.get("/saved/{query_id}", response_model=SavedQueryResponse)
async def get_saved_query(query_id: int, db: Session = Depends(get_db)):
    """Get a specific saved query."""
    query = db.query(SavedQuery).filter(SavedQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    return query


@router.post("/saved/{query_id}/execute", response_model=QueryResult)
async def execute_saved_query(query_id: int, db: Session = Depends(get_db)):
    """Execute a saved query."""
    query = db.query(SavedQuery).filter(SavedQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    return await execute_query(QueryRequest(sql=query.query_sql), db)


@router.delete("/saved/{query_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_query(query_id: int, db: Session = Depends(get_db)):
    """Delete a saved query."""
    query = db.query(SavedQuery).filter(SavedQuery.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    db.delete(query)
    db.commit()
