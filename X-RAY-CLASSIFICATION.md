# X-ray Classification Feature

This feature automatically classifies uploaded X-ray images using Flask AI endpoints and creates appropriate PatientEvent records.

## How it works

1. **X-ray Upload**: When a patient uploads an X-ray image via `POST /xray/upload`, the image is saved and a PatientEvent with `EventType.XRayUpload` is created.

2. **Background Classification**: Immediately after upload, a background process starts that:
   - Calls the Flask API at `http://localhost:8000/check_scoliosis_condition` to determine if scoliosis is present
   - If scoliosis is detected, calls `http://localhost:8000/classify_scoliosis_curve` to determine curve type
   - Creates a new PatientEvent with `EventType.AIClassification` and an associated `AIClassificationResult` record

3. **Classification Results**: The results are stored in the database with proper confidence scores and classification types mapped to the existing enum values.

## Configuration

Set the Flask API URL in your environment variables:
```bash
FLASK_API_URL=http://localhost:8000
```

If not set, it defaults to `http://localhost:8000`.

## Flask API Endpoints Expected

### Condition Classification
```bash
curl -X 'POST' \
  'http://localhost:8000/check_scoliosis_condition' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@your-xray.jpg;type=image/jpeg' \
  -F 'enable_cropping=false'
```

Expected response:
```json
{
  "predicted_class": "scoliosis", // or "normal"
  "confidence": "66.31%"
}
```

### Curve Classification (only called if scoliosis detected)
```bash
curl -X 'POST' \
  'http://localhost:8000/classify_scoliosis_curve' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@your-xray.jpg;type=image/jpeg' \
  -F 'enable_cropping=false'
```

Expected response:
```json
{
  "predicted_class": "S-Curve", // or "C-Curve"
  "confidence": "82.88%"
}
```

## Database Schema

The classification results are stored in the `AIClassificationResult` table:
- `classificationResult`: Enum value (NoScoliosisDetected, ScoliosisCCurve, ScoliosisSCurve, etc.)
- `confidenceScore`: Decimal confidence score (0.0 to 1.0)
- `notes`: Additional information about curve type if applicable

## API Endpoints

### Get All X-rays
```bash
GET /xray/all?userId={userId}  # For admin users
GET /xray/all                  # For patient users (gets their own)
```

### Upload X-ray (triggers classification)
```bash
POST /xray/upload
Content-Type: multipart/form-data

{
  "xrayImage": <file>,
  "notes": "Optional notes"
}
```

## Error Handling

- Classification errors are logged but don't prevent the X-ray upload from succeeding
- If Flask API is unavailable, the background process will log the error and continue
- Malformed responses from Flask API are handled gracefully

## Background Processing

The classification runs asynchronously after the X-ray upload completes, so:
- Users get immediate feedback on successful upload
- Classification results appear separately as new PatientEvents
- System remains responsive even if AI processing takes time