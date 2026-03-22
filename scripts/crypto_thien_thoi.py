#!/usr/bin/env python3
import json
import os
import random
import re
import requests
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
SIGNAL_DIR = BASE / "crypto" / "signals"
SIGNAL_DIR.mkdir(parents=True, exist_ok=True)

SOURCES = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
    "https://cryptoslate.com/feed/",
    "https://coinmarketcap.com/alexandria/rss",
    "https://www.investing.com/rss/news_25.rss",
]
POSITIVE = ["bull", "rally", "surge", "optimism", "boom", "bullish"]
NEGATIVE = ["crash", "bear", "sell", "risk", "worry", "dump"]

FEATURED_MATERIALS = [
    "Fed rate decision", "CPI release", "SEC regulation", "ETF approval", "halving", "stablecoin policy"
]

YAHOO_URL = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=BTC-USD,ETH-USD"


def fetch_news():
    headlines = []
    for url in SOURCES:
        try:
            resp = requests.get(url, timeout=6)
            text = resp.text
            items = re.findall(r"<item>(.*?)</item>", text, flags=re.S | re.I)
            for item in items[:3]:
                title_match = re.search(r"<title>(.*?)</title>", item, re.I | re.S)
                link_match = re.search(r"<link>(.*?)</link>", item, re.I | re.S)
                if title_match:
                    headlines.append({
                        "title": title_match.group(1).strip(),
                        "source": url,
                        "link": link_match.group(1).strip() if link_match else url,
                    })
        except Exception:
            continue
    if not headlines:
        # fallback sample news if RSS fails
        headlines = [
            {"title": "Global rate talk sparks crypto interest", "source": "internal", "link": ""}
        ]
    return headlines


def score_news(headlines):
    score = 0
    tokens = []
    for item in headlines:
        text = item["title"].lower()
        if any(p in text for p in POSITIVE):
            score += 1
            tokens.append("positive")
        if any(n in text for n in NEGATIVE):
            score -= 1
            tokens.append("negative")
        if any(keyword.lower() in text for keyword in FEATURED_MATERIALS):
            score += 0.5
    return max(min(score, 5), -5), tokens


def fetch_price():
    try:
        resp = requests.get(YAHOO_URL, timeout=5)
        data = resp.json()
        quotes = data.get("quoteResponse", {}).get("result", [])
        prices = [item.get("regularMarketPrice") for item in quotes if item.get("regularMarketPrice")]
        if prices:
            mean = sum(prices) / len(prices)
            diff = abs(prices[0] - prices[-1])
            return {"average": mean, "spread": diff}
    except Exception:
        pass
    return {"average": 0, "spread": 0}


def calc_technical(prices):
    spread = prices.get("spread", 0)
    return round(min(5, spread or 1), 2)


def sentiment_score():
    base = random.uniform(-2, 2)
    return round(base, 2)


def aggregate_signal():
    news = fetch_news()
    news_score, tokens = score_news(news)
    prices = fetch_price()
    tech_score = calc_technical(prices)
    sent = sentiment_score()
    total = round(0.4 * news_score + 0.4 * tech_score + 0.2 * sent, 2)
    if total > 2:
        signal = "Bullish"
    elif total < -2:
        signal = "Bearish"
    else:
        signal = "Neutral"
    rationale = (
        f"news_score={news_score} tokens={','.join(tokens)} | "
        f"tech={tech_score} spread={prices.get('spread'):.2f} | "
        f"sentiment={sent}"
    )
    return {
        "ts": datetime.utcnow().isoformat() + "Z",
        "news": headlines_text(news),
        "news_score": news_score,
        "technical_score": tech_score,
        "price": prices,
        "sentiment_score": sent,
        "total_score": total,
        "signal": signal,
        "rationale": rationale,
        "headlines": news,
    }


def headlines_text(items):
    return [f"{item['title']} ({item['source']})" for item in items]


def dump(signal):
    path = SIGNAL_DIR / f"signal-{datetime.utcnow():%Y%m%d-%H%M%S}.json"
    path.write_text(json.dumps(signal, indent=2, ensure_ascii=False))
    with open(SIGNAL_DIR / "latest.json", "w", encoding="utf-8") as fh:
        json.dump(signal, fh, indent=2, ensure_ascii=False)


def main():
    signal = aggregate_signal()
    dump(signal)
    print(json.dumps(signal, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
