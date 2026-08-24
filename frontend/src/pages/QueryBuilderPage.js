import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Tabs, Tab, Badge } from 'react-bootstrap';
import QueryBuilder from '../components/QueryBuilder';

function QueryBuilderPage({ tables }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [savedQueries, setSavedQueries] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load saved queries
  useEffect(() => {
    fetchSavedQueries();
  }, []);

  const fetchSavedQueries = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/queries/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedQueries(data);
      }
    } catch (err) {
      console.error('Error fetching saved queries:', err);
    }
  };

  const executeQuery = async (sql) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:8000/api/queries/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Query execution failed');
      }

      const data = await response.json();
      setResults(data);
      setQuery(sql);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryBuilt = (sql) => {
    executeQuery(sql);
    setActiveTab('results');
  };

  const saveQuery = async (name, description) => {
    if (!query) {
      setError('No query to save');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:8000/api/queries/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          query_sql: query,
          description,
        }),
      });

      if (response.ok) {
        await fetchSavedQueries();
        setError(null);
      } else {
        throw new Error('Failed to save query');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const executeSavedQuery = async (queryId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/queries/saved/${queryId}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setActiveTab('results');
        setError(null);
      } else {
        throw new Error('Failed to execute saved query');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSavedQuery = async (queryId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/queries/saved/${queryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSavedQueries();
      } else {
        throw new Error('Failed to delete query');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Query Results</h5>
          <Badge bg="info">
            {results.row_count} rows in {results.execution_time_ms}ms
          </Badge>
        </Card.Header>
        <Card.Body>
          {results.columns.length === 0 ? (
            <Alert variant="info">No results returned</Alert>
          ) : (
            <div className="table-responsive result-table">
              <table className="table table-striped table-hover">
                <thead className="table-light">
                  <tr>
                    {results.columns.map(column => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {results.columns.map(column => (
                        <td key={`${column}-${rowIndex}`}>
                          {row[column] !== null && row[column] !== undefined ? 
                            String(row[column]) : 'NULL'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="query-builder-page">
      <h2 className="mb-4">Query Builder</h2>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      <Tabs 
        activeKey={activeTab} 
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="builder" title="Build Query">
          <QueryBuilder tables={tables} onQueryBuilt={handleQueryBuilt} />
        </Tab>
        
        <Tab eventKey="sql" title="Raw SQL">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Execute Raw SQL</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={(e) => {
                e.preventDefault();
                executeQuery(query);
              }}>
                <Form.Group className="mb-3">
                  <Form.Label>SQL Query</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your SQL query..."
                    className="code-editor"
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading || !query.trim()}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play me-1"></i>
                        Execute
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setQuery('')}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Clear
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="saved" title="Saved Queries">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Saved Queries</h5>
              <Button variant="primary" size="sm" onClick={() => {
                const name = prompt('Enter query name:');
                if (name) {
                  const description = prompt('Enter description (optional):');
                  saveQuery(name, description);
                }
              }}>
                <i className="bi bi-plus me-1"></i>Save Current Query
              </Button>
            </Card.Header>
            <Card.Body>
              {savedQueries.length === 0 ? (
                <Alert variant="info">No saved queries yet</Alert>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedQueries.map(savedQuery => (
                        <tr key={savedQuery.id}>
                          <td>{savedQuery.name}</td>
                          <td>{savedQuery.description || 'No description'}</td>
                          <td>{new Date(savedQuery.created_at).toLocaleDateString()}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => executeSavedQuery(savedQuery.id)}
                            >
                              <i className="bi bi-play"></i> Run
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => deleteSavedQuery(savedQuery.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {loading && activeTab !== 'builder' && (
        <div className="text-center py-4">
          <Spinner animation="border" />
          <p className="mt-2">Executing query...</p>
        </div>
      )}

      {results && renderResults()}
    </div>
  );
}

export default QueryBuilderPage;
