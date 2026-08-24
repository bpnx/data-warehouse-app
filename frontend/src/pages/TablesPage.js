import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function TablesPage({ tables: initialTables, loading: initialLoading, error, onRefresh }) {
  const [tables, setTables] = useState(initialTables);
  const [loading, setLoading] = useState(initialLoading);
  const [tableData, setTableData] = useState(null);
  const [tableColumns, setTableColumns] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableDescription, setNewTableDescription] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [allMetadata, setAllMetadata] = useState([]);

  useEffect(() => {
    setTables(initialTables);
    setLoading(initialLoading);
  }, [initialTables, initialLoading]);

  useEffect(() => {
    fetchAllMetadata();
  }, []);

  const fetchAllMetadata = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tables/all-metadata');
      if (response.ok) {
        const data = await response.json();
        setAllMetadata(data);
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const fetchTableData = async (tableName) => {
    try {
      setDataLoading(true);
      setDataError(null);
      
      const response = await fetch(`http://localhost:8000/api/tables/${tableName}/data?limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch table data');
      }
      const data = await response.json();
      setTableData(data);
      
      // Fetch columns metadata
      const columnsResponse = await fetch(`http://localhost:8000/api/tables/${tableName}/columns`);
      if (columnsResponse.ok) {
        const columns = await columnsResponse.json();
        setTableColumns(columns);
      }
    } catch (err) {
      setDataError(err.message);
      setTableData(null);
    } finally {
      setDataLoading(false);
    }
  };

  const handleViewData = async (table) => {
    setSelectedTable(table);
    await fetchTableData(table.name);
    setShowDataModal(true);
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/tables/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTableName,
          description: newTableDescription,
        }),
      });
      
      if (response.ok) {
        setShowTableModal(false);
        setNewTableName('');
        setNewTableDescription('');
        onRefresh();
      } else {
        throw new Error('Failed to create table');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleViewTableInfo = (table) => {
    setSelectedTable(table);
    setShowTableModal(true);
  };

  return (
    <div className="tables-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Tables</h2>
        <Button variant="primary" onClick={() => setShowTableModal(true)}>
          <i className="bi bi-plus me-2"></i>Add Table
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-table me-2"></i>
            Available Tables
          </h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading tables...</p>
            </div>
          ) : (
            <>
              {tables.length === 0 && allMetadata.length === 0 ? (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  No tables found. Create a table or connect to an existing database.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Columns</th>
                        <th>Rows</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMetadata.map((meta, index) => {
                        const registeredTable = tables.find(t => t.name === meta.name);
                        return (
                          <tr key={`${meta.schema}-${meta.name}-${index}`}>
                            <td>
                              <i className="bi bi-table me-2 text-primary"></i>
                              {meta.schema !== 'public' && <span className="text-muted">{meta.schema}.</span>}
                              {meta.name}
                            </td>
                            <td>{registeredTable?.description || 'No description'}</td>
                            <td>
                              <Badge bg="secondary">{meta.columns.length}</Badge>
                            </td>
                            <td>
                              {registeredTable ? (
                                <Badge bg="info">{registeredTable.row_count}</Badge>
                              ) : (
                                <Badge bg="light" className="text-muted">Unknown</Badge>
                              )}
                            </td>
                            <td>
                              {registeredTable?.created_at ? (
                                new Date(registeredTable.created_at).toLocaleDateString()
                              ) : 'N/A'}
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleViewData(meta)}
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                              <Link 
                                to={`/query-builder?table=${meta.name}`} 
                                className="btn btn-sm btn-outline-success"
                              >
                                <i className="bi bi-code-slash"></i>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Table Data Modal */}
      <Modal size="xl" show={showDataModal} onHide={() => setShowDataModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-table me-2"></i>
            {selectedTable?.name || 'Table Data'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dataLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading data...</p>
            </div>
          ) : dataError ? (
            <Alert variant="danger">{dataError}</Alert>
          ) : tableData ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <Badge bg="secondary" className="me-2">
                    {tableData.total} rows
                  </Badge>
                  <Badge bg="info">
                    {tableData.columns.length} columns
                  </Badge>
                </div>
                <div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => fetchTableData(selectedTable?.name)}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>Refresh
                  </Button>
                </div>
              </div>
              
              <div className="table-responsive result-table">
                <table className="table table-striped table-hover">
                  <thead className="table-light">
                    <tr>
                      {tableData.columns.map(column => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.data.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {tableData.columns.map(column => (
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
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDataModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Table Modal */}
      <Modal show={showTableModal} onHide={() => {
        setShowTableModal(false);
        setNewTableName('');
        setNewTableDescription('');
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Table</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateTable}>
            <Form.Group className="mb-3">
              <Form.Label>Table Name</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-table"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Enter table name"
                  required
                />
              </InputGroup>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newTableDescription}
                onChange={(e) => setNewTableDescription(e.target.value)}
                placeholder="Enter table description"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => {
                setShowTableModal(false);
                setNewTableName('');
                setNewTableDescription('');
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="bi bi-check me-1"></i>Create
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default TablesPage;
