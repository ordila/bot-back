import axios from 'axios';

export class OpenAIService {
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      return response.status === 200;
    } catch {
      return false;
    }
  }
}
