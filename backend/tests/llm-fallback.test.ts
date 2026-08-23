import { describe, it, expect } from 'vitest';
import llmService from '../src/services/llm.service.js';

describe('LLM Service & Resilient Fail-Safe Engine', () => {
  it('should generate structured pre-visit summary with urgency level and questions', async () => {
    const symptoms = 'Severe chest tightness radiating to left shoulder with shortness of breath for 1 hour';
    const result = await llmService.generatePreVisitSummary(symptoms);

    expect(result).toBeDefined();
    expect(['Low', 'Medium', 'High']).toContain(result.urgencyLevel);
    expect(result.urgencyLevel).toBe('High'); // Due to chest pain triggers
    expect(result.chiefComplaint).toBeDefined();
    expect(Array.isArray(result.suggestedQuestions)).toBe(true);
    expect(result.suggestedQuestions.length).toBe(3);
  });

  it('should generate structured post-visit summary with medication schedule and follow-up steps', async () => {
    const clinicalNotes = 'Patient diagnosed with Acute Bronchitis. Prescribed Amoxicillin 500mg TID for 7 days. Drink plenty of warm fluids. Follow-up in 10 days if symptoms do not improve.';
    const result = await llmService.generatePostVisitSummary(clinicalNotes);

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.medications)).toBe(true);
    expect(Array.isArray(result.followUpSteps)).toBe(true);
    expect(result.followUpSteps.length).toBeGreaterThan(0);
  });
});
