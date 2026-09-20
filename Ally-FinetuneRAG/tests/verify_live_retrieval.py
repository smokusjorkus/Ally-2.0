"""Opt-in read-only integration check; never prints credentials or full case text."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
import main

if __name__ == "__main__":
    try:
        with TestClient(main.app) as client:
            response = client.post('/search', json={
                'query': 'Retrieve Pedro P. Isican v. People, G.R. No. 266431', 'top_k': 3})
            print('HTTP status:', response.status_code)
            response.raise_for_status()
            data = response.json()
            assert 0 < data['count'] <= 3
            assert any('isican' in case['title'].lower() for case in data['cases'])
            assert data['legal_validation_status'] == 'unverified'
            assert not data['can_state_final_outcome']
            assert data['validation_warning'] == main.VALIDATION_WARNING
            print('PASS: Isican retrieved; at most three records; exact warning; outcome unverified.')
            print('Source links present:', [bool(case['source_url']) for case in data['cases']])
    except Exception as error:
        print('Integration failed:', type(error).__name__)
        sys.exit(1)
