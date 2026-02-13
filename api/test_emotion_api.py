#!/usr/bin/env python
"""Test script for api/analyze-emotion.py"""
import importlib.util

# Load the module dynamically (handles hyphen in filename)
spec = importlib.util.spec_from_file_location("analyze_emotion", "api/analyze-emotion.py")
analyze_emotion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyze_emotion)

analyze_frame_simple = analyze_emotion.analyze_frame_simple

# Test 1: Valid session ID
result = analyze_frame_simple('dGVzdA==', '550e8400-e29b-41d4-a716-446655440000')
with open('test_output.txt', 'w') as f:
    f.write('Test 1 - Valid session: ' + ('PASSED' if result['status'] == 'success' else 'FAILED') + '\n')
    f.write('  Status: ' + result['status'] + '\n')
    f.write('  Emotion: ' + result.get('emotion', 'N/A') + '\n')
    f.write('  Face detected: ' + str(result.get('face_detected', 'N/A')) + '\n\n')

    # Test 2: Invalid session ID
    result2 = analyze_frame_simple('dGVzdA==', 'invalid-uuid')
    f.write('Test 2 - Invalid session: ' + ('PASSED' if result2.get('error') == 'INVALID_SESSION_ID' else 'FAILED') + '\n')
    f.write('  Error: ' + result2.get('error', 'N/A') + '\n')

print("Tests completed. Results written to test_output.txt")
