# X-ray Measurement API

This API allows practitioners to create, retrieve, update, and delete measurements for X-ray images. Each measurement consists of four points defining two lines and a calculated Cobb angle.

## Database Schema

### XRayMeasurement Model
```
- id: UUID (Primary Key)
- xrayImageId: UUID (Foreign Key to XRayImage)
- line1StartX: Decimal (X coordinate of first line start point)
- line1StartY: Decimal (Y coordinate of first line start point)  
- line1EndX: Decimal (X coordinate of first line end point)
- line1EndY: Decimal (Y coordinate of first line end point)
- line2StartX: Decimal (X coordinate of second line start point)
- line2StartY: Decimal (Y coordinate of second line start point)
- line2EndX: Decimal (X coordinate of second line end point)
- line2EndY: Decimal (Y coordinate of second line end point)
- cobbAngle: Decimal (Calculated Cobb angle in degrees)
- createdById: UUID (Foreign Key to AppUser - practitioner who created it)
- createdAt: DateTime
- updatedAt: DateTime
- notes: String (Optional notes)
```

## API Endpoints

### 1. Create/Replace Measurements
**POST** `/xray/measurements`

**Access:** Practitioners and Admins only

**Behavior:** This endpoint replaces all existing measurements for the specified X-ray image with the new measurements provided in the request. Any previous measurements will be permanently deleted.

**Request Body:**
```json
{
  "xrayImageId": "uuid-of-xray-image",
  "measurements": [
    {
      "line1Start": { "x": 100.5, "y": 200.3 },
      "line1End": { "x": 150.2, "y": 250.7 },
      "line2Start": { "x": 200.1, "y": 180.9 },
      "line2End": { "x": 250.4, "y": 230.1 },
      "cobbAngle": 25.7,
      "notes": "Optional measurement notes"
    }
  ]
}
```

**Response:**
```json
{
  "code": "MEASUREMENTS_SAVED",
  "message": "Measurements saved successfully. Previous measurements have been replaced.",
  "data": [
    {
      "id": "measurement-uuid",
      "xrayImageId": "xray-uuid",
      "line1StartX": 100.5,
      "line1StartY": 200.3,
      "line1EndX": 150.2,
      "line1EndY": 250.7,
      "line2StartX": 200.1,
      "line2StartY": 180.9,
      "line2EndX": 250.4,
      "line2EndY": 230.1,
      "cobbAngle": 25.7,
      "createdById": "practitioner-uuid",
      "createdAt": "2024-10-13T10:30:00Z",
      "updatedAt": "2024-10-13T10:30:00Z",
      "notes": "Optional measurement notes"
    }
  ]
}
```

### 2. Get Measurements for X-ray
**GET** `/xray/measurements/{xrayImageId}`

**Access:** Patients (own X-rays), Practitioners, and Admins

**Response:**
```json
{
  "code": "MEASUREMENTS_RETRIEVED",
  "data": {
    "xrayImageId": "xray-uuid",
    "measurements": [
      {
        "id": "measurement-uuid",
        "line1Start": { "x": 100.5, "y": 200.3 },
        "line1End": { "x": 150.2, "y": 250.7 },
        "line2Start": { "x": 200.1, "y": 180.9 },
        "line2End": { "x": 250.4, "y": 230.1 },
        "cobbAngle": 25.7,
        "notes": "Optional measurement notes",
        "createdBy": {
          "id": "practitioner-uuid",
          "firstName": "Dr. John",
          "lastName": "Smith",
          "role": "Practitioner"
        },
        "createdAt": "2024-10-13T10:30:00Z",
        "updatedAt": "2024-10-13T10:30:00Z"
      }
    ]
  }
}
```

### 3. Update Measurement
**PUT** `/xray/measurements/{measurementId}`

**Access:** Practitioners and Admins (can only update their own measurements)

**Request Body:**
```json
{
  "measurement": {
    "line1Start": { "x": 105.5, "y": 205.3 },
    "line1End": { "x": 155.2, "y": 255.7 },
    "line2Start": { "x": 205.1, "y": 185.9 },
    "line2End": { "x": 255.4, "y": 235.1 },
    "cobbAngle": 27.2,
    "notes": "Updated measurement notes"
  }
}
```

**Response:**
```json
{
  "code": "MEASUREMENT_UPDATED",
  "message": "Measurement updated successfully.",
  "data": {
    "id": "measurement-uuid",
    "xrayImageId": "xray-uuid",
    "line1StartX": 105.5,
    "line1StartY": 205.3,
    "line1EndX": 155.2,
    "line1EndY": 255.7,
    "line2StartX": 205.1,
    "line2StartY": 185.9,
    "line2EndX": 255.4,
    "line2EndY": 235.1,
    "cobbAngle": 27.2,
    "createdById": "practitioner-uuid",
    "createdAt": "2024-10-13T10:30:00Z",
    "updatedAt": "2024-10-13T10:35:00Z",
    "notes": "Updated measurement notes"
  }
}
```

### 4. Delete Measurement
**DELETE** `/xray/measurements/{measurementId}`

**Access:** Practitioners and Admins (can only delete their own measurements)

**Response:**
```json
{
  "code": "MEASUREMENT_DELETED",
  "message": "Measurement deleted successfully."
}
```

## Frontend Integration

The API response format is designed to match your frontend `Measurement` class structure:

```dart
class Measurement {
  Offset? line1Start;  // From API: { x: number, y: number }
  Offset? line1End;    // From API: { x: number, y: number }
  Offset? line2Start;  // From API: { x: number, y: number }
  Offset? line2End;    // From API: { x: number, y: number }
  double? cobbAngle;   // From API: number
}
```

## Error Responses

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "X-ray image not found",
  "error": "Not Found"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this X-ray",
  "error": "Forbidden"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

## Security & Access Control

- **Patients:** Can only view measurements for their own X-rays
- **Practitioners:** Can create, view, update, and delete measurements for any X-ray, but can only modify measurements they created
- **Admins:** Same permissions as practitioners
- All endpoints require JWT authentication
- Role-based access control is enforced on all endpoints

## Usage Flow

1. **Upload X-ray:** Patient uploads an X-ray image via `/xray/upload`
2. **Create Measurements:** Practitioner uses the X-ray image ID to create measurements
3. **View Measurements:** Patient or practitioner can view measurements for the X-ray
4. **Update/Delete:** Only the practitioner who created the measurements can modify them