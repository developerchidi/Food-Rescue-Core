import { getPartnershipEmailTemplate } from '../../lib/templates/partnershipEmail';

describe('Templates - Partnership Email', () => {
  const name = 'Nguyen Van A';
  const email = 'partner@example.com';
  const company = 'FoodCo Vietnam';
  const phone = '0912345678';
  const type = 'Nha hang';
  const message = 'Chung toi muon hop tac';

  it('should return an object with subject, text, and html', () => {
    const result = getPartnershipEmailTemplate(name, email, company, phone, type, message);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('html');
  });

  it('should include company name in subject', () => {
    const result = getPartnershipEmailTemplate(name, email, company, phone, type, message);
    expect(result.subject).toContain(company);
  });

  it('should include company, phone, type, and message in HTML', () => {
    const result = getPartnershipEmailTemplate(name, email, company, phone, type, message);
    expect(result.html).toContain(company);
    expect(result.html).toContain(phone);
    expect(result.html).toContain(type);
    expect(result.html).toContain(message);
  });
});
