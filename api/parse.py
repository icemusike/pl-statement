from http.server import BaseHTTPRequestHandler
import base64
import json
import sys
import os
import traceback # For detailed error logging

print("--- api/parse.py module loaded (v3-vercel) ---")

# Ensure the project root (parent of 'api' directory) is in sys.path
# This allows importing modules from the project root, like bt_parser.py
try:
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    print(f"--- Project root for imports (v3): {project_root} ---")
    print(f"--- sys.path after modification: {sys.path} ---")
    
    from bt_parser import parse_statement # Removed Transaction import, not directly used here
    print("--- Successfully imported parse_statement from bt_parser (v3) ---")
    PARSER_AVAILABLE = True
except ImportError as e:
    print(f"--- CRITICAL: Failed to import from bt_parser (v3): {e} ---")
    print(traceback.format_exc())
    parse_statement = None
    PARSER_AVAILABLE = False

class Handler(BaseHTTPRequestHandler):
    def _send_json_response(self, status_code, data_dict):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data_dict).encode('utf-8'))

    def do_POST(self):
        print("--- do_POST method in api/parse.py called (v3) ---")
        
        if not PARSER_AVAILABLE:
            print("--- ERROR: bt_parser.parse_statement not available due to import error (v3). ---")
            self._send_json_response(500, {
                'error': "Server configuration error: Parser module failed to load.",
                'trace': "ImportError for bt_parser. Check Vercel function logs."
            })
            return
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            print("--- Received POST data (v3) ---")

            if 'file' not in data:
                print("--- Error: 'file' key not in POST data (v3) ---")
                self._send_json_response(400, {'error': "Missing 'file' in request body"})
                return

            pdf_bytes = base64.b64decode(data['file'])
            print(f"--- Decoded PDF bytes, length: {len(pdf_bytes)} (v3) ---")

            # Call the parser
            txns = parse_statement(pdf_bytes) # This should return a list
            
            if txns is None: # Should not happen if bt_parser is robust, but good to check
                print("--- WARNING: parse_statement returned None. Sending empty list. (v3) ---")
                txns = []

            print(f"--- parse_statement returned {len(txns)} transactions (v3) ---")
            
            # Prepare transactions for JSON response
            txns_list_for_json = []
            for t in txns:
                txns_list_for_json.append({
                    'date': t.date.isoformat(),
                    'description': t.description,
                    'vendor': t.vendor,
                    'amount': str(t.amount),
                    'currency': t.currency,
                    'debit': str(t.debit),
                    'credit': str(t.credit),
                    'amount_ron': str(t.amount_ron) if t.amount_ron is not None else None,
                    'rrn': t.rrn
                })
            
            self._send_json_response(200, {'transactions': txns_list_for_json})
            print("--- Successfully sent 200 response with transactions (v3) ---")
            
        except json.JSONDecodeError as je:
            error_message = f"JSON Decode Error: {str(je)}"
            error_trace = traceback.format_exc()
            print(f"--- ERROR in do_POST (v3): {error_message} ---")
            print(error_trace)
            self._send_json_response(400, {'error': error_message, 'trace': error_trace})

        except base64.binascii.Error as b64e:
            error_message = f"Base64 Decode Error: {str(b64e)}"
            error_trace = traceback.format_exc()
            print(f"--- ERROR in do_POST (v3): {error_message} ---")
            print(error_trace)
            self._send_json_response(400, {'error': error_message, 'trace': error_trace})

        except Exception as e:
            error_message = str(e)
            error_trace = traceback.format_exc()
            print(f"--- ERROR in do_POST (v3): {error_message} ---")
            print(error_trace)
            self._send_json_response(500, {'error': error_message, 'trace': error_trace})
    
    def do_OPTIONS(self):
        print("--- do_OPTIONS method in api/parse.py called (v3) ---")
        self._send_json_response(200, {'message': 'OPTIONS request successful'})
        print("--- Successfully sent 200 response for OPTIONS request (v3) ---") 