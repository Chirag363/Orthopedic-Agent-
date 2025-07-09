import requests
import os
import sys

# Test script to diagnose PDF generation endpoint
BACKEND_URL = "http://127.0.0.1:5000"  # Change this if your server runs on a different address

def test_pdf_download():
    """Test the PDF download endpoint with a sample markdown content"""
    sample_markdown = """
# Fracture Analysis Report

## Severity Assessment
Mild Fracture Detected

## Urgency Level
Schedule a doctor's appointment.

## Recommendations
- Avoid putting weight on the affected area
- Use ice packs to reduce swelling
- Take over-the-counter pain relievers if necessary

## Treatment Complexity
Moderate
    """
    
    # Create a form data object
    data = {'report_md': sample_markdown}
    
    # Make a request to the PDF download endpoint
    print("\n1. Sending request to", f"{BACKEND_URL}/download_pdf")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/download_pdf", 
            data=data,
            headers={'Accept': 'application/pdf'},
            timeout=10
        )
        
        # Check the response
        print(f"2. Status code: {response.status_code}")
        print(f"3. Content type: {response.headers.get('Content-Type', 'None')}")
        print(f"4. Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            # Check if it's actually a PDF
            content_type = response.headers.get('Content-Type', '')
            if 'application/pdf' in content_type:
                # Save the PDF to a file
                with open("test_report.pdf", "wb") as f:
                    f.write(response.content)
                print(f"\n✅ SUCCESS: PDF saved to {os.path.abspath('test_report.pdf')}")
                return True
            else:
                print(f"\n❌ ERROR: Expected PDF but got {content_type}")
                print(f"First 100 chars of response: {response.text[:100]}")
        else:
            print(f"\n❌ ERROR: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ CONNECTION ERROR: {e}")
        return False
        
    return False

if __name__ == "__main__":
    print("\n🔍 Testing PDF download functionality...")
    success = test_pdf_download()
    print("\n" + ("✅ Test PASSED" if success else "❌ Test FAILED"))
    sys.exit(0 if success else 1) 