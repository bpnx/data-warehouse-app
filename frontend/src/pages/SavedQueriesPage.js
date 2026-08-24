import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Alert, Spinner, Badge, Modal, Form, InputGroup } from 'react-bootstrap';

function SavedQueriesPage() {
  const [savedQueries, setSavedQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuery, setNewQuery] = useState({
    name: '',
    query_sql: '',
    description: '',
  });
  const [executing, setExecuting] = useState(false);
  const [executeResults, setExecuteResults] = useState(null);

  useEffect(() => {
    fetchSavedQueries();
  }, []);

  const fetchSavedQueries = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/queries/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedQueries(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch saved queries');
      }
    } catch (err) {
      setError(err.message);
      setSavedQueries([]);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async (queryId) => {
    try {
      setExecuting(true);
      setExecuteResults(null);
      setError(null);

      const response = await fetch(`http://localhost:8000/api/queries/saved/${queryId}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setExecuteResults(data);
      } else {
        throw new Error('Failed to execute query');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const deleteQuery = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query?')) return;

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

  const createQuery = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/queries/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuery),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewQuery({ name: '', query_sql: '', description: '' });
        await fetchSavedQueries();
      } else {
        throw new Error('Failed to create query');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const renderResults = () => {
    if (!executeResults) return null;

    return (
      <Modal size="xl" show={!!executeResults} onHide={() => setExecuteResults(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Query Results</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Badge bg="info" className="mb-3">
            {executeResults.row_count} rows in {executeResults.execution_time_ms}ms
          </Badge>
          
          {executeResults.columns.length === 0 ? (
            <Alert variant="info">No results returned</Alert>
          ) : (
            <div className="table-responsive result-table">
              <table className="table table-striped table-hover">
                <thead className="table-light">
                  <tr>
                    {executeResults.columns.map(column => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {executeResults.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {executeResults.columns.map(column => (
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setExecuteResults(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div className="saved-queries-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Saved Queries</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus me-2"></i>Create Query
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-save me-2"></i>
            My Saved Queries
          </h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading saved queries...</p>
            </div>
          ) : savedQueries.length === 0 ? (
            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              No saved queries yet. Create your first query to get started.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th>By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedQueries.map(query => (
                    <tr key={query.id}>
                      <td>
                        <i className="bi bi-file-earmark-code me-2 text-primary"></i>
                        {query.name}
                      </td>
                      <td>{query.description || <span className="text-muted">No description</span>}</td>
                      <td>{new Date(query.created_at).toLocaleDateString()}</td>
                      <td>{query.created_by}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => executeQuery(query.id)}
                          disabled={executing}
                        >
                          {executing ? (
                            <>
                              <Spinner size="sm" /> Executing...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-play"></i> Run
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => deleteQuery(query.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Query Modal */}
      <Modal 
        size="lg" 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Query</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={createQuery}>
            <Form.Group className="mb-3">
              <Form.Label>Query Name *</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-file-earmark"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  value={newQuery.name}
                  onChange={(e) => setNewQuery({ ...newQuery, name: e.target.value })}
                  placeholder="Enter query name"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newQuery.description}
                onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
                placeholder="Enter query description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>SQL Query *</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                value={newQuery.query_sql}
                onChange={(e) => setNewQuery({ ...newQuery, query_sql: e.target.value })}
                placeholder="Enter your SQL query"
                required
                className="code-editor"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="bi bi-check me-1"></i>Save Query
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {renderResults()}
    </div>
  );
}

export default SavedQueriesPage;
