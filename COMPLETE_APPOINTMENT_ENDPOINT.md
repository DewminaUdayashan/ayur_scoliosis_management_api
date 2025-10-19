# Complete Appointment Endpoint

## Overview
This endpoint allows practitioners to mark an appointment as completed after the session has concluded.

## Endpoint Details

**URL:** `PATCH /appointments/:id/complete`

**Method:** `PATCH`

**Authentication:** Required (JWT Bearer token)

**Authorization:** Practitioner role only

**Path Parameters:**
- `id` (string, required) - The ID of the appointment to complete

## Request

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Example Request
```bash
curl -X PATCH \
  'http://localhost:3000/appointments/appointment-uuid-here/complete' \
  -H 'Authorization: Bearer your-jwt-token-here'
```

## Response

### Success Response (200 OK)

Returns the updated appointment object with status changed to `Completed`.

```json
{
  "id": "appointment-uuid",
  "name": "Follow-up Consultation",
  "patientId": "patient-uuid",
  "practitionerId": "practitioner-uuid",
  "appointmentDateTime": "2025-10-20T10:00:00.000Z",
  "durationInMinutes": 60,
  "type": "Physical",
  "status": "Completed",
  "notes": "Regular check-up",
  "patient": {
    "id": "patient-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  },
  "practitioner": {
    "id": "practitioner-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "dr.smith@clinic.com",
    "phone": "+0987654321"
  }
}
```

### Error Responses

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Appointment not found.",
  "error": "Not Found"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You do not have permission to complete this appointment.",
  "error": "Forbidden"
}
```

#### 409 Conflict - Already Completed
```json
{
  "statusCode": 409,
  "message": "This appointment is already completed.",
  "error": "Conflict"
}
```

#### 409 Conflict - Cancelled Appointment
```json
{
  "statusCode": 409,
  "message": "Cannot complete a cancelled appointment.",
  "error": "Conflict"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Business Logic

### What Happens When You Complete an Appointment:

1. **Validation:**
   - Verifies the appointment exists
   - Checks that the requesting practitioner owns the appointment
   - Ensures the appointment is not already completed
   - Ensures the appointment is not cancelled

2. **Update:**
   - Changes appointment status from `Scheduled` or `PendingPatientConfirmation` to `Completed`

3. **Notification:**
   - Sends an email to the patient notifying them that the appointment has been completed
   - Email includes appointment details and practitioner information

### Valid Status Transitions

An appointment can be marked as completed if its current status is:
- ✅ `Scheduled`
- ✅ `PendingPatientConfirmation`

An appointment **cannot** be marked as completed if:
- ❌ Already `Completed`
- ❌ Status is `Cancelled`
- ❌ Status is `NoShow`

## Usage Example

### Frontend (JavaScript/TypeScript)
```typescript
async function completeAppointment(appointmentId: string, token: string) {
  try {
    const response = await fetch(
      `http://localhost:3000/appointments/${appointmentId}/complete`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const completedAppointment = await response.json();
    console.log('Appointment completed:', completedAppointment);
    return completedAppointment;
  } catch (error) {
    console.error('Error completing appointment:', error);
    throw error;
  }
}
```

### Frontend (Flutter/Dart)
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> completeAppointment(
  String appointmentId,
  String token,
) async {
  final url = Uri.parse(
    'http://localhost:3000/appointments/$appointmentId/complete',
  );

  try {
    final response = await http.patch(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final completedAppointment = json.decode(response.body);
      print('Appointment completed: $completedAppointment');
      return completedAppointment;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message']);
    }
  } catch (error) {
    print('Error completing appointment: $error');
    rethrow;
  }
}
```

## Email Notification

When an appointment is completed, the patient receives an email with:

**Subject:** "Appointment Completed - Ayurveda Clinic"

**Content:**
- Patient's name
- Practitioner's name
- Appointment date and time
- Completion confirmation
- Link to patient portal (if applicable)

**Example Email:**
```
Appointment Completed

Hello John Doe,

Your appointment with Dr. Jane Smith has been marked as completed.

Date & Time: Monday, October 20, 2025, 10:00 AM
Practitioner: Dr. Jane Smith
Status: COMPLETED

Thank you for visiting our clinic. You can view your appointment 
history and any notes from this session in your patient portal.
```

## Swagger/OpenAPI Documentation

This endpoint is documented in Swagger UI with:
- Complete request/response schemas
- Authentication requirements (Bearer token)
- Role-based access control (Practitioner only)
- All possible response codes and error messages

Access Swagger documentation at: `http://localhost:3000/api`

## Related Endpoints

- `GET /appointments` - Get list of appointments
- `GET /appointments/:id` - Get appointment details
- `POST /appointments/schedule` - Create new appointment
- `PATCH /appointments/:id` - Update appointment
- `PATCH /appointments/:id/respond` - Patient response to appointment

## Testing

### Manual Testing with cURL
```bash
# 1. Login as practitioner to get token
curl -X POST http://localhost:3000/auth/login/practitioner \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "practitioner@example.com",
    "password": "password123"
  }'

# 2. Complete an appointment (use token from step 1)
curl -X PATCH http://localhost:3000/appointments/appointment-id-here/complete \
  -H 'Authorization: Bearer <token-from-step-1>'
```

### Test Cases

1. ✅ **Valid completion** - Practitioner completes their own scheduled appointment
2. ❌ **Unauthorized** - Patient tries to complete an appointment
3. ❌ **Forbidden** - Practitioner tries to complete another practitioner's appointment
4. ❌ **Already completed** - Trying to complete an already completed appointment
5. ❌ **Cancelled appointment** - Trying to complete a cancelled appointment
6. ❌ **Invalid appointment ID** - Non-existent appointment

## Notes

- Only practitioners can complete appointments
- The appointment must belong to the authenticated practitioner
- Patient receives email notification upon completion
- Status change is permanent and cannot be reverted through this endpoint
- Consider adding a session notes feature when completing appointments
- May want to add a completion timestamp field in future updates
