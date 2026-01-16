---
url: https://app.swychrconnect.com/collection_api_doc
title: "SwychrPay - B2B Admin Dashboard App"
date: 2026-01-15T07:04:51.367Z
lang: en-US
---

*   Auth
    *   postObtain a bearer token for admin operations
*   Payment Link
    *   postCreate a payment link
*   Payment Link Status
    *   postGet status of a payment link by transaction id
*   Webhook
    *   postExample merchant webhook receiver (documentation)

[![redocly logo](https://cdn.redoc.ly/redoc/logo-mini.svg)API docs by Redocly](https://redocly.com/redoc/)

# Payin API (v1.0.3)

Download OpenAPI specification:[Download](https://api.accountpe.com/api-docs/v1/payin.yaml)

Payin API Support: [support@accountpe.com](mailto:support@accountpe.com) URL: [https://accountpe.com/support](https://accountpe.com/support) License: MIT

API for creating and checking statuses of payin payment links. This specification reflects observed production responses and includes:

*   /admin/auth -> { token, message, email }
*   /create\_payment\_links -> { data: { id, payment\_link, transaction\_id }, message, status }
*   /payment\_link\_status -> nested data.data.attributes resource
*   webhook callback that posts PaymentLinkStatusResponse to merchant callback\_url

## [](#tag/Auth)Auth

Authentication and token management

## [](#tag/Auth/operation/obtainAuthToken)Obtain a bearer token for admin operations

Exchange admin credentials for a JWT token. Token must be sent in Authorization header.

##### Authorizations:

_AuthToken_

##### Request Body schema: application/json

required

email

required

string <email>

password

required

string

### Responses

**200**

Logged in, token returned

**400**

Input validation failed

**401**

Authentication failed or missing token.

**500**

Internal server error

post/admin/auth

### Request samples

*   Payload

Content type

application/json

Copy

`{  *   "email": "admin@example.com",      *   "password": "strongPassword123"       }`

### Response samples

*   200
*   400
*   401
*   500

Content type

application/json

Copy

`{  *   "token": "eyJhbGciOiJIUzI1NiJ9.eyJh...",      *   "message": "11-28-2025 00:01",      *   "email": "hk2604@gmail.com"       }`

## [](#tag/Payment-Link)Payment Link

Create and manage payment links

## [](#tag/Payment-Link/operation/createPaymentLink)Create a payment link

Create a hosted payment link for collecting payment. Clients should supply an Idempotency-Key header to prevent duplicate link creation on retries.

Redirect behavior after payment completion:

*   On success:
    1.  If callback\_url is configured, hosted UI redirects to that callback\_url.
    2.  Otherwise hosted UI redirects to [https://app.swychrconnect.com/payment\_success](https://app.swychrconnect.com/payment_success)
*   On failure:
    *   Hosted UI always redirects to [https://app.swychrconnect.com/payment\_failed](https://app.swychrconnect.com/payment_failed)

Webhook behavior:

*   If callback\_url is provided, the platform will POST the PaymentLinkStatusResponse payload to that URL whenever the status updates (header X-Swychr-Signature included for verification if configured).

##### Authorizations:

_AuthToken_

##### header Parameters

Idempotency-Key

string

Idempotency key to deduplicate requests

##### Request Body schema: application/json

required

country\_code

required

string^\[A-Za-z\]{2,3}$

ISO 3166-1 alpha-2 or alpha-3 code

name

required

string

email

required

string <email>

mobile

string

E.164 recommended (but not enforced)

amount

required

number <double>

currency

string

transaction\_id

required

string

description

string

pass\_digital\_charge

required

boolean

callback\_url

string <uri>

Optional merchant callback URL to receive status updates

### Responses

**200**

Payment Link Successfully Created

**201**

Created

**400**

Input validation failed

**401**

Authentication failed or missing token.

**404**

Country or currency not supported

**409**

Conflict - duplicate transaction\_id or idempotency mismatch

**422**

Input validation failed

**429**

Too Many Requests

**500**

Internal server error

post/create\_payment\_links

### Request samples

*   Payload

Content type

application/json

Copy

`{  *   "country_code": "CM",      *   "name": "Rahul Sharma",      *   "email": "rahul@example.com",      *   "mobile": "919876543210",      *   "amount": 149.5,      *   "currency": "XAF",      *   "transaction_id": "txn_20251126_0001",      *   "description": "Payment for order #1234",      *   "pass_digital_charge": true,      *   "callback_url": "[https://merchant.example.com/webhook/payment_status](https://merchant.example.com/webhook/payment_status)"       }`

### Response samples

*   200
*   201
*   400
*   401
*   404
*   409
*   422
*   429
*   500

Content type

application/json

Copy

Expand all Collapse all

`{  *   "data": {          *   "id": 6682,              *   "payment_link": "[https://app.swychrconnect.com/payment/35cfd792-66b4-4db2-940d-a694f15bd11c](https://app.swychrconnect.com/payment/35cfd792-66b4-4db2-940d-a694f15bd11c)",              *   "transaction_id": "txn_20251126_0001"                   },      *   "message": "Payment link created successfully",      *   "status": 200       }`

## [](#tag/Payment-Link-Status)Payment Link Status

Retrieve or poll the status of a payment link

## [](#tag/Payment-Link-Status/operation/getPaymentLinkStatus)Get status of a payment link by transaction id

Returns the current status of the payment link and payment details if completed. This endpoint accepts transaction\_id created by the client when creating the link.

Redirect behavior (hosted UI):

*   On success (e.g. status = 1):
    1.  If callback\_url set, hosted UI redirects to that URL.
    2.  If not set, hosted UI redirects to [https://app.swychrconnect.com/payment\_success](https://app.swychrconnect.com/payment_success)
*   On failure:
    *   Hosted UI redirects to [https://app.swychrconnect.com/payment\_failed](https://app.swychrconnect.com/payment_failed)

Webhook behavior:

*   If callback\_url is configured, platform POSTs PaymentLinkStatusResponse to the callback\_url on status updates.

##### Authorizations:

_AuthToken_

##### header Parameters

X-Request-Id

string <uuid>

Client trace id

##### Request Body schema: application/json

required

transaction\_id

required

string

### Responses

**200**

Payment link status retrieved successfully

**400**

Input validation failed

**401**

Authentication failed or missing token.

**404**

Resource not found

**500**

Internal server error

### Callbacks

postWebhook POST to merchant callback\_url when payment status updates

post/payment\_link\_status

### Request samples

*   Payload

Content type

application/json

Copy

`{  *   "transaction_id": "txn_20251126_0001"       }`

### Response samples

*   200
*   400
*   401
*   404
*   500

Content type

application/json

Copy

Expand all Collapse all

`{  *   "data": {          *   "data": {                  *   "type": "payment-links",                      *   "id": "6682",                      *   "attributes": {                          *   "id": 6682,                              *   "name": "Rahul Sharma",                              *   "email": "rahul@example.com",                              *   "mobile": "919876543210",                              *   "amount": 149.5,                              *   "currency_code": "XAF",                              *   "country": "Cameroon",                              *   "country_code": "CM",                              *   "status": 0,                              *   "created_at": "2025-11-27T00:04:05.835+05:30",                              *   "description": "Payment for order",                              *   "expired_at": "2025-11-27T01:04:05.833+05:30",                              *   "payment_uuid": "[https://app.swychrconnect.com/payment/35cfd792-66b4-4db2-940d-a694f15bd11c](https://app.swychrconnect.com/payment/35cfd792-66b4-4db2-940d-a694f15bd11c)",                              *   "transaction_id": "txn_20251126_0001",                              *   "pass_digital_charge": true,                              *   "net_payable": 153.2375,                              *   "admin_name": "harshit",                              *   "admin_email": "hk2604@gmail.com",                              *   "callback_url": "[https://merchant.example.com/webhook/payment_status](https://merchant.example.com/webhook/payment_status)",                              *   "redirect_behavior": {                                  *   "success": {                                          *   "when_callback_set": "Redirects to the callback_url if set.",                                              *   "when_callback_not_set": "Redirects to https://app.swychrconnect.com/payment_success when callback_url not set."                                                                   },                                      *   "failure": {                                          *   "default_failure_url": "[https://app.swychrconnect.com/payment_failed](https://app.swychrconnect.com/payment_failed)"                                                                   }                                                       }                                           },                      *   "links": {                          *   "self": "/payment-links/6682"                                           }                               }                   },      *   "message": "Payment link details retrieved successfully",      *   "status": 200       }`

### Callback payload samples

Callback

POST: Webhook POST to merchant callback\_url when payment status updates

Content type

application/json

Copy

Expand all Collapse all

`{  *   "data": {          *   "data": {                  *   "type": "payment-links",                      *   "id": "6682",                      *   "attributes": {                          *   "id": 6682,                              *   "name": "Rahul Sharma",                              *   "email": "rahul@example.com",                              *   "mobile": "919876543210",                              *   "amount": 149.5,                              *   "currency_code": "XAF",                              *   "country": "Cameroon",                              *   "country_code": "CM",                              *   "status": 0,                              *   "created_at": "2025-11-27T00:04:05.835+05:30",                              *   "description": "Payment for order",                              *   "expired_at": "2025-11-27T01:04:05.833+05:30",                              *   "payment_uuid": "[https://app.swychrconnect.com/payment/35cfd792-66b4-4db2-940d-a694f15bd11c](https://app.swychrconnect.com/payment/35cfd792-66b4-4db2-940d-a694f15bd11c)",                              *   "transaction_id": "txn_20251126_0001",                              *   "pass_digital_charge": true,                              *   "net_payable": 153.2375,                              *   "admin_name": "harshit",                              *   "admin_email": "hk2604@gmail.com",                              *   "callback_url": "[https://merchant.example.com/webhook/payment_status](https://merchant.example.com/webhook/payment_status)",                              *   "redirect_behavior": {                                  *   "success": {                                          *   "when_callback_set": "Redirects to the callback_url if set.",                                              *   "when_callback_not_set": "Redirects to https://app.swychrconnect.com/payment_success when callback_url not set."                                                                   },                                      *   "failure": {                                          *   "default_failure_url": "[https://app.swychrconnect.com/payment_failed](https://app.swychrconnect.com/payment_failed)"                                                                   }                                                       }                                           },                      *   "links": {                          *   "self": "/payment-links/6682"                                           }                               }                   },      *   "message": "Payment link details retrieved successfully",      *   "status": 200       }`

## [](#tag/Webhook)Webhook

Merchant webhook receiver (example)

## [](#tag/Webhook/operation/merchantWebhookExample)Example merchant webhook receiver (documentation)

Example endpoint showing what merchants should implement to receive webhook events. The POST body is identical to PaymentLinkStatusResponse.

##### Authorizations:

_AuthToken_

##### Request Body schema: application/json

required

data

required

object (PaymentLinkStatusData)

message

required

string

status

required

integer

### Responses

**200**

Merchant must respond 200 to acknowledge receipt

**400**

Invalid payload

post/merchant/webhook/payment\_status

### Request samples

*   Payload

Content type

application/json

Copy

Expand all Collapse all

`{  *   "data": {          *   "data": {                  *   "type": "payment-links",                      *   "id": "6682",                      *   "attributes": {                          *   "id": 6682,                              *   "name": "Rahul Sharma",                              *   "email": "rahul@example.com",                              *   "mobile": "919876543210",                              *   "amount": 149.5,                              *   "currency_code": "XAF",                              *   "country": "Cameroon",                              *   "country_code": "CM",                              *   "status": 0,                              *   "created_at": "2025-11-27T00:04:05.835+05:30",                              *   "description": "Payment for order",                              *   "expired_at": "2025-11-27T01:04:05.833+05:30",                              *   "payment_uuid": "[https://app.swychrconnect.com/payment/35cfd792-66b4-4db2-940d-a694f15bd11c](https://app.swychrconnect.com/payment/35cfd792-66b4-4db2-940d-a694f15bd11c)",                              *   "transaction_id": "txn_20251126_0001",                              *   "pass_digital_charge": true,                              *   "net_payable": 153.2375,                              *   "admin_name": "harshit",                              *   "admin_email": "hk2604@gmail.com",                              *   "callback_url": "[https://merchant.example.com/webhook/payment_status](https://merchant.example.com/webhook/payment_status)",                              *   "redirect_behavior": {                                  *   "success": {                                          *   "when_callback_set": "Redirects to the callback_url if set.",                                              *   "when_callback_not_set": "Redirects to https://app.swychrconnect.com/payment_success when callback_url not set."                                                                   },                                      *   "failure": {                                          *   "default_failure_url": "[https://app.swychrconnect.com/payment_failed](https://app.swychrconnect.com/payment_failed)"                                                                   }                                                       }                                           },                      *   "links": {                          *   "self": "/payment-links/6682"                                           }                               }                   },      *   "message": "Payment link details retrieved successfully",      *   "status": 200       }`
