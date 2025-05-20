import sys
import os
import unittest
from decimal import Decimal
from pathlib import Path

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bt_parser import parse_statement

class BTParserTest(unittest.TestCase):
    def test_parser_with_sample_pdf(self):
        # This test assumes you have a sample PDF file in the tests directory
        sample_pdf_path = Path(__file__).parent / "sample.pdf"
        
        if not sample_pdf_path.exists():
            self.skipTest("Sample PDF not found. Please add sample.pdf to the tests directory.")
        
        with open(sample_pdf_path, "rb") as f:
            pdf_bytes = f.read()
        
        txns = parse_statement(pdf_bytes)
        
        # Test basic properties
        self.assertIsNotNone(txns)
        self.assertEqual(len(txns), 61, "Expected 61 transactions")
        
        # Test totals
        total_debit = sum(t.debit for t in txns)
        total_credit = sum(t.credit for t in txns)
        
        self.assertEqual(total_debit, Decimal('18625.63'), "Total debit should be 18625.63")
        self.assertEqual(total_credit, Decimal('27328.24'), "Total credit should be 27328.24")
        
        # Test a few specific transactions
        if txns:
            # Check that dates are parsed correctly
            self.assertTrue(all(hasattr(t, 'date') and t.date is not None for t in txns))
            
            # Check that amounts are parsed correctly
            self.assertTrue(all(t.debit > 0 or t.credit > 0 for t in txns))
            
            # Check that currency is populated
            self.assertTrue(all(hasattr(t, 'currency') and t.currency for t in txns))

if __name__ == '__main__':
    unittest.main() 