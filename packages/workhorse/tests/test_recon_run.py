"""Tests for the reconciliation run handler."""

from settler_workhorse.handlers.recon_run import _records_match


def test_records_match_date_tolerance():
    """Test date tolerance logic in _records_match."""
    # 1. Exact string match
    src = {"date": "2024-01-01"}
    tgt = {"date": "2024-01-01"}
    assert _records_match(src, tgt) is True

    # 2. No tolerance, strings differ
    src = {"date": "2024-01-01"}
    tgt = {"date": "2024-01-02"}
    assert _records_match(src, tgt) is False

    # 3. With tolerance, within range
    opts = {"date_tolerance_days": 2}
    src = {"date": "2024-01-01"}
    tgt = {"date": "2024-01-03"}
    assert _records_match(src, tgt, options=opts) is True

    # 4. With tolerance, exact boundary
    src = {"date": "2024-01-01"}
    tgt = {"date": "2024-01-03"}
    assert _records_match(src, tgt, options=opts) is True

    # 5. With tolerance, outside range
    src = {"date": "2024-01-01"}
    tgt = {"date": "2024-01-04"}
    assert _records_match(src, tgt, options=opts) is False

    # 6. Unparseable dates
    src = {"date": "not-a-date"}
    tgt = {"date": "also-not-a-date"}
    assert _records_match(src, tgt, options=opts) is False

    # 7. Fuzzy matching success
    src = {"date": "Jan 1, 2024"}
    tgt = {"date": "2024/01/02"}
    opts = {"date_tolerance_days": 1}
    assert _records_match(src, tgt, options=opts) is True
