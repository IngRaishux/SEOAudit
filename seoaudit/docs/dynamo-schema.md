# DynamoDB Schema

Single-table design. Table name: `seo-optimizer` (configurable via `DYNAMO_TABLE_NAME`).

## Keys

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | String | Partition key |
| `SK` | String | Sort key |

## Item types

### Site metadata

| PK | SK | Attributes |
|----|----|-----------|
| `SITE#<siteId>` | `METADATA` | `domain`, `sitemapUrl`, `lastCrawledAt`, `totalPages`, `createdAt` |

### Crawled page

| PK | SK | Attributes |
|----|----|-----------|
| `SITE#<siteId>` | `PAGE#<encodedUrl>` | `url`, `crawledAt`, `statusCode`, `metaTitle`, `metaDescription`, `h1`, `wordCount`, `loadTimeMs`, `issueCount` |

### AI suggestions

| PK | SK | Attributes |
|----|----|-----------|
| `SITE#<siteId>` | `SUGGESTION#<encodedUrl>` | `pageUrl`, `generatedAt`, `suggestions` (JSON) |

## GSI — GSI1

Used to query pages by status code within a site.

| GSI1PK | GSI1SK |
|--------|--------|
| `SITE#<siteId>#STATUS#<statusCode>` | `<crawledAt ISO8601>` |

## Access patterns

| Pattern | Operation |
|---------|-----------|
| List all pages for a site | Query `PK = SITE#<id>`, `SK begins_with PAGE#` |
| Get site metadata | GetItem `PK = SITE#<id>`, `SK = METADATA` |
| Get suggestions for a page | GetItem `PK = SITE#<id>`, `SK = SUGGESTION#<url>` |
| Pages with 4xx errors | Query GSI1 `GSI1PK = SITE#<id>#STATUS#404` |
