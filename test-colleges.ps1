# ═══════════════════════════════════════════════════════════
#  PowerShell cURL Test Commands — College Discovery API
# ═══════════════════════════════════════════════════════════
#  Pre-requisite: Server running → cd backend; npm start
#  Run these commands one-by-one in a SECOND terminal.
# ═══════════════════════════════════════════════════════════

$BASE = "http://localhost:5000/api/v1"

# ─── 1. Health Check ─────────────────────────────────────
Write-Host "`n═══ 1. HEALTH CHECK ═══" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/health" | ConvertTo-Json -Depth 5

# ─── 2. List All Colleges ────────────────────────────────
Write-Host "`n═══ 2. LIST ALL COLLEGES ═══" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/colleges" | ConvertTo-Json -Depth 5

# ─── 3. Search Colleges ──────────────────────────────────
Write-Host "`n═══ 3. SEARCH COLLEGES (Delhi) ═══" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BASE/colleges?search=Delhi&page=1&limit=5" | ConvertTo-Json -Depth 5

# ─── 4. Get Single College ───────────────────────────────
# Replace <UUID> with an actual college ID from step 2
# Invoke-RestMethod -Uri "$BASE/colleges/<UUID>" | ConvertTo-Json -Depth 5

# ─── 5. Create College (Admin JWT Required) ──────────────
# Replace <ADMIN_JWT> with a valid Supabase admin JWT token
#
# $headers = @{
#   "Content-Type"  = "application/json"
#   "Authorization" = "Bearer <ADMIN_JWT>"
# }
# $body = @{
#   name             = "Test University"
#   description      = "A test college for API verification"
#   city             = "Mumbai"
#   state            = "Maharashtra"
#   type             = "Private"
#   established_year = 2020
#   rating           = 4.5
#   is_featured      = $true
# } | ConvertTo-Json
#
# Invoke-RestMethod -Method POST -Uri "$BASE/colleges" -Headers $headers -Body $body | ConvertTo-Json -Depth 5

# ─── 6. Update College (Admin JWT Required) ──────────────
# $body = @{ rating = 4.8; is_featured = $false } | ConvertTo-Json
# Invoke-RestMethod -Method PUT -Uri "$BASE/colleges/<UUID>" -Headers $headers -Body $body | ConvertTo-Json -Depth 5

# ─── 7. Delete College (Admin JWT Required) ──────────────
# Invoke-RestMethod -Method DELETE -Uri "$BASE/colleges/<UUID>" -Headers $headers | ConvertTo-Json -Depth 5

# ─── 8. Scrape & Create (Admin JWT Required) ──────────────
# $scrapeBody = @{ target_url = "https://www.amity.edu" } | ConvertTo-Json
# Invoke-RestMethod -Method POST -Uri "$BASE/colleges/scrape-and-create" -Headers $headers -Body $scrapeBody -TimeoutSec 60 | ConvertTo-Json -Depth 5

Write-Host "`n═══ DONE — Public endpoints tested. ═══" -ForegroundColor Green
Write-Host "Uncomment lines 27-46 after you have an admin JWT to test write operations.`n"
