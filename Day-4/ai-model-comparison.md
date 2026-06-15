# AI Model Comparison: ChatGPT vs Claude vs Gemini

---

## Prompt 1 — Debugging a Production Memory Crash

**Full Prompt:**
> My Node.js API works fine with 1,000 concurrent users in development, but crashes with an "out of memory" error in production with only 200 users. The server has 8 GB RAM, and monitoring shows the app consuming 6 GB before it crashes. I use **in-memory sessions** (not Redis), **bcrypt with 12 salt rounds** for password hashing, and I **load the full user object into memory on every login**. The app runs as a single process with no clustering. Identify every root cause and give me the exact fixes with code examples.

---

### 🟢 ChatGPT

**Structure:** Numbered list of root causes → Code fixes for each → Summary table

**Root Causes Identified:**
1. **In-memory sessions** — Every session is stored in the Node.js heap. At 200 concurrent users with large session objects, this exhausts RAM rapidly. Development has fewer simultaneous sessions and gets GC'd more aggressively.
2. **bcrypt cost factor 12** — Each bcrypt hash is CPU-blocking and memory-intensive. Under concurrent load, multiple hashing operations stack up and hold memory until resolved.
3. **Loading full user object on login** — If your user document includes profile images (as Buffers), history arrays, or nested relations, this multiplies memory per request.
4. **Single process, no clustering** — One Node.js process is limited to one CPU core and has a default V8 heap of ~1.5 GB (not 8 GB). You're likely hitting the heap limit, not RAM.

**Fixes:**

```js
// Fix 1: Replace in-memory sessions with Redis
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

const redisClient = createClient({ url: 'redis://localhost:6379' });
redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 3600000 }
}));
```

```js
// Fix 2: Lower bcrypt rounds for production speed
const rounds = process.env.NODE_ENV === 'production' ? 10 : 12;
const hash = await bcrypt.hash(password, rounds);
```

```js
// Fix 3: Select only needed fields on login
const user = await User.findById(id).select('name email role createdAt');
```

```bash
# Fix 4: Enable clustering
node --max-old-space-size=4096 server.js
# Or use PM2
pm2 start server.js -i max
```

**Summary Table:**

| Issue | Dev Impact | Prod Impact | Fix |
|---|---|---|---|
| In-memory sessions | Low (few users) | Critical | Use Redis |
| bcrypt rounds=12 | Slow but ok | CPU/mem spike | Lower to 10 |
| Full user object | Negligible | High mem/req | `.select()` |
| Single process | Fine | OOM crash | Cluster/PM2 |

---

### 🟣 Claude 

**Structure:** Narrative analysis with technical depth, then targeted code fixes

The crash pattern you're describing — fine in dev, catastrophic in production at lower user counts — is almost always a combination of memory that doesn't get released and a V8 heap limit you've never explicitly set.

**The real culprit hierarchy:**

The single process issue is the silent killer here. Node.js defaults its V8 heap to around 1.4–1.7 GB regardless of how much RAM your machine has. Your monitoring showing "6 GB usage" is likely measuring RSS (Resident Set Size) which includes shared libraries and OS-mapped memory — the V8 heap itself is probably hitting its ceiling much sooner.

The in-memory session store compounds this. `express-session`'s default `MemoryStore` is explicitly documented as "not designed for production." It holds sessions for their full TTL, never compresses, and has no eviction policy. 200 users × (session size) × (TTL in seconds) = a chunk of heap that never shrinks during peak load.

bcrypt at rounds=12 under concurrency is a secondary issue — it's more about CPU saturation causing the event loop to back up, which means requests queue up, each holding their memory allocation longer than they should.

**Fix order (highest impact first):**

```js
// 1. Set heap size explicitly — add to your start script
// package.json
"scripts": {
  "start": "node --max-old-space-size=4096 server.js"
}
```

```js
// 2. Move sessions to Redis immediately
// This alone will likely solve your crash
const RedisStore = require('connect-redis').default;
const redis = require('redis').createClient();
await redis.connect();

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

```js
// 3. Never load full user objects — build a lightweight auth projection
const user = await User.findById(id)
  .select('_id email role permissions')
  .lean(); // .lean() returns plain JS object, skips Mongoose overhead
```

One thing worth investigating: add `--expose-gc` to your Node flags and use a heap profiler (`node --inspect`) to confirm where memory is being retained. The pattern you describe sounds like it could also involve a closure leak in your session middleware chain.

---

### 🔵 Gemini 

**Structure:** Direct bullet-point causes, concise code fixes

**Root Causes:**

- **MemoryStore for sessions:** Node's built-in session store is a plain JavaScript object that grows unbounded. Every login adds to it; nothing removes entries until TTL expiry.
- **bcrypt rounds=12:** Synchronous-style async hashing at high concurrency holds memory across the await boundary, multiplying allocations.
- **Full user object in memory:** Unnecessary data per request increases heap pressure.
- **No V8 heap flag set:** Default Node.js heap is ~1.5 GB. Your 8 GB RAM is irrelevant unless you explicitly allocate it.
- **No process clustering:** One process, one core, one heap.

**Fixes:**

```bash
# Immediately: set heap limit
node --max-old-space-size=4096 index.js
```

```js
// Switch to Redis sessions
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const client = require('redis').createClient();
client.connect();
app.use(session({ store: new RedisStore({ client }), secret: 'secret', resave: false, saveUninitialized: false }));
```

```js
// Reduce bcrypt rounds + select minimal fields
const hash = await bcrypt.hash(password, 10);
const user = await User.findById(id).select('id email role').lean();
```

```js
// Cluster across CPU cores
const cluster = require('cluster');
const os = require('os');
if (cluster.isPrimary) {
  os.cpus().forEach(() => cluster.fork());
} else {
  require('./server');
}
```

---

## Prompt 2 — System Design

**Full Prompt:**
> Design a URL shortener like bit.ly. Requirements: support **100 million URLs**, custom aliases, click analytics (country, device, timestamp), link expiry after 30 days, and **10,000 requests/second** at peak. Provide: full architecture diagram (text-based), database schema, caching strategy, and REST API design.

---

### 🟢 ChatGPT 
**Architecture (text diagram):**
```
Client
  │
  ▼
CDN (Cloudflare) ──── Cache Hit? ──► Return redirect
  │ Miss
  ▼
Load Balancer (Nginx / AWS ALB)
  │
  ├──► Shortener Service (Node.js × 5 pods)
  │         │
  │         ├──► Redis (hot URLs, TTL 1h)
  │         └──► PostgreSQL (source of truth)
  │
  └──► Analytics Service (separate microservice)
            │
            └──► ClickHouse or TimescaleDB (write-heavy analytics)
```

**Database Schema:**
```sql
-- URLs table
CREATE TABLE urls (
  id          BIGSERIAL PRIMARY KEY,
  short_code  VARCHAR(10) UNIQUE NOT NULL,
  long_url    TEXT NOT NULL,
  user_id     UUID,
  is_custom   BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Analytics table
CREATE TABLE clicks (
  id         BIGSERIAL PRIMARY KEY,
  short_code VARCHAR(10) NOT NULL,
  country    VARCHAR(5),
  device     VARCHAR(20),
  clicked_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON clicks (short_code, clicked_at);
```

**Caching Strategy:** Write-through cache. On URL creation → write to Postgres + Redis (TTL 1h). On redirect → check Redis first; miss → Postgres → re-cache. Expired URLs: cron job deletes from Postgres every hour, Redis TTL handles cache.

**API Design:**
```
POST   /api/shorten          → Create short URL
GET    /:code                → Redirect to long URL
GET    /api/analytics/:code  → Get click stats
DELETE /api/urls/:code       → Delete URL
```

---

### 🟣 Claude 

**Architecture Thinking:** Claude focused on the throughput math before designing.

> At 10,000 req/s, if even 1% are writes (URL creation), that's 100 writes/s — easily handled by a single Postgres instance. The 9,900 redirects/s are the real challenge and should never touch the database.

**Key insight Claude added:** Use a **base62 encoding** (a-z, A-Z, 0-9) of an auto-incremented ID to generate 7-character codes that support ~3.5 trillion unique URLs. No collision checking needed.

```js
// Base62 encoding for short code generation
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function encode(num) {
  let result = '';
  while (num > 0) {
    result = BASE62[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(7, '0');
}
```

**Schema difference:** Claude separated concerns into 3 tables — `urls`, `custom_aliases`, and `click_events` — and noted that ClickHouse is overkill at this scale; TimescaleDB (Postgres extension) handles 10k writes/s without adding infrastructure complexity.

**Caching nuance:** Claude specifically recommended a **"thundering herd" guard** — if a hot URL's cache expires, use a mutex/lock so only one request fetches from DB while others wait, rather than all 10k hitting Postgres simultaneously.

---

### 🔵 Gemini 

**Architecture:** Gemini gave the most Google-infrastructure-flavored answer.

```
User → Cloud CDN → Cloud Load Balancer → App Engine / Cloud Run
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                        Cloud Spanner    Memorystore       BigQuery
                        (URLs table)     (Redis cache)   (Analytics)
```

**Gemini's unique addition:** Suggested using **Cloud Tasks** for async analytics writes — the redirect itself returns instantly (< 5ms), and click tracking is enqueued as a background job, decoupling latency from analytics throughput.

**Schema:** Similar to ChatGPT but added a `regions` partitioning hint for Spanner to distribute global reads.

**Gemini's caching:** Recommended setting CDN cache headers on redirects (`Cache-Control: public, max-age=3600`) so repeat clicks on the same short URL never even reach the origin server — effectively making CDN the L1 cache.

---

## Prompt 3 — Creative Writing

**Full Prompt:**
> Write the **opening paragraph** of a psychological thriller novel. The protagonist is a **forensic accountant** who discovers a single **$0.01 discrepancy** in a Fortune 500 company's books — a discrepancy that eventually unravels a decade-long conspiracy. The tone must feel like **the calm before a storm**: mundane surface, deep dread underneath. Do not reveal the conspiracy — only hint at it.

---

### 🟢 ChatGPT 

> The spreadsheet had been open for six hours. Maya Reyes hadn't moved from her chair, hadn't refilled her coffee, hadn't acknowledged the cleaning crew that swept through at half past nine. She was looking at a single cell — column G, row 4,847 — where the number 0.01 sat like a misprint. It wasn't a misprint. She'd checked. She'd checked it three times the way she checked everything: methodically, without feeling, the way her professor had taught her that numbers don't lie but people do. The office around her was quiet now, the kind of quiet that had weight to it. Somewhere below her, forty-three floors down, the city moved and breathed and forgot about itself. Up here, Maya did not move. She pulled up the original wire transfer record. Her hand hovered over the mouse. She did not click.

**Style:** Tight, cinematic, prose-thriller. Short sentences build tension well.

---

### 🟣 Claude 

> Eleanor Marsh had spent seventeen years finding other people's mistakes, and in that time she had learned that the truly dangerous errors were never the large ones. Embezzlers who stole millions left trails — obvious, almost arrogant trails — because greed at that scale requires speed and speed requires sloppiness. It was the careful ones she'd learned to fear. The ones who understood that patience was a weapon and that a ledger, examined in full, told a story, but a ledger examined in pieces told whatever story you needed it to tell. The discrepancy she found on a Tuesday in March was a single cent. One penny, transacted forty-seven times across fourteen subsidiaries over the course of a decade, rounding in a direction it should not have rounded. She stared at it for a long time. Then she closed her laptop, walked to the window of the thirty-second floor, and looked down at the street below. She thought about the exit interview she'd had with the last auditor who'd worked this account. The one who'd left the firm suddenly. The one who'd moved abroad.

**Style:** Longer, richer sentences. More internal character voice. The final three sentences are the most chilling.

---

### 🔵 Gemini

> The number was wrong by one cent. Daniel Cho had reconciled thousands of accounts in his career, and he knew, with the certainty of long practice, that a one-cent discrepancy in a corporate ledger of this size meant either a rounding error in the accounting software — the kind of mundane bug that got logged and forgotten — or something else entirely. The software, he had already confirmed, was fine. He sat back in his ergonomic chair in the empty audit room, the hum of the fluorescent lights the only sound, and looked at the number again. Around him, the walls of the Vantage Global headquarters were glass, open and transparent by design, the architecture of a company with nothing to hide. He thought about the metadata on the transaction. He thought about the timestamp. He thought, for the first time in his career, about whether he should simply close the file.

**Style:** Clean, efficient, journalistic. Strong closing image but less lyrical than Claude.

---

## Prompt 4 — Logic & Reasoning

**Full Prompt:**
> You have a **3-gallon jug** and a **5-gallon jug**, both with no measurement markings. You have an **unlimited water source**. You need to measure **exactly 4 gallons**. Walk through **every single step**, explain **why each step is necessary**, and then identify if there is a **second, alternative solution** that reaches 4 gallons through a different sequence of steps.

---

### 🟢 ChatGPT 

**Solution 1:**
| Step | Action | 3-gal | 5-gal | Why |
|---|---|---|---|---|
| 1 | Fill 5-gal | 0 | 5 | Start with known quantity |
| 2 | Pour 5→3 until 3-gal full | 3 | 2 | Creates known remainder of 2 in 5-gal |
| 3 | Empty 3-gal | 0 | 2 | Clear 3-gal to receive more |
| 4 | Pour 2 from 5→3 | 2 | 0 | Move 2 gallons to 3-gal |
| 5 | Fill 5-gal again | 2 | 5 | Get a fresh 5 gallons |
| 6 | Pour 5→3 until 3-gal full (needs 1 more) | 3 | **4** | 5-gal now holds exactly 4 ✅ |

**Solution 2:**
| Step | Action | 3-gal | 5-gal |
|---|---|---|---|
| 1 | Fill 3-gal | 3 | 0 |
| 2 | Pour 3→5 | 0 | 3 |
| 3 | Fill 3-gal | 3 | 3 |
| 4 | Pour 3→5 until full (5-gal needs 2) | 1 | 5 |
| 5 | Empty 5-gal | 1 | 0 |
| 6 | Pour 1 from 3→5 | 0 | 1 |
| 7 | Fill 3-gal | 3 | 1 |
| 8 | Pour 3→5 | 0 | **4** ✅ |

---

### 🟣 Claude 

Claude answered with full prose explanation before the steps, noting the mathematical basis:

> This puzzle is solvable because gcd(3, 5) = 1, which means any integer from 1 to 5 can be measured. The two solutions represent the two directions of the extended Euclidean algorithm: one works "down" (5→3), the other works "up" (3→5). Here's the formal reasoning for both:

Claude then gave both solutions with identical accuracy to ChatGPT, but additionally noted:

> **Why does Solution 2 take more steps?** Because filling the smaller jug and pouring into the larger one is the less efficient direction — you're building up to 4 via accumulation rather than arriving at it via subtraction. Both are valid; Solution 1 is typically 2 steps shorter.

---

### 🔵 Gemini 

Gemini answered concisely and correctly. It presented Solution 1 cleanly, and for Solution 2 stated:

> Alternatively, repeatedly fill the 3-gallon jug and pour it into the 5-gallon jug, emptying the 5-gallon when full. After three fills of the 3-gal jug, you will have distributed 9 gallons total; one 5-gallon dump leaves 4 gallons in the 5-gallon jug.

Gemini's explanation of Solution 2 was mathematically correct but less step-by-step than ChatGPT or Claude.

---

## Prompt 5 — Ethical Reasoning

**Full Prompt:**
> An AI medical diagnostic system is **94% accurate** — significantly better than the average doctor's 87% accuracy for the same disease. However, it was trained primarily on **Western population data** and shows only **78% accuracy** for patients of South Asian and African descent. A rural clinic in India with **no available doctors** wants to deploy it because it's their only diagnostic option. Should they deploy it? Provide a structured ethical analysis using **at least two ethical frameworks** (e.g., Utilitarianism, Deontology, Virtue Ethics, Care Ethics). Give a final recommendation with conditions.

---

### 🟢 ChatGPT 

**Framework 1 — Utilitarianism:**
Deploy if: (78% accuracy) > (0% accuracy with no doctor). The net outcome is positive. More patients get correct diagnoses than would get none. Harm from 22% misdiagnosis must be weighed against 100% harm from zero diagnosis.

**Framework 2 — Deontology (Kantian):**
Deploying a system known to be less accurate for this specific population risks treating South Asian patients as a means to an end (testing an imperfect tool on them). This violates the categorical imperative unless full informed consent is given.

**Conclusion:** Deploy, with strict conditions:
- Display accuracy disparity clearly to all patients (informed consent)
- Log all diagnoses for bias auditing
- Establish a telemedicine fallback for ambiguous cases
- Commit to retraining on local population data within 12 months

---

### 🟣 Claude 

Claude gave the most nuanced answer, adding a third framework and a critical counter-argument:

**Framework 1 — Utilitarianism:**
> The 78% vs. 0% comparison is correct but incomplete. The relevant question is: what is the *expected harm* of a false negative vs. no diagnosis? For some diseases, a false negative is more dangerous than no diagnosis at all — because it provides false reassurance. You'd need to know the false negative rate specifically for South Asian patients before making the utilitarian case.

**Framework 2 — Care Ethics:**
Focuses on the specific relationships and vulnerabilities of these patients. Deploying a tool known to underperform on this exact demographic — without their knowledge — violates the ethics of care. These patients are already disadvantaged by geography and resource scarcity; adding an accuracy disadvantage compounds that injustice.

**Framework 3 — Justice (Rawls):**
> Would you accept this deployment if you didn't know whether you were a Western or South Asian patient? The veil of ignorance suggests no — because you'd be accepting a system that structurally disadvantages the already-disadvantaged.

**Final Recommendation:** Deploy conditionally, but frame it explicitly as a "bridge tool, not a replacement." Claude uniquely recommended establishing a patient feedback registry — tracking which AI diagnoses were later confirmed or refuted — as a real-world retraining dataset.

---

### 🔵 Gemini 

Gemini's response was structured and correct but more surface-level. It correctly identified the two frameworks, gave solid analysis, and recommended deployment with conditions — similar to ChatGPT. Gemini's unique addition was a practical one:

> WHO guidelines for AI medical devices in LMICs (Low and Middle Income Countries) require a minimum accuracy threshold of 80% for deployment. At 78% for this demographic, the device falls below this threshold for the target population — which is a regulatory concern independent of the ethical analysis.

This was the most practically grounded point raised by any model.

---

## 📊 Overall Model Comparison

| Dimension | ChatGPT | Claude  | Gemini |
|---|---|---|---|
| **Structure** | ⭐⭐⭐⭐⭐ Excellent headers, tables | ⭐⭐⭐⭐ Narrative + structured | ⭐⭐⭐⭐ Clean, concise |
| **Technical Depth** | ⭐⭐⭐⭐ Thorough, accurate | ⭐⭐⭐⭐⭐ Deepest reasoning | ⭐⭐⭐ Correct but lighter |
| **Creative Writing** | ⭐⭐⭐⭐ Cinematic, tight | ⭐⭐⭐⭐⭐ Most literary voice | ⭐⭐⭐ Clean but flat |
| **Unique Insights** | ⭐⭐⭐ Standard best practices | ⭐⭐⭐⭐⭐ Often adds non-obvious angles | ⭐⭐⭐⭐ Practical/regulatory facts |
| **Code Quality** | ⭐⭐⭐⭐⭐ Most complete examples | ⭐⭐⭐⭐ Good with commentary | ⭐⭐⭐ Shorter, minimal |
| **Best For** | Step-by-step guides, code | Analysis, nuanced reasoning | Quick answers, factual lookup |
