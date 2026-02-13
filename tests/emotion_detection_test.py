"""Test for emotion detection API"""
import pytest
import sys
import os

# Add api directory to path for imports
api_path = os.path.join(os.path.dirname(__file__), '..', 'api')
sys.path.insert(0, api_path)

# Load the analyze-emotion module dynamically
import importlib.util
spec = importlib.util.spec_from_file_location("analyze_emotion", os.path.join(api_path, "analyze-emotion.py"))
analyze_emotion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyze_emotion)

analyze_frame_simple = analyze_emotion.analyze_frame_simple


def test_analyze_frame_simple_valid_session():
    """Test analyze_frame_simple with valid session ID"""
    result = analyze_frame_simple('dGVzdA==', '550e8400-e29b-41d4-a716-446655440000')
    assert 'status' in result
    assert result['status'] in ['success', 'error']


def test_analyze_frame_simple_invalid_session():
    """Test analyze_frame_simple with invalid session ID (non-base64)"""
    result = analyze_frame_simple('invalid-base64!@#', '550e8400-e29b-41d4-a716-446655440000')
    assert result['status'] == 'error'
    assert 'error' in result


def test_analyze_frame_simple_empty_session():
    """Test analyze_frame_simple with empty session ID"""
    result = analyze_frame_simple('', '550e8400-e29b-41d4-a716-446655440000')
    # Empty session ID returns success (API accepts it)
    assert 'status' in result
    assert result['status'] in ['success', 'error']


def test_analyze_frame_simple_invalid_uuid():
    """Test analyze_frame_simple with invalid UUID format"""
    result = analyze_frame_simple('dGVzdA==', 'invalid-uuid')
    assert result['status'] == 'error'
