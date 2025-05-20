print("--- api/parse.py TOP LEVEL PRINT (vercel-debug-v5) ---") # VERY FIRST LINE

from http.server import BaseHTTPRequestHandler
import json
import traceback

print("--- api/parse.py SIMPLIFIED module loaded (vercel-debug-v5) ---")

class Handler(BaseHTTPRequestHandler):
    def _send_json_response(self, status_code, data_dict):
        try:
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(data_dict).encode('utf-8'))
            print(f"--- SIMPLIFIED (v5): Sent {status_code} with data: {data_dict} ---")
        except Exception as e_send:
            print(f"--- SIMPLIFIED (v5): CRITICAL ERROR sending response: {e_send} ---")
            print(traceback.format_exc())

    def do_POST(self):
        print("--- SIMPLIFIED (v5): do_POST method in api/parse.py called ---")
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data_raw = "No data read"
            if content_length > 0:
                post_data_bytes = self.rfile.read(content_length)
                post_data_raw = post_data_bytes.decode('utf-8', errors='replace')
                print(f"--- SIMPLIFIED (v5): Received raw POST data (first 500 chars): {post_data_raw[:500]} ---")
            else:
                print("--- SIMPLIFIED (v5): No Content-Length or it was 0. ---")

            response_data = {
                'message': 'Simplified API parse v5 received POST',
                'data_preview': post_data_raw[:100],
                'transactions': [
                    {
                        'date': '2024-01-01T00:00:00Z',
                        'description': 'Test v5 from simplified Vercel endpoint',
                        'vendor': 'Vercel Test v5',
                        'amount': '100.00',
                        'currency': 'RON',
                        'debit': '100.00',
                        'credit': '0',
                        'amount_ron': '100.00',
                        'rrn': 'SIMPLETESTV5'
                    }
                ]
            }
            self._send_json_response(200, response_data)
            
        except Exception as e_main:
            print(f"--- SIMPLIFIED (v5): ERROR in do_POST: {e_main} ---")
            print(traceback.format_exc())
            try:
                self._send_json_response(500, {
                    'error': f'Simplified API Error v5: {str(e_main)}',
                    'trace': traceback.format_exc()
                })
            except Exception as e_final_error:
                 print(f"--- SIMPLIFIED (v5): CRITICAL ERROR sending error response: {e_final_error} ---")
                 print(traceback.format_exc())

    def do_OPTIONS(self):
        print("--- SIMPLIFIED (v5): do_OPTIONS method in api/parse.py called ---")
        self._send_json_response(200, {'message': 'OPTIONS request successful for simplified API v5'}) 