from http.server import BaseHTTPRequestHandler
import json

print("--- api/pythontest.py module loaded ---")

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        print("--- do_GET method in api/pythontest.py called ---")
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*') # CORS for testing
        self.end_headers()
        self.wfile.write(json.dumps({'message': 'Python test endpoint is working!', 'status': 'ok'}).encode())
        print("--- api/pythontest.py responded ---") 