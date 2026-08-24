import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Navbar, Nav, Button } from 'react-bootstrap';
import TablesPage from './pages/TablesPage';
import QueryBuilderPage from './pages/QueryBuilderPage';
import SavedQueriesPage from './pages/SavedQueriesPage';
import DashboardPage from './pages/DashboardPage';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/tables/');
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      const data = await response.json();
      setTables(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if current path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="wrapper">
      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="d-flex flex-column h-100">
          <div className="mb-4">
            <h3 className="text-white">
              <i className="bi bi-database me-2"></i>
              Data Warehouse
            </h3>
          </div>
          
          <Nav className="flex-column mb-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className="bi bi-speedometer2"></i>
              Dashboard
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/tables" 
              className={`nav-link ${isActive('/tables') ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className="bi bi-table"></i>
              Tables
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/query-builder" 
              className={`nav-link ${isActive('/query-builder') ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className="bi bi-code-slash"></i>
              Query Builder
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/saved-queries" 
              className={`nav-link ${isActive('/saved-queries') ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className="bi bi-save"></i>
              Saved Queries
            </Nav.Link>
          </Nav>
          
          <div className="mt-auto">
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={() => {
                setSidebarOpen(false);
                fetchTables();
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </Button>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="main-content" style={{ marginLeft: sidebarOpen ? '250px' : '0' }}>
        {/* Header */}
        <header className="header d-flex align-items-center">
          <Button 
            variant="link" 
            className="text-decoration-none text-dark me-3 d-md-none"
            onClick={toggleSidebar}
          >
            <i className="bi bi-list"></i>
          </Button>
          
          <h1 className="m-0 flex-grow-1">
            {location.pathname === '/' && 'Dashboard'}
            {location.pathname === '/tables' && 'Tables'}
            {location.pathname === '/query-builder' && 'Query Builder'}
            {location.pathname === '/saved-queries' && 'Saved Queries'}
          </h1>
          
          <div>
            <Button variant="outline-secondary" size="sm" className="me-2">
              <i className="bi bi-gear"></i> Settings
            </Button>
            <Button variant="primary" size="sm">
              <i className="bi bi-person-circle"></i> Login
            </Button>
          </div>
        </header>

        {/* Main content */}
        <Container fluid className="mt-4">
          <Routes>
            <Route path="/" element={<DashboardPage tables={tables} loading={loading} error={error} />} />
            <Route path="/tables" element={<TablesPage tables={tables} loading={loading} error={error} onRefresh={fetchTables} />} />
            <Route path="/query-builder" element={<QueryBuilderPage tables={tables} />} />
            <Route path="/saved-queries" element={<SavedQueriesPage />} />
          </Routes>
        </Container>
      </div>
    </div>
  );
}

export default App;
