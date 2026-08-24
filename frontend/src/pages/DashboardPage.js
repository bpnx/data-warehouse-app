import React from 'react';
import { Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function DashboardPage({ tables, loading, error }) {
  return (
    <div className="dashboard-page">
      <h2 className="mb-4">Dashboard</h2>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="bi bi-database text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
                <div>
                  <h6 className="text-muted">Total Tables</h6>
                  <h3 className="mb-0">{loading ? <Spinner size="sm" /> : tables.length}</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="bi bi-code-slash text-success" style={{ fontSize: '2rem' }}></i>
                </div>
                <div>
                  <h6 className="text-muted">Query Builder</h6>
                  <h3 className="mb-0">Ready</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="bi bi-save text-warning" style={{ fontSize: '2rem' }}></i>
                </div>
                <div>
                  <h6 className="text-muted">Saved Queries</h6>
                  <h3 className="mb-0">0</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="bi bi-graph-up text-info" style={{ fontSize: '2rem' }}></i>
                </div>
                <div>
                  <h6 className="text-muted">Analytics</h6>
                  <h3 className="mb-0">Available</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12} lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/query-builder" className="btn btn-primary">
                  <i className="bi bi-code-slash me-2"></i>
                  Build New Query
                </Link>
                <Link to="/tables" className="btn btn-outline-secondary">
                  <i className="bi bi-table me-2"></i>
                  View All Tables
                </Link>
                <Link to="/saved-queries" className="btn btn-outline-secondary">
                  <i className="bi bi-save me-2"></i>
                  View Saved Queries
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={12} lg={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Tables</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : tables.length === 0 ? (
                <Alert variant="info">No tables found. Create some tables first.</Alert>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Rows</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.slice(0, 5).map(table => (
                        <tr key={table.id}>
                          <td>
                            <i className="bi bi-table me-2"></i>
                            {table.name}
                          </td>
                          <td>{table.description || 'No description'}</td>
                          <td>{table.row_count}</td>
                          <td>
                            <Link 
                              to={`/tables?table=${table.name}`} 
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-eye"></i> View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
