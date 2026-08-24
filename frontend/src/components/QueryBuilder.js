import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, InputGroup, ListGroup, Badge, Alert } from 'react-bootstrap';
import Select from 'react-select';

const operators = [
  { value: '==', label: 'Equals (=)' },
  { value: '!=', label: 'Not Equals (!=)' },
  { value: '>', label: 'Greater Than (>)' },
  { value: '<', label: 'Less Than (<)' },
  { value: '>=', label: 'Greater Than or Equal (>=)' },
  { value: '<=', label: 'Less Than or Equal (<=)' },
  { value: 'like', label: 'Contains (LIKE)' },
  { value: 'in', label: 'In List (IN)' },
];

const sortDirections = [
  { value: 'asc', label: 'Ascending (A-Z)' },
  { value: 'desc', label: 'Descending (Z-A)' },
];

function QueryBuilder({ tables, onQueryBuilt }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([{ value: '*', label: 'All Columns (*)' }]);
  const [filters, setFilters] = useState([]);
  const [sortBy, setSortBy] = useState([]);
  const [limit, setLimit] = useState('');
  const [offset, setOffset] = useState('');
  const [groupBy, setGroupBy] = useState([]);
  const [having, setHaving] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [showSQL, setShowSQL] = useState(false);

  // Get table names for select
  const tableOptions = tables.map(table => ({
    value: table.name,
    label: table.name,
  }));

  // Handle table selection
  useEffect(() => {
    if (selectedTable) {
      // Find table columns
      const table = tables.find(t => t.name === selectedTable.value);
      if (table && table.columns) {
        const columns = table.columns.map(col => ({
          value: col.name,
          label: `${col.name} (${col.data_type})`,
        }));
        setAvailableColumns(columns);
      } else {
        // If we don't have metadata, use a placeholder
        setAvailableColumns([
          { value: 'id', label: 'id' },
          { value: 'name', label: 'name' },
          { value: 'created_at', label: 'created_at' },
        ]);
      }
    }
  }, [selectedTable, tables]);

  // Generate SQL when dependencies change
  useEffect(() => {
    if (selectedTable) {
      generateSQL();
    }
  }, [selectedTable, selectedColumns, filters, sortBy, limit, offset, groupBy, having]);

  const generateSQL = () => {
    if (!selectedTable) return '';

    // SELECT clause
    const selectClause = selectedColumns.length > 0 
      ? selectedColumns.map(col => col.value).join(', ') 
      : '*';

    // FROM clause
    const fromClause = selectedTable.value;

    // WHERE clause
    const whereConditions = filters.map((filter, index) => {
      let value = filter.value;
      if (typeof value === 'string' && filter.operator.value === 'like') {
        value = `%${value}%`;
      }
      if (Array.isArray(value)) {
        value = `(${value.map(v => `'${v}'`).join(', ')})`;
      } else if (typeof value === 'string') {
        value = `'${value}'`;
      }
      return `${filter.field.value} ${filter.operator.value} ${value}`;
    }).join(' AND ');

    // GROUP BY clause
    const groupByClause = groupBy.length > 0 
      ? ` GROUP BY ${groupBy.map(col => col.value).join(', ')}` 
      : '';

    // HAVING clause
    const havingClause = having ? ` HAVING ${having}` : '';

    // ORDER BY clause
    const orderByClause = sortBy.length > 0 
      ? ` ORDER BY ${sortBy.map(sort => `${sort.field.value} ${sort.direction.value}`).join(', ')}`
      : '';

    // LIMIT and OFFSET
    const limitClause = limit ? ` LIMIT ${limit}` : '';
    const offsetClause = offset ? ` OFFSET ${offset}` : '';

    // Build query
    let sql = `SELECT ${selectClause} FROM ${fromClause}`;
    if (whereConditions) sql += ` WHERE ${whereConditions}`;
    if (groupByClause) sql += groupByClause;
    if (havingClause) sql += havingClause;
    if (orderByClause) sql += orderByClause;
    if (limitClause) sql += limitClause;
    if (offsetClause) sql += offsetClause;
    sql += ';';

    setGeneratedSQL(sql);
    return sql;
  };

  const addFilter = () => {
    if (availableColumns.length > 0) {
      setFilters([...filters, {
        field: availableColumns[0],
        operator: operators[0],
        value: '',
      }]);
    }
  };

  const removeFilter = (index) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const updateFilter = (index, field, value) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  const addSort = () => {
    if (availableColumns.length > 0) {
      setSortBy([...sortBy, {
        field: availableColumns[0],
        direction: sortDirections[0],
      }]);
    }
  };

  const removeSort = (index) => {
    const newSortBy = [...sortBy];
    newSortBy.splice(index, 1);
    setSortBy(newSortBy);
  };

  const updateSort = (index, field, value) => {
    const newSortBy = [...sortBy];
    newSortBy[index][field] = value;
    setSortBy(newSortBy);
  };

  const handleExecute = () => {
    if (generatedSQL && onQueryBuilt) {
      onQueryBuilt(generatedSQL);
    }
  };

  const handleClear = () => {
    setSelectedTable(null);
    setSelectedColumns([{ value: '*', label: 'All Columns (*)' }]);
    setFilters([]);
    setSortBy([]);
    setLimit('');
    setOffset('');
    setGroupBy([]);
    setHaving('');
    setGeneratedSQL('');
  };

  return (
    <Card className="query-builder">
      <Card.Header>
        <h5 className="mb-0">
          <i className="bi bi-code-slash me-2"></i>
          Query Builder
        </h5>
      </Card.Header>
      <Card.Body>
        <Form>
          {/* Table Selection */}
          <Form.Group className="mb-3">
            <Form.Label>Table</Form.Label>
            <Select
              options={tableOptions}
              value={selectedTable}
              onChange={setSelectedTable}
              placeholder="Select a table..."
              isClearable
            />
          </Form.Group>

          {selectedTable && (
            <>
              {/* Columns Selection */}
              <Form.Group className="mb-3">
                <Form.Label>Select Columns</Form.Label>
                <Select
                  isMulti
                  options={availableColumns}
                  value={selectedColumns}
                  onChange={setSelectedColumns}
                  placeholder="Select columns..."
                  defaultValue={[selectedColumns[0]]}
                />
              </Form.Group>

              {/* Filters */}
              <Form.Group className="mb-3">
                <Form.Label>Filters (WHERE)</Form.Label>
                <ListGroup variant="flush" className="mb-2">
                  {filters.map((filter, index) => (
                    <ListGroup.Item key={index} className="p-2">
                      <Row className="g-2 align-items-center">
                        <Col md={4}>
                          <Select
                            options={availableColumns}
                            value={filter.field}
                            onChange={(value) => updateFilter(index, 'field', value)}
                            placeholder="Column"
                          />
                        </Col>
                        <Col md={3}>
                          <Select
                            options={operators}
                            value={filter.operator}
                            onChange={(value) => updateFilter(index, 'operator', value)}
                            placeholder="Operator"
                          />
                        </Col>
                        <Col md={4}>
                          <Form.Control
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                            placeholder="Value"
                          />
                        </Col>
                        <Col md={1}>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeFilter(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                <Button variant="outline-secondary" size="sm" onClick={addFilter}>
                  <i className="bi bi-plus me-1"></i>Add Filter
                </Button>
              </Form.Group>

              {/* Group By */}
              <Form.Group className="mb-3">
                <Form.Label>Group By</Form.Label>
                <Select
                  isMulti
                  options={availableColumns}
                  value={groupBy}
                  onChange={setGroupBy}
                  placeholder="Select columns to group by..."
                />
              </Form.Group>

              {/* Having */}
              <Form.Group className="mb-3">
                <Form.Label>Having</Form.Label>
                <Form.Control
                  type="text"
                  value={having}
                  onChange={(e) => setHaving(e.target.value)}
                  placeholder="e.g., COUNT(*) > 10"
                />
              </Form.Group>

              {/* Sort By */}
              <Form.Group className="mb-3">
                <Form.Label>Sort By (ORDER BY)</Form.Label>
                <ListGroup variant="flush" className="mb-2">
                  {sortBy.map((sort, index) => (
                    <ListGroup.Item key={index} className="p-2">
                      <Row className="g-2 align-items-center">
                        <Col md={5}>
                          <Select
                            options={availableColumns}
                            value={sort.field}
                            onChange={(value) => updateSort(index, 'field', value)}
                            placeholder="Column"
                          />
                        </Col>
                        <Col md={4}>
                          <Select
                            options={sortDirections}
                            value={sort.direction}
                            onChange={(value) => updateSort(index, 'direction', value)}
                            placeholder="Direction"
                          />
                        </Col>
                        <Col md={3}>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeSort(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                <Button variant="outline-secondary" size="sm" onClick={addSort}>
                  <i className="bi bi-plus me-1"></i>Add Sort
                </Button>
              </Form.Group>

              {/* Limit and Offset */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Limit</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        placeholder="Number of rows"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Offset</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        value={offset}
                        onChange={(e) => setOffset(e.target.value)}
                        placeholder="Starting row"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              {/* Generated SQL Preview */}
              <div className="mb-3">
                <Form.Check
                  type="switch"
                  id="show-sql-switch"
                  label="Show Generated SQL"
                  checked={showSQL}
                  onChange={(e) => setShowSQL(e.target.checked)}
                />
                {showSQL && generatedSQL && (
                  <div className="sql-preview mt-2">
                    <pre>{generatedSQL}</pre>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={handleExecute} disabled={!generatedSQL}>
                  <i className="bi bi-play me-1"></i>Execute Query
                </Button>
                <Button variant="outline-secondary" onClick={handleClear}>
                  <i className="bi bi-arrow-clockwise me-1"></i>Clear
                </Button>
              </div>
            </>
          )}

          {!selectedTable && (
            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              Please select a table to start building your query.
            </Alert>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default QueryBuilder;
