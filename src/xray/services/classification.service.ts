import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs';
import {
  ScoliosisConditionResponse,
  ScoliosisCurveResponse,
  ClassificationResult,
} from '../dto/classification.dto';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  private readonly flaskBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Default to localhost:8000 if not configured
    this.flaskBaseUrl =
      this.configService.get<string>('FLASK_API_URL') ||
      'http://localhost:8000';
  }

  /**
   * Classifies an X-ray image for scoliosis condition and curve type
   * @param imagePath Path to the uploaded image file
   * @returns Classification results
   */
  async classifyXray(imagePath: string): Promise<ClassificationResult> {
    try {
      this.logger.log(`Starting classification for image: ${imagePath}`);

      // First, check if the image shows scoliosis
      const conditionResult = await this.checkScoliosisCondition(imagePath);

      const result: ClassificationResult = {
        condition: conditionResult,
        timestamp: new Date(),
      };

      // If scoliosis is detected, classify the curve type
      if (conditionResult.predicted_class === 'scoliosis') {
        this.logger.log('Scoliosis detected, classifying curve type...');
        result.curve = await this.classifyScoliosisCurve(imagePath);
      }

      this.logger.log(
        `Classification completed: ${JSON.stringify(result, null, 2)}`,
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Classification failed for image ${imagePath}: ${errorMessage}`,
        errorStack,
      );
      throw new HttpException(
        'Failed to classify X-ray image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calls the Flask API to check if the image shows scoliosis condition
   */
  private async checkScoliosisCondition(
    imagePath: string,
  ): Promise<ScoliosisConditionResponse> {
    try {
      const formData = await this.createFormData(imagePath);
      const response = await fetch(
        `${this.flaskBaseUrl}/check_scoliosis_condition`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as ScoliosisConditionResponse;
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to check scoliosis condition: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Calls the Flask API to classify the scoliosis curve type
   */
  private async classifyScoliosisCurve(
    imagePath: string,
  ): Promise<ScoliosisCurveResponse> {
    try {
      const formData = await this.createFormData(imagePath);
      const response = await fetch(
        `${this.flaskBaseUrl}/classify_scoliosis_curve`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as ScoliosisCurveResponse;
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to classify scoliosis curve: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Creates FormData with the image file for the API request
   */
  private async createFormData(imagePath: string): Promise<FormData> {
    const formData = new FormData();

    // Read the file as a Blob
    const fileStream = createReadStream(imagePath);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      fileStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      fileStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const blob = new Blob([buffer]);
        formData.append('file', blob, 'xray.jpg');
        formData.append('enable_cropping', 'false');
        resolve(formData);
      });
      fileStream.on('error', reject);
    });
  }
}
