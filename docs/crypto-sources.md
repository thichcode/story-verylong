# Crypto Macro Sources (Thiên thời)

Danh sách nguồn tin macro giúp đánh giá "Thiên thời" cho crypto. Các nguồn sau đều có RSS hoặc JSON khả dụng:

1. [Coindesk News](https://www.coindesk.com/arc/outboundfeeds/rss/) – Macro crypto + regulation.
2. [Cointelegraph](https://cointelegraph.com/rss) – Cover global policy & market sentiment.
3. [CryptoSlate RSS](https://cryptoslate.com/feed/) – On-chain + macro narratives.
4. [CoinMarketCap Reports](https://coinmarketcap.com/alexandria/rss) – Research + trending tokens.
5. [Investing.com Crypto News](https://www.investing.com/rss/news_25.rss) – Economic events affecting digital assets.
6. [Bloomberg Crypto](https://www.bloomberg.com/markets/cryptocurrencies) – (Manual parse via HTTP, fallback to summary scraping.)

Mẹo:
- Những nguồn có RSS (Coindesk, Cointelegraph, CryptoSlate) có thể cắm trực tiếp vào `scripts/crypto_thien_thoi.py`.
- Dùng từ khoá như "Fed", "CPI", "regulation" để tăng trọng số "Thiên thời".
- Khi không có kết nối, script sẽ tạo thông báo giả (dummy news) để giữ tracker hoạt động.
