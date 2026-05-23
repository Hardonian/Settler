import pytest
from settler_workhorse.handlers.recon_run import _records_match

def test_records_match_dates():
    # Exact match
    assert _records_match(
        {"date": "2024-01-01"},
        {"date": "2024-01-01"}
    ) == True

    # Different dates, no tolerance
    assert _records_match(
        {"date": "2024-01-01"},
        {"date": "2024-01-02"}
    ) == False

    # Different dates, within tolerance
    assert _records_match(
        {"date": "2024-01-01"},
        {"date": "2024-01-02"},
        options={"date_tolerance_days": 1}
    ) == True

    assert _records_match(
        {"date": "2024-01-01T10:00:00Z"},
        {"date": "2024-01-03T15:00:00Z"},
        options={"date_tolerance_days": 2}
    ) == True

    # Different dates, outside tolerance
    assert _records_match(
        {"date": "2024-01-01"},
        {"date": "2024-01-05"},
        options={"date_tolerance_days": 2}
    ) == False

    # Unparseable date
    assert _records_match(
        {"date": "2024-01-01"},
        {"date": "invalid-date"},
        options={"date_tolerance_days": 2}
    ) == False
