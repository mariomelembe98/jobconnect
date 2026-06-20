# Tempo Connect API

The OpenAPI 3.0 definition is available in [`openapi.yaml`](./openapi.yaml). It documents the current `/api/v1` public, authenticated, and administrator endpoints.

## Authentication

Authenticated operations use a Laravel Sanctum bearer token:

```http
Authorization: Bearer <token>
Accept: application/json
```

Obtain a token through `POST /api/v1/auth/login`. Operations marked without security in the specification are public.

## Viewing and generating clients

Import `docs/openapi.yaml` into an OpenAPI 3 compatible tool such as Swagger Editor, Swagger UI, Redoc, Postman, or an OpenAPI client generator. Change the `servers` entry or select the appropriate server for the target environment.

The API always returns the Tempo Connect `ApiResponse` envelope. Successful responses contain `success`, `message`, and `data`; errors contain `success`, `message`, and `errors`. Paginated collections include the shared `pagination` object inside `data`.
