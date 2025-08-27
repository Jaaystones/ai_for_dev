# Simple REST API

A simple REST API built with Flask that provides endpoints to manage items.

## Features

- **GET /items** - Retrieve all items
- **POST /items** - Create a new item
- **GET /health** - Health check endpoint

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### GET /items

Retrieve all items.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "created_at": "2023-12-01T10:30:00.000000",
      "name": "Sample Item",
      "description": "This is a sample item"
    }
  ],
  "count": 1
}
```

### POST /items

Create a new item.

**Request Body:**

```json
{
  "name": "New Item",
  "description": "Description of the new item",
  "price": 29.99
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "created_at": "2023-12-01T10:30:00.000000",
    "name": "New Item",
    "description": "Description of the new item",
    "price": 29.99
  },
  "message": "Item created successfully"
}
```

### GET /health

Health check endpoint to verify the API is running.

**Response:**

```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2023-12-01T10:30:00.000000"
}
```

## Example Usage

### Using curl

1. Get all items:

   ```bash
   curl http://localhost:5000/items
   ```

2. Create a new item:

   ```bash
   curl -X POST http://localhost:5000/items \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Item", "description": "A test item", "price": 19.99}'
   ```

3. Health check:
   ```bash
   curl http://localhost:5000/health
   ```

## Project Structure

```
ai_for_dev/
├── app.py              # Main application file
├── requirements.txt    # Python dependencies
└── README.md          # This file
```
