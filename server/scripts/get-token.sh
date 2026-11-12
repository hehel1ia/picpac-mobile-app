set -a; source "$(dirname "$0")/../.env"; set +a
curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).access_token'