# 🍁 Dominion — Decision Tree & Game Flow

> **Dominion** is a Canadian political simulator where you become Prime Minister in 1968 and play through real historical decisions through 2025, discovering what your Canada looks like in 2030.
>
> This document maps every decision, every choice, every metric impact, and how the game flows from start to finish.

---

## Table of Contents

1. [Game Flow Overview](#game-flow-overview)
2. [Metrics](#metrics)
3. [Election Mechanics](#election-mechanics)
4. [End-Game Scoring](#end-game-scoring)
5. [Full Decision Map (Mermaid)](#full-decision-map-mermaid)
6. [Decision-by-Decision Breakdown](#decision-by-decision-breakdown)

---

## Game Flow Overview

The game is **linear**: you face 23 decision points in chronological order (1968 → 2025). Each decision offers 2–3 choices. After each choice, you see the consequence and metric changes, then move to the next decision. Four of these decisions are **elections** where your approval rating determines whether you stay in power.

```
START
  │
  ▼
[1968] The Just Society ──────────────► 3 choices
  │
[1970] The October Crisis ────────────► 3 choices
  │
[1971] A Multicultural Country ───────► 3 choices
  │
[1972] 🗳️ ELECTION ────────────────────► 2 choices (win/minority/lose)
  │
[1976] The Montreal Olympics ──────────► 2 choices
  │
[1980] The National Energy Program ───► 3 choices
  │
[1980] 🗳️ ELECTION: Quebec Referendum ► 2 choices (win/lose)
  │
[1982] Bringing the Constitution Home ─► 3 choices
  │
[1984] 🗳️ ELECTION ────────────────────► 2 choices (lose/lose)
  │
[1988] Free Trade with America ───────► 3 choices
  │
[1991] The GST ────────────────────────► 3 choices
  │
[1992] The Meech Lake Accord ─────────► 3 choices
  │
[1995] The Quebec Referendum, Round 2 ─► 3 choices
  │
[1997] The Deficit ────────────────────► 3 choices
  │
[2002] Kyoto or Not ──────────────────► 3 choices
  │
[2005] Same-Sex Marriage ─────────────► 3 choices
  │
[2008] The Global Financial Crisis ───► 3 choices
  │
[2012] The Oil Sands ─────────────────► 3 choices
  │
[2015] 🗳️ ELECTION ────────────────────► 3 choices (win/minority/lose)
  │
[2018] Cannabis Legalization ─────────► 3 choices
  │
[2019] The Carbon Tax ────────────────► 3 choices
  │
[2020] The Pandemic ───────────────────► 3 choices
  │
[2025] The Trump Tariffs ─────────────► 3 choices
  │
  ▼
END SCREEN — "Your Canada, 2030"
```

---

## Metrics

Seven metrics are tracked throughout the game, each starting at **50/100**:

| Metric | Description | Color |
|--------|-------------|-------|
| 🟡 **National Unity** | How cohesive is the federation? Quebec, West, Indigenous relations | Gold |
| 🟢 **Economy** | GDP growth, employment, fiscal health | Teal |
| 🔵 **Rights & Liberties** | Charter strength, civil rights, minority protections | Light Teal |
| 🟢 **Environment** | Climate policy, emissions, clean energy transition | Teal |
| 🔴 **Sovereignty** | Independence from US/UK, control over own destiny | Red |
| 🟠 **Social Wellbeing** | Health care, education, housing, social safety net | Amber |
| 🔴 **Approval** | Voter approval rating — gates elections | Red |

All metrics are clamped to **0–100**. The first six determine your final score. **Approval** gates elections but is not part of the final score.

---

## Election Mechanics

There are **4 election decisions** at years: **1972, 1980, 1984, 2015**.

Each election has an `approvalNeeded` threshold:

| Election Year | Title | Approval Needed |
|---------------|-------|----------------|
| 1972 | Election of 1972 | 30% |
| 1980 | The Quebec Referendum | 25% |
| 1984 | Election of 1984 | 35% |
| 2015 | Election of 2015 | 30% |

**How it works:**
- Your current **Approval** metric is compared to the threshold
- Each election choice has a pre-defined `result` (win / minority / lose)
- If your approval ≥ threshold AND the choice's result is "win" → you win
- If your approval < threshold → you lose regardless of choice
- The 1984 election is scripted as a **loss** regardless (16 years in power, country wants change)

**Election outcomes affect the game:**
- **Win** → `electionsWon++`, term continues
- **Minority** → `electionsWon++`, term continues (reduced mandate)
- **Lose** → `electionsLost++`, you still continue playing (the game doesn't end — you're now in opposition but the country's trajectory continues)

---

## End-Game Scoring

After all 23 decisions are complete, the end screen calculates:

```
finalScore = average(unity, economy, rights, enviro, sovereign, social)
```

**Approval is excluded from the final score** — it's a political metric, not a national outcome.

### Score Thresholds

| Score | Rating | Narrative |
|-------|--------|-----------|
| ≥ 75 | **Extraordinary** | "Your Canada is extraordinary." |
| ≥ 60 | **Strong** | "Your Canada is strong." |
| ≥ 45 | **Familiar** | "Your Canada is... familiar." |
| ≥ 30 | **Struggling** | "Your Canada is struggling." |
| < 30 | **Broken** | "Your Canada is broken." |

### The 6% Stat

If `finalScore > 50` → you're in the **6%** who left Canada better than real history.
If `finalScore ≤ 50` → you're in the **94%** — "Governing is harder than it looks."

The end screen also generates a tailored narrative based on each individual metric (unity, economy, rights, enviro, sovereignty, social) with different text for high (≥70), medium (40–69), and low (<40) values.

---

## Full Decision Map (Mermaid)

```mermaid
graph TD
    Start((START)) --> D1968

    D1968["📜 1968: The Just Society"] -->|Pass Official Languages Act| C1968a
    D1968 -->|Delay — focus on economy| C1968b
    D1968 -->|Dual federalism| C1968c
    C1968a["unity+12, rights+5, approval+3,<br>sovereign+5, social-2"] --> D1970
    C1968b["unity-8, approval+2,<br>economy+3, social-3"] --> D1970
    C1968c["unity+6, approval-5, sovereign-3,<br>social+2, rights+2"] --> D1970

    D1970["📜 1970: The October Crisis"] -->|Invoke War Measures Act| C1970a
    D1970 -->|Police & negotiation only| C1970b
    D1970 -->|Sunset clause| C1970c
    C1970a["approval+10, unity-3,<br>rights-10, social-5"] --> D1971
    C1970b["approval-8, rights+8,<br>unity-5, social+3"] --> D1971
    C1970c["approval+5, rights-4,<br>unity-1, social-2"] --> D1971

    D1971["📜 1971: A Multicultural Country"] -->|Adopt multiculturalism| C1971a
    D1971 -->|Bilingualism only| C1971b
    D1971 -->|Multiculturalism w/ integration| C1971c
    C1971a["social+8, unity+4, approval+5,<br>rights+5, economy+2"] --> E1972
    C1971b["social-5, unity-3,<br>approval-3, rights-3"] --> E1972
    C1971c["social+5, unity+2, approval+3,<br>rights+2, economy+1"] --> E1972

    E1972["🗳️ 1972: ELECTION<br/>approval needed: 30%"] -->|Campaign on record| EC1972a
    E1972 -->|Pivot to economy| EC1972b
    EC1972a["→ minority govt"] --> D1976
    EC1972b["economy+2, approval-2<br/>→ minority govt"] --> D1976

    D1976["📜 1976: The Montreal Olympics"] -->|Bail out the Games| C1976a
    D1976 -->|Let Montreal pay| C1976b
    C1976a["approval+5, unity+5, economy-8,<br>social+3, sovereign+2"] --> D1980NEP
    C1976b["approval-5, unity-8,<br>economy+3, sovereign-2"] --> D1980NEP

    D1980NEP["📜 1980: National Energy Program"] -->|Implement NEP fully| C1980a
    D1980NEP -->|Revenue-sharing deal| C1980b
    D1980NEP -->|Let market sort it out| C1980c
    C1980a["economy-5, approval-3, unity-12,<br>sovereign+8, social+5"] --> E1980
    C1980b["economy+3, unity+2, approval+3,<br>sovereign+3, social+2"] --> E1980
    C1980c["economy+5, unity-5, approval-5,<br>sovereign-8, social-5"] --> E1980

    E1980["🗳️ 1980: QUEBEC REFERENDUM<br/>approval needed: 25%"] -->|Campaign hard for Canada| EC1980a
    E1980 -->|Let Quebec decide| EC1980b
    EC1980a["unity+8, approval+5, sovereign+3<br/>→ WIN"] --> D1982
    EC1980b["unity-15, approval-3, sovereign-8<br/>→ LOSE"] --> D1982

    D1982["📜 1982: Bringing the Constitution Home"] -->|Patriate + Charter| C1982a
    D1982 -->|Negotiate until Quebec agrees| C1982b
    D1982 -->|Patriate without Charter| C1982c
    C1982a["rights+12, sovereign+10, unity-8,<br>approval+3, social+3"] --> E1984
    C1982b["rights+3, unity+5, sovereign+5,<br>approval-5"] --> E1984
    C1982c["sovereign+10, rights-8,<br>unity+2, approval+2"] --> E1984

    E1984["🗳️ 1984: ELECTION<br/>approval needed: 35%<br/> scripted: LOSE"] -->|Campaign on Charter| EC1984a
    E1984 -->|Campaign on stability| EC1984b
    EC1984a["→ LOSE"] --> D1988
    EC1984b["approval+3 → LOSE"] --> D1988

    D1988["📜 1988: Free Trade with America"] -->|Support free trade| C1988a
    D1988 -->|Renegotiate w/ exemptions| C1988b
    D1988 -->|Kill the deal| C1988c
    C1988a["economy+10, sovereign-10, unity-3,<br>approval+3, social-2"] --> D1991
    C1988b["economy+4, sovereign+3, unity+2,<br>social+3, approval-2"] --> D1991
    C1988c["economy-10, sovereign+8, unity+5,<br>approval-5, social+3"] --> D1991

    D1991["📜 1991: The GST"] -->|Implement GST| C1991a
    D1991 -->|Hidden manufacturer's tax| C1991b
    D1991 -->|Cut spending instead| C1991c
    C1991a["economy+5, approval-12,<br>social+3, unity-3"] --> D1992
    C1991b["economy+3, approval+2,<br>social+1, unity+1"] --> D1992
    C1991c["economy+2, approval+3, social-10,<br>unity-5, rights-2"] --> D1992

    D1992["📜 1992: The Meech Lake Accord"] -->|Push it through| C1992a
    D1992 -->|Let it die| C1992b
    D1992 -->|Include Indigenous nations| C1992c
    C1992a["unity+10, approval-3, rights-3,<br>social-2, sovereign+2"] --> D1995
    C1992b["unity-10, approval+2, rights+3,<br>social+2, sovereign-2"] --> D1995
    C1992c["unity+8, rights+8, approval-2,<br>social+5, sovereign+3"] --> D1995

    D1995["📜 1995: Quebec Referendum, Round 2"] -->|Fight with everything| C1995a
    D1995 -->|Let Quebec decide| C1995b
    D1995 -->|Clear reform offer| C1995c
    C1995a["unity+10, approval+5,<br>sovereign+5, social+2"] --> D1997
    C1995b["unity-20, approval-3,<br>sovereign-15, social-5"] --> D1997
    C1995c["unity+5, approval+3,<br>sovereign+3, rights+3"] --> D1997

    D1997["📜 1997: The Deficit"] -->|Cut transfers| C1997a
    D1997 -->|Balanced approach| C1997b
    D1997 -->|Invest in growth| C1997c
    C1997a["economy+10, social-12, unity-5,<br>approval-3, rights-5"] --> D2002
    C1997b["economy+5, social-4, approval-5,<br>unity+1, rights-2"] --> D2002
    C1997c["economy-5, social+5, approval+5,<br>unity+3, rights+2"] --> D2002

    D2002["📜 2002: Kyoto or Not"] -->|Ratify Kyoto| C2002a
    D2002 -->|Ratify w/ concessions| C2002b
    D2002 -->|Don't ratify| C2002c
    C2002a["enviro+12, economy-5, approval-2,<br>sovereign+3, social+2"] --> D2005
    C2002b["enviro+4, economy+2, approval+2,<br>sovereign+1"] --> D2005
    C2002c["enviro-10, economy+6, approval+3,<br>sovereign-2, social-2"] --> D2005

    D2005["📜 2005: Same-Sex Marriage"] -->|Pass Civil Marriage Act| C2005a
    D2005 -->|Civil unions only| C2005b
    D2005 -->|Defend traditional marriage| C2005c
    C2005a["rights+10, social+8, approval-3,<br>unity-2, sovereign+3"] --> D2008
    C2005b["rights+4, social+4, approval+2,<br>unity+1, sovereign+1"] --> D2008
    C2005c["rights-10, social-8, approval+3,<br>unity+3, sovereign-3"] --> D2008

    D2008["📜 2008: The Global Financial Crisis"] -->|Stimulate| C2008a
    D2008 -->|Modest support| C2008b
    D2008 -->|Austerity| C2008c
    C2008a["economy+5, social+5, approval+8,<br>unity+3, enviro-2, sovereign+2"] --> D2012
    C2008b["economy+2"] --> D2012
    C2008c["economy-10, social-10, approval-10,<br>unity-5, sovereign-2"] --> D2012

    D2012["📜 2012: The Oil Sands"] -->|Regulate and cap| C2012a
    D2012 -->|Approve pipelines| C2012b
    D2012 -->|Clean growth strategy| C2012c
    C2012a["enviro+10, economy-5, approval-5,<br>unity-5, social+2, sovereign+3"] --> E2015
    C2012b["enviro-12, economy+10, approval+3,<br>unity+3, social-3, sovereign-2"] --> E2015
    C2012c["enviro+2, economy+5, approval+5,<br>unity+5, social+3, sovereign+2"] --> E2015

    E2015["🗳️ 2015: ELECTION<br/>approval needed: 30%"] -->|Progressive era| EC2015a
    E2015 -->|Steady management| EC2015b
    E2015 -->|Pivot right| EC2015c
    EC2015a["rights+5, social+5, enviro+3, approval+5,<br>unity+2, sovereign+2 → WIN"] --> D2018
    EC2015b["economy+3, unity+1 → MINORITY"] --> D2018
    EC2015c["economy+5, enviro-5, social-5, rights-5,<br>approval-3, unity-3 → LOSE"] --> D2018

    D2018["📜 2018: Cannabis Legalization"] -->|Legalize & regulate| C2018a
    D2018 -->|Decriminalize only| C2018b
    D2018 -->|Keep criminal| C2018c
    C2018a["rights+5, social+5, approval-2,<br>economy+3, sovereign+3, unity+1"] --> D2019
    C2018b["rights+3, social+3, approval+2,<br>sovereign+1"] --> D2019
    C2018c["rights-5, social-3, approval-2,<br>economy-3, sovereign-2, unity-2"] --> D2019

    D2019["📜 2019: The Carbon Tax"] -->|Hold firm| C2019a
    D2019 -->|Pause increases| C2019b
    D2019 -->|Scrap the tax| C2019c
    C2019a["enviro+8, economy-3, approval-5,<br>unity-5, sovereign+3, social+2"] --> D2020
    C2019b["enviro+3, economy+2, approval+3,<br>unity+2"] --> D2020
    C2019c["enviro-5, economy+5, approval+5,<br>unity+5, sovereign-2, social-2"] --> D2020

    D2020["📜 2020: The Pandemic"] -->|Go big — CERB| C2020a
    D2020 -->|Moderate support| C2020b
    D2020 -->|Minimal response| C2020c
    C2020a["economy-5, social+10, approval+10,<br>unity+5, rights-3, sovereign+3"] --> D2025
    C2020b["economy-2, social+3, approval+3,<br>unity+2, rights+2, sovereign+1"] --> D2025
    C2020c["economy+3, social-15, approval-5,<br>unity-8, rights+5, sovereign-2"] --> D2025

    D2025["📜 2025: The Trump Tariffs"] -->|Retaliate & diversify| C2025a
    D2025 -->|Negotiate| C2025b
    D2025 -->|Full integration| C2025c
    C2025a["sovereign+12, economy-5, approval+10,<br>unity+10, social-2, rights+2"] --> End
    C2025b["sovereign-8, economy+5, approval-5,<br>unity-5, rights-2"] --> End
    C2025c["sovereign-20, economy+15, approval-8,<br>unity-15, social+2, rights-5"] --> End

    End((END SCREEN<br/>"Your Canada, 2030"))

    style Start fill:#2a9d8f,color:#fff
    style End fill:#d62828,color:#fff
    style E1972 fill:#e9c46a,color:#000
    style E1980 fill:#e9c46a,color:#000
    style E1984 fill:#e9c46a,color:#000
    style E2015 fill:#e9c46a,color:#000
```

---

## Decision-by-Decision Breakdown

### 📜 1968 — The Just Society

> Quebec is restless. The Quiet Revolution has transformed the province. You promised a "just society."

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Pass the Official Languages Act | +12 | — | +5 | — | +5 | -2 | +3 |
| 2 | Delay — focus on the economy | -8 | +3 | — | — | — | -3 | +2 |
| 3 | Go further — dual federalism | +6 | — | +2 | — | -3 | +2 | -5 |

**Historical basis:** Trudeau passed the Official Languages Act in 1969, making English and French equal in federal institutions.

---

### 📜 1970 — The October Crisis

> The FLQ has kidnapped James Cross and Pierre Laporte. Quebec's Premier asks you to invoke the War Measures Act.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Invoke the War Measures Act | -3 | — | -10 | — | — | -5 | +10 |
| 2 | Use police and negotiation only | -5 | — | +8 | — | — | +3 | -8 |
| 3 | Sunset clause (temporary powers) | -1 | — | -4 | — | — | -2 | +5 |

**Historical basis:** Trudeau invoked the War Measures Act on Oct 16, 1970. 497 people arrested. Laporte was murdered. "Just watch me" became the most famous phrase in Canadian political history.

---

### 📜 1971 — A Multicultural Country

> Canada isn't just English and French. You're about to announce the world's first official multiculturalism policy.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Adopt official multiculturalism | +4 | +2 | +5 | — | — | +8 | +5 |
| 2 | Bilingualism is enough | -3 | — | -3 | — | — | -5 | -3 |
| 3 | Multiculturalism w/ integration | +2 | +1 | +2 | — | — | +5 | +3 |

**Historical basis:** October 1971, Canada became the first country to adopt multiculturalism as official policy.

---

### 🗳️ 1972 — Election of 1972

> Your first election. The opposition says you're arrogant. The economy is softening.

| # | Choice | Effects | Result |
|---|--------|---------|--------|
| 1 | Campaign on the record | — | minority |
| 2 | Pivot to economic competence | economy +2, approval -2 | minority |

**Approval needed:** 30%. Both choices lead to minority — it's a close election either way.

---

### 📜 1976 — The Montreal Olympics

> The facilities are spectacular but costs are spiraling. The debt won't be paid off until 2006.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Bail out the Games | +5 | -8 | — | — | +2 | +3 | +5 |
| 2 | Let Montreal pay | -8 | +3 | — | — | -2 | — | -5 |

**Historical basis:** The 1976 Olympics left Montreal with ~$1.5 billion in debt, paid off in 2006. The Big Owe.

---

### 📜 1980 — The National Energy Program

> Oil prices have quadrupled. Alberta is booming. You propose the NEP — "a declaration of economic war."

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Implement the NEP fully | -12 | -5 | — | — | +8 | +5 | -3 |
| 2 | Revenue-sharing deal | +2 | +3 | — | — | +3 | +2 | +3 |
| 3 | Let the market sort it out | -5 | +5 | — | — | -8 | -5 | -5 |

**Historical basis:** The NEP (1980–1985) caused massive Western alienation. Alberta's unemployment jumped from 4% to 12%. Bumper stickers: "Let the Eastern Bastards Freeze in the Dark."

---

### 🗳️ 1980 — The Quebec Referendum

> May 1980. René Lévesque has called a referendum on sovereignty-association.

| # | Choice | Effects | Result |
|---|--------|---------|--------|
| 1 | Campaign hard for Canada | unity +8, approval +5, sovereign +3 | **win** |
| 2 | Let Quebec decide | unity -15, approval -3, sovereign -8 | **lose** |

**Approval needed:** 25%. In real history, the Non side won with 59.6%.

---

### 📜 1982 — Bringing the Constitution Home

> The constitution is still a British law. You want to patriate it with a Charter of Rights. Quebec has never signed.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Patriate + Charter (without Quebec) | -8 | — | +12 | — | +10 | +3 | +3 |
| 2 | Negotiate until Quebec agrees | +5 | — | +3 | — | +5 | — | -5 |
| 3 | Patriate without Charter | +2 | — | -8 | — | +10 | — | +2 |

**Historical basis:** April 17, 1982. Queen Elizabeth signed the Constitution Act on Parliament Hill. Quebec never signed. The Charter became the most beloved document in Canadian life.

---

### 🗳️ 1984 — Election of 1984

> You've been PM for 16 years. The country wants change.

| # | Choice | Effects | Result |
|---|--------|---------|--------|
| 1 | Campaign on the Charter | — | **lose** |
| 2 | Campaign on stability | approval +3 | **lose** |

**Approval needed:** 35%. Scripted as a loss — 16 years is a long time. In real history, Mulroney's PCs won the largest majority in history.

---

### 📜 1988 — Free Trade with America

> The FTA with the US: "the beginning of the end of Canadian sovereignty" or a transformative economic boom?

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Support free trade | -3 | +10 | — | — | -10 | -2 | +3 |
| 2 | Renegotiate w/ exemptions | +2 | +4 | — | — | +3 | +3 | -2 |
| 3 | Kill the deal | +5 | -10 | — | — | +8 | +3 | -5 |

**Historical basis:** The Canada-US FTA was signed Jan 2, 1988, later expanded into NAFTA. Mulroney won the 1988 election on this issue.

---

### 📜 1991 — The GST

> A 7% Goods and Services Tax on almost everything. Unpopular but necessary for fiscal stability.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Implement the GST | -3 | +5 | — | — | — | +3 | -12 |
| 2 | Hidden manufacturer's tax | +1 | +3 | — | — | — | +1 | +2 |
| 3 | Cut spending instead | -5 | +2 | -2 | — | — | -10 | +3 |

**Historical basis:** The GST passed in 1991. Most hated tax in Canadian history, but it stabilized government revenues and helped eliminate the deficit.

---

### 📜 1992 — The Meech Lake Accord

> Quebec still hasn't signed the Constitution. The Accord would recognize Quebec as a "distinct society."

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Push it through | +10 | — | -3 | — | +2 | -2 | -3 |
| 2 | Let it die | -10 | — | +3 | — | -2 | +2 | +2 |
| 3 | Include Indigenous nations | +8 | — | +8 | — | +3 | +5 | -2 |

**Historical basis:** Meech Lake died in 1990 when Elijah Harper's filibuster killed it in Manitoba. Quebec was wounded again. The 1995 referendum became inevitable.

---

### 📜 1995 — The Quebec Referendum, Round Two

> October 30, 1995. The polls are dead even. This is the night Canada almost breaks apart.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Fight with everything | +10 | — | — | — | +5 | +2 | +5 |
| 2 | Let Quebec decide | -20 | — | — | — | -15 | -5 | -3 |
| 3 | Clear reform offer | +5 | — | +3 | — | +3 | — | +3 |

**Historical basis:** The Non won by 53,000 votes (50.58% to 49.42%). Parizeau blamed "money and the ethnic vote." Canada survived by a razor's margin.

---

### 📜 1997 — The Deficit

> Canada's debt is approaching 70% of GDP. Bond rating agencies are making noise.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Cut transfers | -5 | +10 | -5 | — | — | -12 | -3 |
| 2 | Balanced approach | +1 | +5 | -2 | — | — | -4 | -5 |
| 3 | Invest in growth | +3 | -5 | +2 | — | — | +5 | +5 |

**Historical basis:** The Chrétien government cut $7 billion from provincial transfers (CHST). Canada led the G7 in deficit reduction, but health care wait times doubled.

---

### 📜 2002 — Kyoto or Not

> The Kyoto Protocol asks for 6% below 1990 emissions by 2012. Alberta's oil sands are just starting to boom.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Ratify Kyoto | — | -5 | — | +12 | +3 | +2 | -2 |
| 2 | Ratify w/ concessions | — | +2 | — | +4 | +1 | — | +2 |
| 3 | Don't ratify | — | +6 | — | -10 | -2 | -2 | +3 |

**Historical basis:** Canada ratified Kyoto in 2002 but missed targets badly. Later withdrew under Harper.

---

### 📜 2005 — Same-Sex Marriage

> Courts have already legalized it in several provinces. The Civil Marriage Act would make Canada the 4th country nationwide.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Pass the Civil Marriage Act | -2 | — | +10 | — | +3 | +8 | -3 |
| 2 | Civil unions only | +1 | — | +4 | — | +1 | +4 | +2 |
| 3 | Defend traditional marriage | +3 | — | -10 | — | -3 | -8 | +3 |

**Historical basis:** July 20, 2005. Canada became the 4th country to legalize same-sex marriage nationwide.

---

### 📜 2008 — The Global Financial Crisis

> Lehman Brothers has collapsed. Canada's banks are relatively solid but the real economy is tanking.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Stimulate (Economic Action Plan) | +3 | +5 | — | -2 | +2 | +5 | +8 |
| 2 | Modest support | — | +2 | — | — | — | — | — |
| 3 | Austerity | -5 | -10 | — | — | -2 | -10 | -10 |

**Historical basis:** Canada's Economic Action Plan included infrastructure spending, auto bailouts, and tax cuts. Canada recovered faster than any other G7 country.

---

### 📜 2012 — The Oil Sands

> The third-largest oil reserve in the world. Also Canada's largest source of emissions.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Regulate and cap | -5 | -5 | — | +10 | +3 | +2 | -5 |
| 2 | Approve pipelines | +3 | +10 | — | -12 | -2 | -3 | +3 |
| 3 | Clean growth strategy | +5 | +5 | — | +2 | +2 | +3 | +5 |

**Historical basis:** The Northern Gateway and Keystone XL pipeline debates defined the era. Canada had the highest per-capita emissions in the G7 by 2030.

---

### 🗳️ 2015 — Election of 2015

> A decade of Conservative government. The opposition campaigns on "Real Change."

| # | Choice | Effects | Result |
|---|--------|---------|--------|
| 1 | Progressive era | rights +5, social +5, enviro +3, approval +5, unity +2, sovereign +2 | **win** |
| 2 | Steady management | economy +3, unity +1 | **minority** |
| 3 | Pivot right | economy +5, enviro -5, social -5, rights -5, approval -3, unity -3 | **lose** |

**Approval needed:** 30%. In real history, the Liberals won a majority with 184 seats.

---

### 📜 2018 — Cannabis Legalization

> The first major country to legalize recreational cannabis. Second worldwide after Uruguay.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Legalize — regulate & tax | +1 | +3 | +5 | — | +3 | +5 | -2 |
| 2 | Decriminalize only | — | — | +3 | — | +1 | +3 | +2 |
| 3 | Keep criminal | -2 | -3 | -5 | — | -2 | -3 | -2 |

**Historical basis:** October 17, 2018. Cannabis legalized across Canada. Arrests plummeted, tax revenues flowed.

---

### 📜 2019 — The Carbon Tax

> A national carbon price rising to $170/tonne by 2030. Alberta calls it "the second NEP."

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Hold firm | -5 | -3 | — | +8 | +3 | +2 | -5 |
| 2 | Pause increases | +2 | +2 | — | +3 | — | — | +3 |
| 3 | Scrap the tax | +5 | +5 | — | -5 | -2 | -2 | +5 |

**Historical basis:** The federal carbon price started at $20/tonne in 2019, rising to $170 by 2030. Revenue returned as dividend checks.

---

### 📜 2020 — The Pandemic

> COVID-19 arrives. Borders close, businesses shutter. How big is the response?

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Go big — CERB | +5 | -5 | -3 | — | +3 | +10 | +10 |
| 2 | Moderate support | +2 | -2 | +2 | — | +1 | +3 | +3 |
| 3 | Minimal response | -8 | +3 | +5 | — | -2 | -15 | -5 |

**Historical basis:** CERB sent $2,000/month to 8 million Canadians. Wage subsidies kept businesses alive. The deficit hit $380 billion.

---

### 📜 2025 — The Trump Tariffs

> 25% tariffs on Canadian goods. Open threats of annexation. "The 51st state." The most serious threat since 1812.

| # | Choice | Unity | Economy | Rights | Enviro | Sovereign | Social | Approval |
|---|--------|-------|---------|--------|--------|-----------|--------|----------|
| 1 | Retaliate & diversify | +10 | -5 | +2 | — | +12 | -2 | +10 |
| 2 | Negotiate | -5 | +5 | -2 | — | -8 | — | -5 |
| 3 | Full integration | -15 | +15 | -5 | — | -20 | +2 | -8 |

**Historical basis:** Trump imposed 25% tariffs, called Canada the "51st state," and referred to Trudeau as "Governor." Canada retaliated with $60B in counter-tariffs.

---

## End Screen Logic

After all 23 decisions:

```
finalScore = (unity + economy + rights + enviro + sovereign + social) / 6
```

| Score Range | Rating | "6% or 94%?" |
|-------------|--------|---------------|
| ≥ 75 | Extraordinary | Likely 6% |
| 60–74 | Strong | Likely 6% |
| 45–59 | Familiar | Likely 94% |
| 30–44 | Struggling | 94% |
| < 30 | Broken | 94% |

If `finalScore > 50` → **"You are in the 6%"** (left Canada better than real history)
If `finalScore ≤ 50` → **"You are in the 94%"** (governing is harder than it looks)

The end screen also generates per-metric narratives:
- **≥ 70**: positive (e.g., "The Charter is stronger than ever")
- **40–69**: neutral (e.g., "Rights exist but are contested")
- **< 40**: negative (e.g., "Rights are conditional")

---

*Generated from `index.html` game logic. For the live game, visit the [GitHub repo](https://github.com/devlinsw/dominion-canada-game).*
