# Data Warehouse with PostgreSQL and Query Builder

A complete data warehouse solution with PostgreSQL backend and responsive web interface featuring a powerful query builder.

## 🚀 Features

- **PostgreSQL Data Warehouse**: Full PostgreSQL integration for data storage and management
- **Responsive Web Interface**: Modern, mobile-friendly UI built with React and Bootstrap
- **Query Builder**: Visual query builder with support for:
  - Column selection
  - Filtering (AND/OR conditions)
  - Sorting
  - Grouping
  - Limiting
  - SQL preview
- **Raw SQL Execution**: Execute custom SQL queries directly
- **Saved Queries**: Save, manage, and re-run frequently used queries
- **Table Management**: View and manage database tables and their metadata
- **Docker Support**: Easy deployment with Docker Compose

## 📁 Project Structure

```
data-warehouse-app/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py          # Main application
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database connection
│   │   ├── models/          # Database models
│   │   ├── routers/         # API endpoints
│   │   └── schemas.py        # Pydantic schemas
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                # React frontend
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml       # Docker Compose configuration
├── .gitignore
└── README.md
```

## 🛠️ Installation

### Prerequisites

- Docker and Docker Compose
- Git
- PostgreSQL (optional, if not using Docker)

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/bpnx/data-warehouse-app.git
   cd data-warehouse-app
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8000/api/docs

### Manual Installation

#### Backend

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure database connection in `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/data_warehouse
   ```

5. Run the backend:
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Access the application at http://localhost:3000

## 📖 Usage

### Using the Query Builder

1. Navigate to "Query Builder" in the sidebar
2. Select a table from the dropdown
3. Choose columns to select
4. Add filters, sorting, grouping as needed
5. Click "Execute Query" to run the query
6. View results in the results tab

### Using Raw SQL

1. Navigate to "Query Builder" > "Raw SQL" tab
2. Enter your SQL query
3. Click "Execute" to run the query
4. View results below

### Managing Saved Queries

1. Build or write a query
2. Click "Save Current Query" in the Saved Queries tab
3. Provide a name and description
4. Your query is now saved and can be re-run anytime

### Managing Tables

1. Navigate to "Tables" in the sidebar
2. View all available tables
3. Click "View Data" to see table contents
4. Use the query builder to query specific tables

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Security
SECRET_KEY=your-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Debug
DEBUG=true
```

### Database Setup

The application will automatically create the necessary tables on startup. To use an existing database:

1. Update the `DATABASE_URL` in `.env`
2. Ensure the database user has proper permissions
3. Restart the backend service

## 📡 API Endpoints

### Tables
- `GET /api/tables/` - List all tables
- `GET /api/tables/{table_name}` - Get table metadata
- `GET /api/tables/{table_name}/columns` - Get table columns
- `GET /api/tables/{table_name}/data` - Get table data
- `GET /api/tables/all-metadata` - Get all tables metadata

### Queries
- `POST /api/queries/execute` - Execute a custom SQL query
- `POST /api/queries/build` - Build and execute a query
- `GET /api/queries/saved` - List saved queries
- `POST /api/queries/saved` - Save a query
- `GET /api/queries/saved/{query_id}` - Get a saved query
- `POST /api/queries/saved/{query_id}/execute` - Execute a saved query
- `DELETE /api/queries/saved/{query_id}` - Delete a saved query

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Bootstrap-based styling
- **Real-time Results**: Execute queries and see results instantly
- **Query History**: Track executed queries
- **Error Handling**: Clear error messages for failed queries

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed**: Check your `DATABASE_URL` and ensure PostgreSQL is running
2. **CORS errors**: Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
3. **Docker permission issues**: Run `docker-compose` with sudo or fix Docker permissions

### Debug Mode

Enable debug mode in `.env`:
```env
DEBUG=true
```

This will provide detailed error messages and SQL query logging.

## 📜 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
