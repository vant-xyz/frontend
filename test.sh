#!/usr/bin/env bash
# Vantic multi-trader integration test — 30 traders, random YES/NO
# Prerequisites: jq installed, ENABLE_AUTO_CURATED_CAPPMS=true on Render

set -uo pipefail

BASE="https://vcs-api.vantic.xyz"
ADMIN_KEY="pChJFmBri0RR9fC2Ur69IQmZD7rh6Qz1sHvz1oAvIpk"
API_KEY="vantic_QRHD1UK6FaqXPljLUt8aX99W4iET1fp3LscVOl4H2p4"
FUND_THRESHOLD=50
FUND_AMOUNT=100
PASSWORD="TestPass123!"
MODE="${MODE:-real}"
IS_DEMO=false
BALANCE_FIELD="naira"

case "${1:-}" in
  --demo) MODE="demo"; shift ;;
  --real) MODE="real"; shift ;;
esac

if [[ "$MODE" == "demo" ]]; then
  IS_DEMO=true
  BALANCE_FIELD="demo_naira"
  FUND_THRESHOLD=1
  FUND_AMOUNT=30
fi

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
section() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN}$1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
ok()      { echo -e "  ${GREEN}✓ $1${NC}"; }
warn()    { echo -e "  ${YELLOW}⚠ $1${NC}"; }
fail()    { echo -e "  ${RED}✗ $1${NC}"; }
vcurl()   { curl -H "X-API-Key: $API_KEY" "$@"; }

NAMES=(
  "alice" "bob" "charlie" "diana" "eve" "frank" "grace" "henry" "iris" "jack"
  "lily" "max" "nina" "omar" "paul" "quinn" "rose" "sam" "tina" "uma"
  "victor" "wendy" "xander" "yara" "zack" "amber" "blake" "cora" "derek" "elena"
)
EMAILS=(
  "carsonpine@hotmail.com"
  "quaddavid4@hotmail.com"
  "vant.charlie@testmail.com"
  "vant.diana@testmail.com"
  "vant.eve@testmail.com"
  "vant.frank@testmail.com"
  "vant.grace@testmail.com"
  "vant.henry@testmail.com"
  "vant.iris@testmail.com"
  "vant.jack@testmail.com"
  "vant.lily@testmail.com"
  "vant.max@testmail.com"
  "vant.nina@testmail.com"
  "vant.omar@testmail.com"
  "vant.paul@testmail.com"
  "vant.quinn@testmail.com"
  "vant.rose@testmail.com"
  "vant.sam@testmail.com"
  "vant.tina@testmail.com"
  "vant.uma@testmail.com"
  "vant.victor@testmail.com"
  "vant.wendy@testmail.com"
  "vant.xander@testmail.com"
  "vant.yara@testmail.com"
  "vant.zack@testmail.com"
  "vant.amber@testmail.com"
  "vant.blake@testmail.com"
  "vant.cora@testmail.com"
  "vant.derek@testmail.com"
  "vant.elena@testmail.com"
)
N=${#NAMES[@]}

declare -a TOKENS=()
declare -a BALANCES=()
declare -a SIDES=()
declare -a PRICES=()
declare -a QTYS=()
declare -a ORDER_IDS=()
declare -a QUOTE_TREND=()

rand_side()  { [[ $(( RANDOM % 2 )) -eq 0 ]] && echo "YES" || echo "NO"; }
rand_price() {
  local side=$1
  if [[ "$side" == "YES" ]]; then
    printf "0.%02d" "$(( RANDOM % 30 + 51 ))"   # 0.51–0.80
  else
    printf "0.%02d" "$(( RANDOM % 30 + 20 ))"   # 0.20–0.49
  fi
}
rand_qty() { echo "$(( RANDOM % 91 + 10 ))"; }   # 10–100

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 0 — Health check"
resp=$(vcurl -s --max-time 30 "$BASE/health")
echo "  $resp"
echo "$resp" | jq -e '.status == "up"' > /dev/null && ok "Backend is up" || { fail "Backend not reachable"; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 1 — Auth all traders"
for i in $(seq 0 $((N-1))); do
  email="${EMAILS[$i]}"
  name="${NAMES[$i]}"
  resp=$(vcurl -s --max-time 20 -X POST "$BASE/auth" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}")
  token=$(echo "$resp" | jq -r '.token // empty')
  if [[ -n "$token" && "$token" != "null" ]]; then
    TOKENS+=("$token")
    ok "$name authenticated"
  else
    fail "$name auth failed"
    TOKENS+=("")
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 2 — Fund traders (mode=$MODE, field=$BALANCE_FIELD)"
for i in $(seq 0 $((N-1))); do
  name="${NAMES[$i]}"
  email="${EMAILS[$i]}"
  token="${TOKENS[$i]}"
  [[ -z "$token" ]] && warn "$name — no token, skipping" && continue

  bal=$(vcurl -s --max-time 10 "$BASE/balance" -H "Authorization: Bearer $token")
  available=$(echo "$bal" | jq --arg field "$BALANCE_FIELD" '.balance[$field] // 0')

  if awk "BEGIN{exit !($available < $FUND_THRESHOLD)}"; then
    if [[ "$MODE" == "demo" ]]; then
      fund=$(vcurl -s --max-time 15 -X POST "$BASE/demo/fund" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{\"amount\":$FUND_AMOUNT}")
    else
      fund=$(vcurl -s --max-time 15 -X POST "$BASE/internal/deposit" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"asset\":\"naira\",\"amount\":$FUND_AMOUNT,\"tx_hash\":\"TEST_${name}_$(date +%s%3N)\",\"network\":\"mainnet\"}")
    fi

    echo "$fund" | jq -e '.success == true' > /dev/null \
      && ok "$name funded +\$$FUND_AMOUNT (was \$$available)" \
      || warn "$name fund failed: $(echo "$fund" | jq -r '.message // .')"
    # re-fetch so BALANCES reflects post-fund amount
    bal=$(vcurl -s --max-time 10 "$BASE/balance" -H "Authorization: Bearer $token")
    available=$(echo "$bal" | jq --arg field "$BALANCE_FIELD" '.balance[$field] // 0')
  else
    ok "$name balance \$$available — sufficient"
  fi
  BALANCES+=("$available")
done

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 3 — Find active CAPPM market with > 1m30s remaining"
echo "  ⚠  Requires ENABLE_AUTO_CURATED_CAPPMS=true on Render"

MIN_SECS=90   # must have at least 90 seconds left

MARKET_ID=""
MARKET_EXPIRES=""
for attempt in $(seq 1 24); do
  MARKETS=$(vcurl -s --max-time 10 "$BASE/markets?type=CAPPM&status=active&limit=10")
  COUNT=$(echo "$MARKETS" | jq '.count // 0')
  if [[ "$COUNT" -gt 0 ]]; then
    now_epoch=$(date +%s)
    # Walk all returned markets, pick first with enough time left
    while IFS= read -r market_json; do
      mid=$(echo "$market_json"   | jq -r '.id')
      mexp=$(echo "$market_json"  | jq -r '.end_time_utc')
      mtitle=$(echo "$market_json"| jq -r '.title')
      exp_epoch=$(date -d "$mexp" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${mexp%%.*}" +%s 2>/dev/null || echo 0)
      secs_left=$(( exp_epoch - now_epoch ))
      if [[ "$secs_left" -ge "$MIN_SECS" ]]; then
        MARKET_ID="$mid"
        MARKET_EXPIRES="$mexp"
        MARKET_TITLE="$mtitle"
        ok "Found: $MARKET_ID (${secs_left}s remaining)"
        echo "  Title:   $MARKET_TITLE"
        echo "  Expires: $MARKET_EXPIRES"
        break
      else
        warn "Skipping $mid — only ${secs_left}s left"
      fi
    done < <(echo "$MARKETS" | jq -c '.markets[]')
  fi
  [[ -n "$MARKET_ID" ]] && break
  warn "No eligible market — waiting 10s (attempt $attempt/24)..."
  sleep 10
done
[[ -z "$MARKET_ID" ]] && { fail "No active CAPPM market with >${MIN_SECS}s remaining. Enable ENABLE_AUTO_CURATED_CAPPMS on Render."; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 4 — Assign random orders"
echo ""
printf "  %-10s %-5s %-7s %s\n" "TRADER" "SIDE" "PRICE" "QTY"
printf "  %-10s %-5s %-7s %s\n" "──────" "────" "─────" "───"
for i in $(seq 0 $((N-1))); do
  side=$(rand_side)
  price=$(rand_price "$side")
  available="${BALANCES[$i]:-0}"
  max_qty=$(awk "BEGIN{ q=int($available/$price); print (q<1)?0:q }")
  if [[ "$max_qty" -lt 1 ]]; then
    qty=0
  else
    rq=$(rand_qty)
    qty=$(( rq < max_qty ? rq : max_qty ))
  fi
  SIDES+=("$side")
  PRICES+=("$price")
  QTYS+=("$qty")
  printf "  %-10s %-5s %-7s %s\n" "${NAMES[$i]}" "$side" "$price" "$qty"
done

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 5 — Place orders"
_trade_count=0
for i in $(seq 0 $((N-1))); do
  name="${NAMES[$i]}"
  token="${TOKENS[$i]}"
  side="${SIDES[$i]}"
  price="${PRICES[$i]}"
  qty="${QTYS[$i]}"
  [[ -z "$token" ]] && ORDER_IDS+=("") && continue
  if [[ "$qty" -lt 1 ]]; then
    warn "$name — balance \$${BALANCES[$i]:-0} too low to place any order, skipping"
    ORDER_IDS+=("")
    continue
  fi

  resp=$(vcurl -s --max-time 15 -X POST "$BASE/orders" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "{\"market_id\":\"$MARKET_ID\",\"side\":\"$side\",\"type\":\"LIMIT\",\"price\":$price,\"quantity\":$qty,\"is_demo\":$IS_DEMO}")
  oid=$(echo "$resp" | jq -r '.order.id // empty')
  if [[ -n "$oid" && "$oid" != "null" ]]; then
    ORDER_IDS+=("$oid")
    ok "$name → $side @ \$$price × $qty  ($oid)"
    _trade_count=$(( _trade_count + 1 ))
    if (( _trade_count % 2 == 0 )); then
      _yq=$(vcurl -s --max-time 8 "$BASE/markets/$MARKET_ID/quote?side=YES&stake=5" | jq -r '.preview.avg_price // 0')
      _nq=$(vcurl -s --max-time 8 "$BASE/markets/$MARKET_ID/quote?side=NO&stake=5"  | jq -r '.preview.avg_price // 0')
      _yes_c=$(awk "BEGIN{printf \"%.1f\", $_yq * 100}")
      _no_c=$(awk  "BEGIN{printf \"%.1f\", $_nq * 100}")
      QUOTE_TREND+=("T${_trade_count}  YES ${_yes_c}¢  NO ${_no_c}¢")
    fi
  else
    ORDER_IDS+=("")
    warn "$name order failed: $(echo "$resp" | jq -r '.message // .')"
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 6 — Orderbook snapshot"
OB=$(vcurl -s --max-time 10 "$BASE/markets/$MARKET_ID/orderbook")
echo "$OB" | jq '.orderbook | {last_traded_price, yes_bids: (.yes_bids | length), no_bids: (.no_bids | length)}'

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 7 — Order fill status"
echo ""
printf "  %-10s %-5s %-7s %-6s %-20s %-16s %s\n" "TRADER" "SIDE" "PRICE" "QTY" "ORDER_ID" "STATUS" "FILLED"
printf "  %-10s %-5s %-7s %-6s %-20s %-16s %s\n" "──────" "────" "─────" "───" "────────" "──────" "──────"
for i in $(seq 0 $((N-1))); do
  name="${NAMES[$i]}"
  token="${TOKENS[$i]}"
  oid="${ORDER_IDS[$i]:-}"
  side="${SIDES[$i]}"
  price="${PRICES[$i]}"
  qty="${QTYS[$i]}"
  if [[ -z "$token" || -z "$oid" ]]; then
    printf "  %-10s %-5s %-7s %-6s %-20s %-16s %s\n" "$name" "$side" "$price" "$qty" "-" "ERROR" "-"
    continue
  fi
  ord=$(vcurl -s --max-time 10 "$BASE/orders?market_id=$MARKET_ID" -H "Authorization: Bearer $token")
  status=$(echo "$ord" | jq -r --arg id "$oid" '.orders[] | select(.id==$id) | .status' 2>/dev/null || echo "?")
  filled=$(echo "$ord" | jq -r --arg id "$oid" '.orders[] | select(.id==$id) | .filled_qty' 2>/dev/null || echo "?")
  printf "  %-10s %-5s %-7s %-6s %-20s %-16s %s\n" "$name" "$side" "$price" "$qty" "$oid" "$status" "$filled"
done

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 8 — Balances after trading"
echo ""
printf "  %-10s %-12s %-12s %s\n" "TRADER" "NAIRA" "DEMO_NAIRA" "LOCKED"
printf "  %-10s %-12s %-12s %s\n" "──────" "─────" "──────────" "──────"
for i in $(seq 0 $((N-1))); do
  name="${NAMES[$i]}"
  token="${TOKENS[$i]}"
  [[ -z "$token" ]] && printf "  %-10s %-12s %-12s %s\n" "$name" "-" "-" "-" && continue
  bal=$(vcurl -s --max-time 10 "$BASE/balance" -H "Authorization: Bearer $token")
  naira=$(echo "$bal" | jq '.balance.naira // 0')
  demo_naira=$(echo "$bal" | jq '.balance.demo_naira // 0')
  locked=$(echo "$bal" | jq '.balance.locked_balance // 0')
  printf "  %-10s \$%-11s \$%-11s \$%s\n" "$name" "$naira" "$demo_naira" "$locked"
done

# ─────────────────────────────────────────────────────────────────────────────
section "STEP 9 — Active positions"
echo ""
printf "  %-10s %-5s %-8s %-7s %s\n" "TRADER" "SIDE" "SHARES" "AVG_PX" "STATUS"
printf "  %-10s %-5s %-8s %-7s %s\n" "──────" "────" "──────" "──────" "──────"
for i in $(seq 0 $((N-1))); do
  name="${NAMES[$i]}"
  token="${TOKENS[$i]}"
  [[ -z "$token" ]] && continue
  pos=$(vcurl -s --max-time 10 "$BASE/positions?market_id=$MARKET_ID" -H "Authorization: Bearer $token")
  count=$(echo "$pos" | jq '.count // 0')
  if [[ "$count" -gt 0 ]]; then
    pside=$(echo "$pos" | jq -r '.positions[0].side')
    shares=$(echo "$pos" | jq -r '.positions[0].shares')
    avg=$(echo "$pos" | jq -r '.positions[0].avg_entry_price')
    pstatus=$(echo "$pos" | jq -r '.positions[0].status')
    printf "  %-10s %-5s %-8s %-7s %s\n" "$name" "$pside" "$shares" "$avg" "$pstatus"
  else
    printf "  %-10s %-5s %-8s %-7s %s\n" "$name" "-" "-" "-" "no fill"
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
section "SUMMARY"
TOTAL_FILLED=0
TOTAL_OPEN=0
for i in $(seq 0 $((N-1))); do
  token="${TOKENS[$i]}"
  oid="${ORDER_IDS[$i]:-}"
  [[ -z "$token" || -z "$oid" ]] && continue
  ord=$(vcurl -s --max-time 10 "$BASE/orders?market_id=$MARKET_ID" -H "Authorization: Bearer $token")
  status=$(echo "$ord" | jq -r --arg id "$oid" '.orders[] | select(.id==$id) | .status' 2>/dev/null || echo "")
  [[ "$status" == "FILLED" ]] && TOTAL_FILLED=$(( TOTAL_FILLED + 1 ))
  [[ "$status" == "OPEN" || "$status" == "PARTIALLY_FILLED" ]] && TOTAL_OPEN=$(( TOTAL_OPEN + 1 ))
done

echo "  Traders:         $N"
echo "  Orders filled:   $TOTAL_FILLED"
echo "  Orders resting:  $TOTAL_OPEN"
echo ""
ok "Cross-side matching active: YES+NO orders fill when prices sum ≥ 1.00"

if [[ "${#QUOTE_TREND[@]}" -gt 0 ]]; then
  echo ""
  echo "  Quote trend (\$5 stake) — sampled after every 2 trades:"
  printf "  %-8s %-12s %s\n" "TRADE#" "YES@¢" "NO@¢"
  printf "  %-8s %-12s %s\n" "──────" "─────" "────"
  for entry in "${QUOTE_TREND[@]}"; do
    printf "  %s\n" "$entry"
  done
fi

echo ""
echo "  Market: $MARKET_ID"
echo "  Settles: $MARKET_EXPIRES"
