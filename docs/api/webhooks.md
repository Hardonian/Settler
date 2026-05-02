# Webhooks

Settler uses webhooks to notify your application when events occur, such as a reconciliation run completing or an exception being auto-adjudicated.

## Signing

All webhook payloads are signed using an HMAC-SHA256 signature in the `Settler-Signature` header.
Verify the signature to ensure the webhook was sent by Settler.

## Retries

If your endpoint does not respond with a 2xx status code, Settler will retry delivery with exponential backoff for up to 3 days.

## Replaying Events

You can manually replay events via the Dashboard or the API:
`POST /api/v1/webhooks/events/:id/replay`
