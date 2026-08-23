import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { PreVisitAIResult, PostVisitAIResult } from '../types/index.js';

export class LLMService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.ai.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
      } catch (error) {
        console.warn('[LLMService] Failed to initialize Gemini API client. Using fallback engine.');
      }
    }
  }

  /**
   * Generates a pre-visit symptom analysis
   * Prompt requirement: "Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>"
   */
  async generatePreVisitSummary(symptoms: string): Promise<PreVisitAIResult> {
    const prompt = `You are a medical AI triage assistant. Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptoms}

Return ONLY valid JSON strictly adhering to this structure without markdown fences:
{
  "urgencyLevel": "Low" | "Medium" | "High",
  "chiefComplaint": "A concise summary of the primary complaint",
  "suggestedQuestions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}`;

    if (this.genAI && config.ai.geminiApiKey) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedText = this.cleanJsonResponse(text);
        const parsed = JSON.parse(cleanedText);

        const validated: PreVisitAIResult = {
          urgencyLevel: ['Low', 'Medium', 'High'].includes(parsed.urgencyLevel)
            ? parsed.urgencyLevel
            : 'Medium',
          chiefComplaint: String(parsed.chiefComplaint || 'Patient reported symptoms'),
          suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
            ? parsed.suggestedQuestions.slice(0, 3).map(String)
            : [
                'When did these symptoms first appear?',
                'Are you experiencing any other related discomfort?',
                'Are you currently taking any regular medications?',
              ],
        };

        return validated;
      } catch (error: any) {
        console.error('[LLMService Pre-Visit Generation Error]:', error?.message || error);
        // Fall through to resilient fallback generator
      }
    }

    // Resilient Fallback Engine
    return this.generateFallbackPreVisitSummary(symptoms);
  }

  /**
   * Generates a post-visit patient-friendly summary and medication breakdown
   * Prompt requirement: "Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>"
   */
  async generatePostVisitSummary(notes: string): Promise<PostVisitAIResult> {
    const prompt = `You are a healthcare communication expert. Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${notes}

Return ONLY valid JSON strictly adhering to this structure without markdown fences:
{
  "summary": "A warm, easy-to-understand explanation of diagnosis and general plan",
  "medications": [
    {
      "name": "Medication Name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice daily",
      "duration": "e.g. 7 days",
      "instructions": "e.g. Take with food"
    }
  ],
  "followUpSteps": [
    "Step 1",
    "Step 2"
  ]
}`;

    if (this.genAI && config.ai.geminiApiKey) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedText = this.cleanJsonResponse(text);
        const parsed = JSON.parse(cleanedText);

        const validated: PostVisitAIResult = {
          summary: String(parsed.summary || 'Summary of clinical visit and care plan.'),
          medications: Array.isArray(parsed.medications)
            ? parsed.medications.map((m: any) => ({
                name: String(m.name || 'Prescribed item'),
                dosage: String(m.dosage || 'As directed'),
                frequency: String(m.frequency || 'Once daily'),
                duration: String(m.duration || 'As directed'),
                instructions: m.instructions ? String(m.instructions) : 'Take as instructed',
              }))
            : [],
          followUpSteps: Array.isArray(parsed.followUpSteps)
            ? parsed.followUpSteps.map(String)
            : ['Rest adequately and drink plenty of fluids', 'Contact doctor if symptoms worsen'],
        };

        return validated;
      } catch (error: any) {
        console.error('[LLMService Post-Visit Generation Error]:', error?.message || error);
        // Fall through to resilient fallback generator
      }
    }

    // Resilient Fallback Engine
    return this.generateFallbackPostVisitSummary(notes);
  }

  /**
   * Removes markdown code blocks if the LLM returned ```json ... ```
   */
  private cleanJsonResponse(text: string): string {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean;
  }

  /**
   * Resilient fallback parser for pre-visit symptoms
   */
  private generateFallbackPreVisitSummary(symptoms: string): PreVisitAIResult {
    const lower = symptoms.toLowerCase();
    let urgency: 'Low' | 'Medium' | 'High' = 'Low';

    const highTriggers = ['chest pain', 'shortness of breath', 'severe bleeding', 'unconscious', 'stroke', 'emergency', 'heart attack', 'extreme pain'];
    const mediumTriggers = ['fever', 'persistent', 'vomiting', 'dizziness', 'fracture', 'migraine', 'infection', 'moderate'];

    if (highTriggers.some((t) => lower.includes(t))) {
      urgency = 'High';
    } else if (mediumTriggers.some((t) => lower.includes(t)) || symptoms.length > 80) {
      urgency = 'Medium';
    }

    // Extract first sentence or summarize
    const sentences = symptoms.split(/[.!?\n]+/).filter(Boolean);
    const chiefComplaint = sentences.length > 0 
      ? sentences[0].trim().slice(0, 150) 
      : 'General health evaluation';

    return {
      urgencyLevel: urgency,
      chiefComplaint: chiefComplaint,
      suggestedQuestions: [
        'How long have you noticed these symptoms, and have they progressed over time?',
        'Does anything specific aggravate or relieve the symptoms?',
        'Do you have any existing chronic conditions or family history related to this?',
      ],
    };
  }

  /**
   * Resilient fallback parser for post-visit clinical notes
   */
  private generateFallbackPostVisitSummary(notes: string): PostVisitAIResult {
    const lines = notes.split('\n').map((l) => l.trim()).filter(Boolean);
    
    return {
      summary: `Care Summary: ${lines.slice(0, 2).join(' ') || 'The doctor has evaluated your condition and provided the following treatment instructions.'}`,
      medications: [
        {
          name: 'Prescribed Medication',
          dosage: 'As indicated on prescription bottle',
          frequency: 'As directed by physician',
          duration: 'Complete the full course',
          instructions: 'Take with plenty of water',
        },
      ],
      followUpSteps: [
        'Take all prescribed medications according to schedule.',
        'Monitor your symptoms closely and report any unexpected side effects.',
        'Schedule a follow-up consultation if symptoms persist past the expected duration.',
      ],
    };
  }
}

export const llmService = new LLMService();
export default llmService;
