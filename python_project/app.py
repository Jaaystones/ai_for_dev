from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory storage for items (in production, you'd use a database)
items = []

@app.route('/items', methods=['GET'])
def get_items():
    """
    GET /items - Retrieve all items
    Returns a JSON list of all items
    """
    return jsonify({
        'success': True,
        'data': items,
        'count': len(items)
    }), 200

@app.route('/items', methods=['POST'])
def create_item():
    """
    POST /items - Create a new item
    Expects JSON payload with item data
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate that data was provided
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Create new item with metadata
        new_item = {
            'id': str(uuid.uuid4()),
            'created_at': datetime.utcnow().isoformat(),
            **data  # Spread the provided data
        }
        
        # Add item to storage
        items.append(new_item)
        
        return jsonify({
            'success': True,
            'data': new_item,
            'message': 'Item created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'success': True,
        'message': 'API is running',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=2000)
