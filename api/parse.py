from http.server import BaseHTTPRequestHandler
import base64
import json
import sys
import os
import traceback # For detailed error logging

print("--- api/parse.py module loaded (v2) ---")

# Ensure the project root (parent of 'api' directory) is in sys.path
# This allows importing modules from the project root, like bt_parser.py
try:
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    print(f"--- Project root for imports: {project_root} ---")
    print(f"--- sys.path after modification: {sys.path} ---")
    
    from bt_parser import parse_statement # Removed Transaction import, not directly used here
    print("--- Successfully imported parse_statement from bt_parser (v2) ---")
    PARSER_AVAILABLE = True
except ImportError as e:
    print(f"--- CRITICAL: Failed to import from bt_parser: {e} ---")
    print(traceback.format_exc())
    parse_statement = None
    PARSER_AVAILABLE = False

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        print("--- do_POST method in api/parse.py called (v2) ---")
        if not PARSER_AVAILABLE:
            print("--- ERROR: bt_parser.parse_statement not available due to import error. ---")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': "Server configuration error: Parser module failed to load.",
                'trace': "ImportError for bt_parser. Check vercel dev logs."
            }).encode())
            return
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            print("--- Received POST data (v2):", data.keys() if isinstance(data, dict) else "Not a dict" )

            if 'file' not in data:
                print("--- Error: 'file' key not in POST data (v2) ---")
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': "Missing 'file' in request body"}).encode())
                return

            pdf_bytes = base64.b64decode(data['file'])
            print(f"--- Decoded PDF bytes, length: {len(pdf_bytes)} (v2) ---")

            txns = parse_statement(pdf_bytes)
            print(f"--- parse_statement returned {len(txns)} transactions (v2) ---")
            
            txns_dict = []
            for t in txns:
                txns_dict.append({
                    'date': t.date.isoformat(), # Ensure this is .isoformat() for datetime
                    'description': t.description,
                    'vendor': t.vendor,
                    'amount': str(t.amount),
                    'currency': t.currency,
                    'debit': str(t.debit),
                    'credit': str(t.credit),
                    'amount_ron': str(t.amount_ron) if t.amount_ron is not None else None,
                    'rrn': t.rrn
                })
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps({'transactions': txns_dict}).encode())
            print("--- Successfully sent 200 response with transactions (v2) ---")
            
        except Exception as e:
            error_message = str(e)
            error_trace = traceback.format_exc()
            print(f"--- ERROR in do_POST (v2): {error_message} ---")
            print(error_trace)
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': error_message,
                'trace': error_trace # Sending trace for debugging, remove in production
            }).encode())
    
    def do_OPTIONS(self):
        print("--- do_OPTIONS method in api/parse.py called (v2) ---")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        print("--- Successfully sent 200 response for OPTIONS request (v2) ---") 