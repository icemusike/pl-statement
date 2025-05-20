from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
import re
import io
from typing import List, Optional
import pdfplumber

@dataclass
class Transaction:
    date: datetime
    description: str
    vendor: Optional[str]
    amount: Decimal
    currency: str
    debit: Decimal
    credit: Decimal
    amount_ron: Optional[Decimal]
    rrn: Optional[str]

def normalize_decimal(value: str) -> Decimal:
    """Normalize decimal string to Decimal object."""
    # Replace thousand separators and convert decimal comma to point
    value = re.sub(r'\.(?=\d{3})', '', value)  # Remove dot thousand separators
    value = value.replace(',', '.')  # Replace decimal comma with dot
    return Decimal(value)

def parse_statement(pdf_bytes: bytes) -> List[Transaction]:
    """Parse a Banca Transilvania PDF statement and extract transactions."""
    transactions = []
    
    # Regular expressions
    DATE_RX = re.compile(r'^\d{2}/\d{2}/\d{4}')
    AMT_LINE_RX = re.compile(r'valoare tranzactie:\s*([\d.,]+)\s*([A-Z]{3})', re.I)
    COL_VALUE_RX = re.compile(r'^\s*([\d.,]+)\s*$')
    RON_RX = re.compile(r'ECHIVALENT\s+LEI\s*([\d.,]+)', re.I)
    RRN_RX = re.compile(r'RRN[:\s]+(\d+)', re.I)
    REF_RX = re.compile(r'REF[:\s]+(\w+)', re.I)
    VENDOR_RX = re.compile(r'TID:[^\s]+\s+([A-Z0-9*./ \\-]{2,60})')
    CREDIT_KEYS = ['incasare', 'transfer intern', 'alimentare cont']
    
    # Skip keywords for summary lines
    SUMMARY_KEYWORDS = ['RULAJ', 'SOLD', 'TOTAL']
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
            
            # Split into blocks by double newlines
            blocks = re.split(r'\n\s*\n', full_text)
            
            for block in blocks:
                lines = block.strip().split('\n')
                if not lines:
                    continue
                
                # Check if the first line is a date
                if not DATE_RX.match(lines[0]):
                    continue
                
                # Skip summary lines
                if any(keyword in block.upper() for keyword in SUMMARY_KEYWORDS):
                    continue
                
                try:
                    # Extract date
                    date_str = lines[0][:10]  # Extract DD/MM/YYYY
                    date = datetime.strptime(date_str, '%d/%m/%Y')
                    
                    # Extract transaction amount and currency
                    amount_match = AMT_LINE_RX.search(block)
                    amount = Decimal('0')
                    currency = 'RON'  # Default
                    
                    if amount_match:
                        amount = normalize_decimal(amount_match.group(1))
                        currency = amount_match.group(2)
                    else:
                        # Try to find a standalone value (debit/credit column)
                        for line in lines:
                            col_match = COL_VALUE_RX.match(line)
                            if col_match:
                                amount = normalize_decimal(col_match.group(1))
                                break
                    
                    # Determine if credit or debit
                    is_credit = any(k in block.lower() for k in CREDIT_KEYS)
                    debit = Decimal('0') if is_credit else amount
                    credit = amount if is_credit else Decimal('0')
                    
                    # Extract RON equivalent
                    amount_ron = None
                    ron_match = RON_RX.search(block)
                    if ron_match:
                        amount_ron = normalize_decimal(ron_match.group(1))
                    
                    # Extract RRN
                    rrn = None
                    rrn_match = RRN_RX.search(block)
                    if rrn_match:
                        rrn = rrn_match.group(1)
                    else:
                        ref_match = REF_RX.search(block)
                        if ref_match:
                            rrn = ref_match.group(1)
                    
                    # Extract vendor
                    vendor = None
                    vendor_match = VENDOR_RX.search(block)
                    if vendor_match:
                        vendor = vendor_match.group(1).strip()
                    else:
                        # Try to extract vendor from capitalized words
                        caps_words = re.findall(r'\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b', block)
                        if caps_words:
                            vendor = caps_words[0]
                    
                    # Create transaction
                    transaction = Transaction(
                        date=date,
                        description=block.replace('\n', ' ').strip(),
                        vendor=vendor,
                        amount=amount,
                        currency=currency,
                        debit=debit,
                        credit=credit,
                        amount_ron=amount_ron,
                        rrn=rrn
                    )
                    
                    transactions.append(transaction)
                except Exception as e:
                    print(f"Failed to parse block: {e}")
                    continue
    except Exception as e:
        print(f"Failed to process PDF: {e}")
    
    # Sort by date
    transactions.sort(key=lambda t: t.date)
    
    return transactions 