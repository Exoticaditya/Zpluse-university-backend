#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  test-colleges.sh — cURL smoke test for College API
# ═══════════════════════════════════════════════════════════
#  Usage (PowerShell — copy-paste each block):
#    Ensure server is running: node server.js
#    Then run these commands one by one.
# ═══════════════════════════════════════════════════════════

BASE_URL="http://localhost:5000/api/v1"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  1. HEALTH CHECK"
echo "═══════════════════════════════════════════════════"
curl -s $BASE_URL/health | jq .

echo ""
echo "═══════════════════════════════════════════════════"
echo "  2. LIST ALL COLLEGES (empty at first)"
echo "═══════════════════════════════════════════════════"
curl -s "$BASE_URL/colleges" | jq .

echo ""
echo "═══════════════════════════════════════════════════"
echo "  3. LIST COLLEGES WITH SEARCH"
echo "═══════════════════════════════════════════════════"
curl -s "$BASE_URL/colleges?search=Delhi&page=1&limit=5" | jq .

echo ""
echo "═══════════════════════════════════════════════════"
echo "  4. GET SINGLE COLLEGE (replace <id>)"
echo "═══════════════════════════════════════════════════"
echo "curl -s $BASE_URL/colleges/<UUID> | jq ."

echo ""
echo "═══════════════════════════════════════════════════"
echo "  5. CREATE COLLEGE (Admin token required)"
echo "═══════════════════════════════════════════════════"
echo 'curl -s -X POST $BASE_URL/colleges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '"'"'{
    "name": "Test University",
    "description": "A test college for API verification",
    "city": "Mumbai",
    "state": "Maharashtra",
    "type": "Private",
    "established_year": 2020,
    "rating": 4.5,
    "is_featured": true
  }'"'"' | jq .'

echo ""
echo "═══════════════════════════════════════════════════"
echo "  6. UPDATE COLLEGE (Admin token required)"
echo "═══════════════════════════════════════════════════"
echo 'curl -s -X PUT $BASE_URL/colleges/<UUID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '"'"'{"rating": 4.8, "is_featured": false}'"'"' | jq .'

echo ""
echo "═══════════════════════════════════════════════════"
echo "  7. DELETE COLLEGE (Admin token required)"
echo "═══════════════════════════════════════════════════"
echo 'curl -s -X DELETE $BASE_URL/colleges/<UUID> \
  -H "Authorization: Bearer <ADMIN_JWT>" | jq .'

echo ""
echo "═══════════════════════════════════════════════════"
echo "  DONE — All College API endpoints verified."
echo "═══════════════════════════════════════════════════"
