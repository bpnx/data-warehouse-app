"""Database models."""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class TableMetadata(Base):
    """Metadata for uploaded tables."""
    
    __tablename__ = "table_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    columns = relationship("ColumnMetadata", back_populates="table", cascade="all, delete-orphan")
    queries = relationship("SavedQuery", back_populates="table")


class ColumnMetadata(Base):
    """Metadata for table columns."""
    
    __tablename__ = "column_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("table_metadata.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    data_type = Column(String(50), nullable=False)
    is_primary_key = Column(Boolean, default=False)
    is_nullable = Column(Boolean, default=True)
    description = Column(Text)
    
    # Relationships
    table = relationship("TableMetadata", back_populates="columns")


class SavedQuery(Base):
    """Saved queries for reuse."""
    
    __tablename__ = "saved_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("table_metadata.id"), nullable=True)
    name = Column(String(255), nullable=False)
    query_sql = Column(Text, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    created_by = Column(String(100), default="system")
    
    # Relationships
    table = relationship("TableMetadata", back_populates="queries")


class QueryHistory(Base):
    """History of executed queries."""
    
    __tablename__ = "query_history"
    
    id = Column(Integer, primary_key=True, index=True)
    query_sql = Column(Text, nullable=False)
    executed_at = Column(DateTime, server_default=func.now())
    execution_time_ms = Column(Integer)
    row_count = Column(Integer)
    status = Column(String(20), default="success")
    error_message = Column(Text)
    user = Column(String(100), default="anonymous")
