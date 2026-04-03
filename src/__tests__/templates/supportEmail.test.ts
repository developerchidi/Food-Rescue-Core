import { getSupportEmailTemplate } from '../../lib/templates/supportEmail';

describe('Templates - Support Email', () => {
  const name = 'Nguyen Van A';
  const email = 'test@example.com';
  const message = 'Toi can ho tro ve don hang';

  it('should return an object with subject, text, and html', () => {
    const result = getSupportEmailTemplate(name, email, message);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('html');
  });

  it('should include sender name in subject', () => {
    const result = getSupportEmailTemplate(name, email, message);
    expect(result.subject).toContain(name);
    expect(result.subject).toContain('[Food Rescue]');
  });

  it('should include name, email, and message in HTML body', () => {
    const result = getSupportEmailTemplate(name, email, message);
    expect(result.html).toContain(name);
    expect(result.html).toContain(email);
    expect(result.html).toContain(message);
  });
});
