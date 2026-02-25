# Apify API — Run Actor

**Endpoint:** `POST /v2/acts/{actorId}/runs`
**Base URL:** `https://api.apify.com`

Runs an Actor and immediately returns without waiting for the run to finish.
The POST payload (including its Content-Type header) is passed as INPUT to the Actor (usually `application/json`).
The Actor is started with default options; override them using URL query parameters.

Source: https://docs.apify.com/api/v2/act-runs-post

## URL Format

```
https://api.apify.com/v2/acts/{ACTOR_NAME_OR_ID}/runs?token={YOUR_TOKEN}&memory=8192&build=beta
```

## Query Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `token` | string | Yes | API authentication token | — |
| `memory` | number | No | Memory limit for the run in **megabytes**. Must be a power of 2 (128, 256, 512, 1024, 2048, 4096, ..., 32768). | Default Actor run configuration |
| `timeout` | number | No | Timeout for the Actor run in **seconds**. `0` = no timeout. | Default Actor run configuration |
| `build` | string | No | Tag or number of the Actor build to run (e.g. `beta` or `1.2.345`). | Default Actor run configuration (typically `latest`) |
| `waitForFinish` | number | No | Maximum seconds to wait for the run to finish (max ~300s for sync, 60s on API client side). `0` = return immediately. | `0` |
| `maxItems` | number | No | Max number of dataset items that will be **charged** for pay-per-result Actors. Does NOT limit actual output items. | None |
| `maxTotalChargeUsd` | number | No | Maximum cost of the Actor run (usage-based pricing). | None |
| `webhooks` | array | No | Optional webhooks associated with the Actor run for notifications. | None |
| `restartOnError` | boolean | No | Whether the run should restart upon failure. | `false` |

## Request Body

The POST body is forwarded directly to the Actor as its INPUT. Content type is usually `application/json`.

Example body for Google Places crawler:
```json
{
    "includeWebResults": false,
    "language": "de",
    "maxImages": 0,
    "maximumLeadsEnrichmentRecords": 0,
    "scrapeContacts": false,
    "scrapeDirectories": false,
    "scrapeImageAuthors": false,
    "scrapePlaceDetailPage": false,
    "scrapeReviewsPersonalData": true,
    "scrapeTableReservationProvider": false,
    "searchStringsArray": ["Sprachschule Berlin Germany"],
    "skipClosedPlaces": true
}
```

## Response

**Status:** `201 Created`
**Headers:** Includes `Location` header with the run URL.

Returns a Run object containing:
- `id` — Run ID
- `actId` — Actor ID
- `status` — Run status (`READY`, `RUNNING`, `SUCCEEDED`, `FAILED`, `ABORTING`, `ABORTED`, `TIMED-OUT`)
- `defaultDatasetId` — ID of the default dataset (use to retrieve results)
- `defaultKeyValueStoreId` — ID of the default key-value store
- `startedAt`, `finishedAt` — Timestamps
- `stats` — Run statistics

## Run Statuses

| Status | Description |
|--------|-------------|
| `READY` | Run is queued and waiting to start |
| `RUNNING` | Run is currently executing |
| `SUCCEEDED` | Run completed successfully |
| `FAILED` | Run failed with an error |
| `ABORTING` | Run is being aborted |
| `ABORTED` | Run was aborted by user |
| `TIMED-OUT` | Run exceeded the timeout limit |

## Related Endpoints

- **Get Run:** `GET /v2/acts/{actorId}/runs/{runId}`
- **List Runs:** `GET /v2/acts/{actorId}/runs`
- **Abort Run:** `POST /v2/acts/{actorId}/runs/{runId}/abort`
- **Get Dataset Items:** `GET /v2/datasets/{datasetId}/items`
- **Sync Run (wait for result):** `POST /v2/acts/{actorId}/run-sync-get-dataset-items`

## SDK Property Names (ActorStartOptions)

| SDK Property | API Query Param | Type | Description |
|--------------|-----------------|------|-------------|
| `memory` | `memory` | number | Memory in MB (power of 2) |
| `timeout` | `timeout` | number | Timeout in seconds |
| `build` | `build` | string | Build tag/number |
| `waitForFinish` | `waitForFinish` | number | Wait seconds |
| `maxItems` | `maxItems` | number | Max billable items |
| `maxTotalChargeUsd` | `maxTotalChargeUsd` | number | Max cost USD |
| `contentType` | Content-Type header | string | Input content type |
| `webhooks` | `webhooks` | array | Webhook configs |
| `restartOnError` | `restartOnError` | boolean | Restart on failure |
| `forcePermissionLevel` | — | enum | Override permissions |
