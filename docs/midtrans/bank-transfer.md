# Integration: Bank Transfer

Basic integration process for Bank Transfer (Virtual Account) is explained in this section.\
Your customers can make payments using the _Bank Transfer_ payment method provided by Midtrans. You will be notified when customer completes the transaction using this option. A list of VA acquiring banks supported by Midtrans is given below.

- BCA Virtual Account
- BNI Virtual Account
- BRI Virtual Account
- Mandiri Bill Payment
- Permata Virtual Account
- CIMB Virtual Account
- Danamon Virtual Account (only via BI-SNAP version of Core API : [Payment Method : Bank Transfer](https://docs.midtrans.com/reference/virtual-account-api-bank-transfer))

VA can be paid from any banks (support inter-bank transfer) for BNI, BRI, Permata and CIMB, as long as the transferred fund is received in time.

<br />

> 📘 Note
>
> Please make sure to create your [Midtrans account](/docs/midtrans-account), before proceeding with this section.

<br />

<details>
  <summary><b>Sequence Diagram</b></summary>

  <article>
    The overall *Bank Transfer* end-to-end payment process is illustrated in following sequence diagram.

    ![](https://files.readme.io/ae4f081-core_api-sequence_bank_transfer.png "core_api-sequence_bank_transfer.png")

  </article>
</details>

<br />

---

# Sandbox Environment

<br />

The steps given below use Midtrans Sandbox environment to test the integration process. Please make sure that you use the _Server Key_ and _Client Key_ for the _Sandbox_ environment. For more details, refer to [Retrieving API Access Keys](/docs/midtrans-account#retrieving-api-access-keys).

<br />

---

# Steps for Integration

<br />

<br />

## 1. Sending Transaction Data to API Charge

<br />

The table given below describes the various elements required for sending the transaction data to the _Charge API_.

| Requirement    | Description                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Server Key     | The server key. For more details, refer to [Retrieving API Access Keys](/docs/midtrans-account#retrieving-api-access-keys). |
| `order_id`     | The order_id of the transaction.                                                                                            |
| `gross_amount` | The total amount of transaction.                                                                                            |
| `payment_type` | The payment method.                                                                                                         |

<br />

### Request Details

| Environment | Method | URL                                                                                      |
| ----------- | ------ | ---------------------------------------------------------------------------------------- |
| Sandbox     | POST   | [https://api.sandbox.midtrans.com/v2/charge](https://api.sandbox.midtrans.com/v2/charge) |
| Production  | POST   | [https://api.midtrans.com/v2/charge](https://api.midtrans.com/v2/charge)                 |

<br />

### HTTP Headers

```text
Accept: application/json
Content-Type: application/json
Authorization: Basic AUTH_STRING
```

**AUTH_STRING**: Base64Encode(`"YourServerKey"+":"`)

> 📘
>
> Midtrans API validates HTTP request by using Basic Authentication method. The username is your **Server Key** while the password is empty. The authorization header value is represented by AUTH_STRING. AUTH_STRING is base-64 encoded string of your username and password separated by colon symbol (**:**). For more details, refer to [ API Authorization and Headers](/docs/api-authorization-headers).

<br />

### Sample Request and Request Body

The sample request for _Charge API_ is given below. The request is in CURL but you can implement it according to your backend language. For more details, refer to available [Language Libraries](/docs/midtrans-api-libraries-plugins#language-library). The example below shows a sample code to obtain the VA number.

```json BCA
curl -X POST \
  https://api.sandbox.midtrans.com/v2/charge \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic <YOUR SERVER KEY ENCODED in Base64>' \
  -H 'Content-Type: application/json' \
  -d '{
  "payment_type": "bank_transfer",
  "transaction_details": {
      "order_id": "order-101",
      "gross_amount": 44000
  },
  "bank_transfer":{
      "bank": "bca"
  }
}'
```

```json BNI
curl -X POST \
  https://api.sandbox.midtrans.com/v2/charge \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic <YOUR SERVER KEY ENCODED in Base64>' \
  -H 'Content-Type: application/json' \
  -d '{
  "payment_type": "bank_transfer",
  "transaction_details": {
      "order_id": "order-101",
      "gross_amount": 44000
  },
  "bank_transfer":{
      "bank": "bni"
  }
}'
```

```json BRI
curl -X POST \
  https://api.sandbox.midtrans.com/v2/charge \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic <YOUR SERVER KEY ENCODED in Base64>' \
  -H 'Content-Type: application/json' \
  -d '{
  "payment_type": "bank_transfer",
  "transaction_details": {
      "order_id": "order-101",
      "gross_amount": 44000
  },
  "bank_transfer":{
      "bank": "bri"
  }
}'
```

```json Mandiri Bill
curl -X POST \
  https://api.sandbox.midtrans.com/v2/charge \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic <YOUR SERVER KEY ENCODED in Base64>' \
  -H 'Content-Type: application/json' \
  -d '{
  "payment_type": "echannel",
  "transaction_details": {
      "order_id": "order-101",
      "gross_amount": 44000
  },
  "echannel" : {
      "bill_info1" : "Payment:",
      "bill_info2" : "Online purchase"
  }
}'
```

```json Permata
curl -X POST \
  https://api.sandbox.midtrans.com/v2/charge \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic <YOUR SERVER KEY ENCODED in Base64>' \
  -H 'Content-Type: application/json' \
  -d '{
  "payment_type": "permata",
  "transaction_details": {
      "order_id": "order-101",
      "gross_amount": 44000
  }
}'
```

```json CIMB
curl -X POST \
  https://api.sandbox.midtrans.com/v2/charge \
  -H 'Accept: application/json' \
  -H 'Authorization: Basic <YOUR SERVER KEY ENCODED in Base64>' \
  -H 'Content-Type: application/json' \
  -d '{
  "payment_type": "bank_transfer",
  "transaction_details": {
      "order_id": "order-101",
      "gross_amount": 44000
  },
  "bank_transfer":{
      "bank": "cimb"
  }
}'
```

<details>
  <summary>Post Body JSON Attribute Description for BCA, BNI, BRI, CIMB</summary>

  <article>
    | Element              | Description                                                          | Type   | Required |
    | -------------------- | -------------------------------------------------------------------- | ------ | -------- |
    | payment\_type        | The *Bank Transfer* payment method.                                  | String | Required |
    | transaction\_details | The details of the transaction like the order\_id and gross\_amount. | -      | Required |
    | order\_id            | The order ID of the transaction.                                     | String | Required |
    | gross\_amount        | The total amount of transaction, defined from your side.             | String | Required |
    | bank\_transfer       | The bank transfer details such as name of the bank.                  | -      | Required |
    | bank                 | The name of the acquiring bank which process the transaction.        | String | Required |
  </article>
</details>

<details>
  <summary>Post Body JSON Attribute Description for Mandiri Bill</summary>

  <article>
    | Element              | Description                                                                                   | Type                                                           | Required |
    | -------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------- |
    | payment\_type        | The *E-channel* payment method.                                                               | String                                                         | Required |
    | transaction\_details | The details of the transaction like the order\_id and gross\_amount.                          | -                                                              | Required |
    | order\_id            | The order ID of the transaction.                                                              | String                                                         | Required |
    | gross\_amount        | The total amount of transaction, defined from your side.                                      | String                                                         | Required |
    | echannel             | Charge details using Mandiri Bill Payment.                                                    | [Object](https://docs.midtrans.com/reference/e-channel-object) | Required |
    | bill\_info1          | Label 1. Mandiri allows only 10 characters. Exceeding characters will be truncated.           | String                                                         | Required |
    | bill\_info2          | Value for Label 1. Mandiri allows only 30 characters. Exceeding characters will be truncated. | String                                                         | Required |

    You can customize with your own message to the customer on the `bill_info` params. It will usually shown when customer attempt to pay via ATM or MBanking app, during confirmation of transfer. For example you can show something like `Payment:` `Purchase at myonlinestore.com`, or `Deposit:` `John Doe at myinvestment.com`

  </article>
</details>

<details>
  <summary>Post Body JSON Attribute Description for Permata</summary>

  <article>
    | Element              | Description                                                          | Type   | Required |
    | -------------------- | -------------------------------------------------------------------- | ------ | -------- |
    | payment\_type        | The *Bank Transfer* payment method.                                  | String | Required |
    | transaction\_details | The details of the transaction like the order\_id and gross\_amount. | -      | Required |
    | order\_id            | The order ID of the transaction.                                     | String | Required |
    | gross\_amount        | The total amount of transaction, defined from your side.             | String | Required |
  </article>
</details>

> 📘 Tips
>
> You can [include more information](/docs/coreapi-advanced-features#recommended-parameters) such as `customer_details`, `item_details`, and so on. It is recommended to send more details regarding the transaction, so that these details will be captured on the transaction record. Which can be [viewed on the Midtrans Dashboard](/docs/midtrans-dashboard-usage#transaction).

You can also customize the output virtual account number for the transaction. For more details, please refer to [Specifying VA Number](#Specifying-VA-Number).

Learn more on why this API request [should be securely managed from your backend](/docs/payment-security#keep-sensitive-parameters-secured).

<br />

### Sample Response and Response Body

The sample response and description of response body for _Bank Transfer_ payment method is shown below.

```json BCA
{
  "status_code": "201",
  "status_message": "Success, Bank Transfer transaction is created",
  "transaction_id": "be03df7d-2f97-4c8c-a53c-8959f1b67295",
  "order_id": "1571823229",
  "merchant_id": "G812785002",
  "gross_amount": "44000.00",
  "currency": "IDR",
  "payment_type": "bank_transfer",
  "transaction_time": "2019-10-23 16:33:49",
  "transaction_status": "pending",
  "va_numbers": [
    {
      "bank": "bca",
      "va_number": "812785002530231"
    }
  ],
  "fraud_status": "accept"
}
```

```json BNI
{
  "status_code": "201",
  "status_message": "Success, Bank Transfer transaction is created",
  "transaction_id": "2194a77c-a412-4fd8-8ec8-121ff64fbfee",
  "order_id": "1571823369",
  "merchant_id": "G812785002",
  "gross_amount": "44000.00",
  "currency": "IDR",
  "payment_type": "bank_transfer",
  "transaction_time": "2019-10-23 16:36:08",
  "transaction_status": "pending",
  "va_numbers": [
    {
      "bank": "bni",
      "va_number": "9888500212345678"
    }
  ],
  "fraud_status": "accept"
}
```

```json BRI
{
  "status_code": "201",
  "status_message": "Success, Bank Transfer transaction is created",
  "transaction_id": "9aed5972-5b6a-401e-894b-a32c91ed1a3a",
  "order_id": "1466323342",
  "gross_amount": "20000.00",
  "payment_type": "bank_transfer",
  "transaction_time": "2016-06-19 15:02:22",
  "transaction_status": "pending",
  "va_numbers": [
    {
      "bank": "bri",
      "va_number": "8578000000111111"
    }
  ],
  "fraud_status": "accept",
  "currency": "IDR"
}
```

```json Mandiri Bill
{
  "status_code": "201",
  "status_message": "OK, Mandiri Bill transaction is successful",
  "transaction_id": "abb2d93f-dae3-4183-936d-4145423ad72f",
  "order_id": "1571823332",
  "merchant_id": "G812785002",
  "gross_amount": "44000.00",
  "currency": "IDR",
  "payment_type": "echannel",
  "transaction_time": "2019-10-23 16:35:31",
  "transaction_status": "pending",
  "fraud_status": "accept",
  "bill_key": "778347787706",
  "biller_code": "70012"
}
```

```json Permata
{
  "status_code": "201",
  "status_message": "Success, PERMATA VA transaction is successful",
  "transaction_id": "035ca76c-b814-4264-9e63-68142351df83",
  "order_id": "1571823410",
  "gross_amount": "44000.00",
  "currency": "IDR",
  "payment_type": "bank_transfer",
  "transaction_time": "2019-10-23 16:36:49",
  "transaction_status": "pending",
  "fraud_status": "accept",
  "permata_va_number": "850003072869607",
  "merchant_id": "G812785002"
}
```

```json CIMB
{
  "status_code": "201",
  "status_message": "Success, Bank Transfer transaction is created",
  "transaction_id": "2194a77c-a412-4fd8-8ec8-121ff64fbfee",
  "order_id": "1571823369",
  "merchant_id": "G812785002",
  "gross_amount": "44000.00",
  "currency": "IDR",
  "payment_type": "bank_transfer",
  "transaction_time": "2022-10-23 16:36:08",
  "transaction_status": "pending",
  "va_numbers": [
    {
      "bank": "cimb",
      "va_number": "2810490150230740"
    }
  ],
  "expiry_time": "2023-06-29 15:15:58"
}
```

<details>
  <summary>Response Body JSON Attribute Description for BCA</summary>

  <article>
    | Element             | Description                                                            | Type   | Notes                                                                                              |
    | ------------------- | ---------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
    | status\_code        | The status of the API call.                                            | String | For more details, refer to [Status Codes and Error](/docs/error-code-and-response-code).           |
    | status\_message     | The message describing the status of the transaction.                  | String | -                                                                                                  |
    | transaction\_id     | The *Transaction ID* of the specific transaction.                      | String | -                                                                                                  |
    | order\_id           | The specific *Order ID.*                                               | String | -                                                                                                  |
    | merchant\_id        | Your merchant ID.                                                      | String | -                                                                                                  |
    | gross\_amount       | The total amount of transaction for the specific order.                | String | -                                                                                                  |
    | currency            | The unit of currency used for the transaction.                         | String | -                                                                                                  |
    | payment\_type       | The type of payment method used by the customer for the transaction.   | String | -                                                                                                  |
    | transaction\_time   | The date and time at which the transaction occurred.                   | String | It is in the format, *YYYY-MM-DD* *HH:MM:SS.*<br />Time zone: Western Indonesian Time (GMT+7).     |
    | transaction\_status | The status of the transaction.                                         | String | For more details, refer to [Transaction Status](/docs/get-status-api-requests#transaction-status). |
    | va\_number          | The virtual account number consisting of bank name and account number. | String | -                                                                                                  |
    | bank                | The name of the acquiring bank which process the transaction.          | String | -                                                                                                  |
    | fraud\_status       | The fraud status of the transaction.                                   | String | For more details, refer to [Fraud Status](/docs/get-status-api-requests#fraud-status).             |
  </article>
</details>

<details>
  <summary>Response Body JSON Attribute Description for BNI</summary>

  <article>
    | Element             | Description                                                            | Type   | Notes                                                                                              |
    | ------------------- | ---------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
    | status\_code        | The status of the API call.                                            | String | For more details, refer to [Status Codes and Error](/docs/error-code-and-response-code).           |
    | status\_message     | The message describing the status of the transaction.                  | String | -                                                                                                  |
    | transaction\_id     | The *Transaction ID* of the specific transaction.                      | String | -                                                                                                  |
    | order\_id           | The specific *Order ID.*                                               | String | -                                                                                                  |
    | merchant\_id        | Your merchant ID.                                                      | String | -                                                                                                  |
    | gross\_amount       | The total amount of transaction for the specific order.                | String | -                                                                                                  |
    | currency            | The unit of currency used for the transaction.                         | String | -                                                                                                  |
    | payment\_type       | The type of payment method used by the customer for the transaction.   | String | -                                                                                                  |
    | transaction\_time   | The date and time at which the transaction occurred.                   | String | It is in the format, *YYYY-MM-DD* *HH:MM:SS.*<br />Time zone: Western Indonesian Time (GMT+7).     |
    | transaction\_status | The status of the transaction.                                         | String | For more details, refer to [Transaction Status](/docs/get-status-api-requests#transaction-status). |
    | va\_number          | The virtual account number consisting of bank name and account number. | String | -                                                                                                  |
    | bank                | The name of the acquiring bank which process the transaction.          | String | -                                                                                                  |
    | fraud\_status       | The fraud status of the transaction.                                   | String | For more details, refer to [Fraud Status](/docs/get-status-api-requests#fraud-status).             |
  </article>
</details>

<details>
  <summary>Response Body JSON Attribute Description for BRI</summary>

  <article>
    | Element             | Description                                                            | Type   | Notes                                                                                              |
    | ------------------- | ---------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
    | status\_code        | The status of the API call.                                            | String | For more details, refer to [Status Codes and Error](/docs/error-code-and-response-code).           |
    | status\_message     | The message describing the status of the transaction.                  | String | -                                                                                                  |
    | transaction\_id     | The *Transaction ID* of the specific transaction.                      | String | -                                                                                                  |
    | order\_id           | The specific *Order ID.*                                               | String | -                                                                                                  |
    | gross\_amount       | The total amount of transaction for the specific order.                | String | -                                                                                                  |
    | payment\_type       | The type of payment method used by the customer for the transaction.   | String | -                                                                                                  |
    | transaction\_time   | The date and time at which the transaction occurred.                   | String | It is in the format, *YYYY-MM-DD* *HH:MM:SS.*<br />Time zone: Western Indonesian Time (GMT+7).     |
    | transaction\_status | The status of the transaction.                                         | String | For more details, refer to [Transaction Status](/docs/get-status-api-requests#transaction-status). |
    | va\_number          | The virtual account number consisting of bank name and account number. | String | -                                                                                                  |
    | bank                | The name of the acquiring bank which process the transaction.          | String | -                                                                                                  |
    | fraud\_status       | The fraud status of the transaction.                                   | String | For more details, refer to [Fraud Status](/docs/get-status-api-requests#fraud-status).             |
    | currency            | The unit of currency used for the transaction.                         | String | -                                                                                                  |
  </article>
</details>

<details>
  <summary>Response Body JSON Attribute Description for Mandiri Bill</summary>

  <article>
    | Element             | Description                                                          | Type   | Notes                                                                                              |
    | ------------------- | -------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
    | status\_code        | The status of the API call.                                          | String | For more details, refer to [Status Codes and Error](/docs/error-code-and-response-code).           |
    | status\_message     | The message describing the status of the transaction.                | String | -                                                                                                  |
    | transaction\_id     | The *Transaction ID* of the specific transaction.                    | String | -                                                                                                  |
    | order\_id           | The specific *Order ID.*                                             | String | -                                                                                                  |
    | merchant\_id        | Your merchant ID.                                                    | String | -                                                                                                  |
    | gross\_amount       | The total amount of transaction for the specific order.              | String | -                                                                                                  |
    | currency            | The unit of currency used for the transaction.                       | String | -                                                                                                  |
    | payment\_type       | The type of payment method used by the customer for the transaction. | String | -                                                                                                  |
    | transaction\_time   | The date and time at which the transaction occurred.                 | String | It is in the format, *YYYY-MM-DD* *HH:MM:SS.*<br />Time zone: Western Indonesian Time (GMT+7).     |
    | transaction\_status | The status of the transaction.                                       | String | For more details, refer to [Transaction Status](/docs/get-status-api-requests#transaction-status). |
    | fraud\_status       | The fraud status of the transaction.                                 | String | For more details, refer to [Fraud Status](/docs/get-status-api-requests#fraud-status).             |
    | bill\_key           | Midtrans company code.                                               | String | -                                                                                                  |
    | biller\_code        | The payment (bill) number.                                           | String | -                                                                                                  |

    > 📘
    >
    > You will get the `bill_key` and `bill_code` attribute.

  </article>
</details>

<details>
  <summary>Response Body JSON Attribute Description for Permata</summary>

  <article>
    | Element             | Description                                                           | Type   | Notes                                                                                              |
    | ------------------- | --------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
    | status\_code        | The status of the API call.                                           | String | For more details, refer to [Status Codes and Error](/docs/error-code-and-response-code).           |
    | status\_message     | The message describing the status of the transaction.                 | String | -                                                                                                  |
    | transaction\_id     | The *Transaction ID* of the specific transaction.                     | String | -                                                                                                  |
    | order\_id           | The specific *Order ID*                                               | String | -                                                                                                  |
    | gross\_amount       | The total amount of transaction for the specific order                | String | -                                                                                                  |
    | currency            | The unit of currency used for the transaction                         | String | -                                                                                                  |
    | payment\_type       | The type of payment method used by the customer for the transaction   | String | -                                                                                                  |
    | transaction\_time   | The date and time at which the transaction occurred                   | String | It is in the format, *YYYY-MM-DD* *HH:MM:SS.*<br />Time zone: Western Indonesian Time (GMT+7).     |
    | transaction\_status | The status of the transaction                                         | String | For more details, refer to [Transaction Status](/docs/get-status-api-requests#transaction-status). |
    | fraud\_status       | The fraud status of the transaction                                   | String | For more details, refer to [Fraud Status](/docs/get-status-api-requests#fraud-status).             |
    | permata\_va\_number | The virtual account number consisting of bank name and account number | String | -                                                                                                  |
    | merchant\_id        | Your merchant ID                                                      | String | -                                                                                                  |

    > 📘 Note
    >
    > You will get the `permata_va_number` attribute in place of `va_number`

  </article>
</details>

<details>
  <summary>Response Body JSON Attribute Description for CIMB</summary>

  <article>
    | Element             | Description                                                            | Type   | Notes                                                                                              |
    | ------------------- | ---------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
    | status\_code        | The status of the API call.                                            | String | For more details, refer to [Status Codes and Error](/docs/error-code-and-response-code).           |
    | status\_message     | The message describing the status of the transaction.                  | String | -                                                                                                  |
    | transaction\_id     | The *Transaction ID* of the specific transaction.                      | String | -                                                                                                  |
    | order\_id           | The specific *Order ID.*                                               | String | -                                                                                                  |
    | merchant\_id        | Your merchant ID.                                                      | String | -                                                                                                  |
    | gross\_amount       | The total amount of transaction for the specific order.                | String | -                                                                                                  |
    | currency            | The unit of currency used for the transaction.                         | String | -                                                                                                  |
    | payment\_type       | The type of payment method used by the customer for the transaction.   | String | -                                                                                                  |
    | transaction\_time   | The date and time at which the transaction occurred.                   | String | It is in the format, *YYYY-MM-DD* *HH:MM:SS.*<br />Time zone: Western Indonesian Time (GMT+7).     |
    | transaction\_status | The status of the transaction.                                         | String | For more details, refer to [Transaction Status](/docs/get-status-api-requests#transaction-status). |
    | va\_number          | The virtual account number consisting of bank name and account number. | String | -                                                                                                  |
    | bank                | The name of the acquiring bank which process the transaction.          | String | -                                                                                                  |
    | fraud\_status       | The fraud status of the transaction.                                   | String | For more details, refer to [Fraud Status](/docs/get-status-api-requests#fraud-status).             |
    | expiry\_time        | The expiry time for the Virtual account                                | String | -                                                                                                  |
  </article>
</details>

<br />

## 2. Displaying Virtual Account Number and Expiry Time

<br />

By default the expiry time for Bank Transfer / VA is **24 hours**. Follow this [instruction](/docs/coreapi-advanced-features#custom-transaction-expiry) to customize the expiry time.\ <br />

### Creating Test Payment

Read [here](/docs/testing-payment-on-sandbox#bank-transfer) to simulate/test success payment on sandbox environment.

<br />

## 3. Handling Transaction Notification

<br />

HTTP POST request with JSON body will be sent to your server's _Notification URL_ configured on dashboard.

<details>
  <summary><b>Configuring Payment Notification URL</b></summary>

  <article>
    To configure the Payment Notification URL, follow the steps given below.

    1. Log in to your MAP account.
    2. On the Home page, go to **Settings > Configuration**. *Configuration* page is displayed.
    3. Enter **Payment Notification URL**.
    4. Click **Update**. <br />A confirmation message is displayed.\
       ![](./../../asset/image/coreapi/core-api-payment-notification-1.png)\ <br />The *Payment Notification URL* is configured.

  </article>
</details>

See also : [HTTP(S) Notification/Webhooks](/docs/https-notification-webhooks)

<br />

### Transaction Status Description

The description of `transaction_status` value for _Bank Transfer_ payment method is given below.

| Transaction Status | Description                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------ |
| settlement         | Transaction is successfully paid, customer has completed the transaction.                  |
| pending            | Transaction is created successfully but it is not completed by the customer.               |
| expire             | Transaction is failed as the payment is not done by customer within the given time period. |
| cancel             | Transaction is cancelled by you.                                                           |
| deny               | Transaction is rejected by the bank.                                                       |

For more detail on transaction_status & fraud_status, see [here](/docs/transaction-status-cycle).

<br />

---

# <b>Specifying VA Number</b>

<br />

- Only digits are allowed.
- Different banks have different specifications for their custom VA numbers. Please go through the documentation of the respective banks. Note: for **Permata, only B2B VA type** support custom VA numbers, so by default your sandbox account may not support Permata custom VA, please contact us if you wish to have this feature.
- If the number provided is currently active for another order, then a different unique number will be used instead.
- If the number provided is longer than required, then the unnecessary digits in the end will be trimmed.
- If the number provided is shorter than required, then the number will be prefixed with zeros.

Midtrans creates a random VA number for transaction using _Bank Transfer_ payment method. You can customize this VA Number, by adding`bank_transfer` parameters in the Charge API Request Body as shown below.

Please add **bank_transfer** parameter during [Charge API Request](/docs/coreapi-core-api-bank-transfer-integration#sample-request-and-request-body).

```json BCA
...
  "bank_transfer":{
    "bank": "bca",
    "va_number": "12345678911",
    "bca": {
      "sub_company_code": "00000" //NOTE: Don't send this field unless BCA give you sub company code
    }
  }
...
```

```json BNI
...
  "bank_transfer":{
    "bank": "bni",
    "va_number": "12345678"
  }
...
```

```json BRI
...
  "bank_transfer":{
    "bank": "bri",
    "va_number": "12345678"
  }
...
```

```json Mandiri Bill
...
  "echannel" : {
    "bill_info1" : "Payment:",
    "bill_info2" : "Online purchase",
    "bill_key" : "081211111111"
}
...
```

```json Permata
...
  "bank_transfer":{
    "bank": "permata",
    "va_number": "1234567890"
  }
...
```

```json CIMB
...
  "bank_transfer":{
    "bank": "cimb",
    "va_number": "12345678"
  }
...
```

## VA Number Specification

| Parameter               | Type   | Required | Description                                                                                                                  |
| ----------------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| BCA `va_number`         | String | Optional | Length should be within 1 to 11.                                                                                             |
| BCA `sub_company_code`  | String | Optional | BCA sub company code directed for this transactions. <br />NOTE: Don't send this field unless BCA give you sub company code. |
| Permata `va_number`     | String | Optional | Length should be 10. Only supported for b2b VA type.                                                                         |
| BNI `va_number`         | String | Optional | Length should be within 1 to 8.                                                                                              |
| BRI `va_number`         | String | Optional | Length should be within 1 to 13.                                                                                             |
| Mandiri Bill `bill_key` | String | Optional | Length should be within 6 to 12.                                                                                             |
| CIMB `va_number`        | String | Optional | Length should be within 1 to 12.                                                                                             |

> 📘 Note
>
> In _Production_ environment, not every bank may support custom VA number (e.g. Permata), as the default state. It depends on the type of VA configured for your merchant account & your business agreement with the bank. Please consult Midtrans Activation team for further information.
