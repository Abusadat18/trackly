import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiAnalysisResult {
  assessment: string;
  insights: string[];
  recommendations: string[];
  provider: 'ollama' | 'mock';
}

@Injectable()
export class OllamaProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('ollama.baseUrl') || 'http://localhost:11434';
  }

  private readonly SYSTEM_PROMPT = `
    You are an expert productivity analyst.

    Analyze team productivity data and provide:
    - A brief assessment (2-3 sentences)
    - 3-5 key insights
    - 2-3 actionable recommendations

    Rules:
    - Be concise
    - Be data-driven
    - Avoid filler text
    - Focus on productivity patterns and trends
    - Return plain text only, no markdown or formatting

    Format your response with these exact section headers:

    Assessment:
    Insights:
    Recommendations:
    `;

  async analyze(prompt: string): Promise<AiAnalysisResult> {
    const url = `${this.baseUrl}/api/generate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        system: this.SYSTEM_PROMPT,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 200 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with ${response.status}`);
    }

    const data: any = await response.json();
    const text: string = data.response || '';

    return this.parseResponse(text);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private parseResponse(text: string): AiAnalysisResult {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    let assessment = '';
    const insights: string[] = [];
    const recommendations: string[] = [];
    let section: 'assessment' | 'insights' | 'recommendations' = 'assessment';

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('insight') || lower.includes('key finding')) {
        section = 'insights';
        continue;
      }
      if (lower.includes('recommendation') || lower.includes('suggestion')) {
        section = 'recommendations';
        continue;
      }

      const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim();
      if (!cleaned) continue;

      switch (section) {
        case 'assessment':
          assessment += (assessment ? ' ' : '') + cleaned;
          break;
        case 'insights':
          insights.push(cleaned);
          break;
        case 'recommendations':
          recommendations.push(cleaned);
          break;
      }
    }

    return {
      assessment: assessment || text.slice(0, 300),
      insights: insights.slice(0, 5),
      recommendations: recommendations.slice(0, 3),
      provider: 'ollama',
    };
  }
}
