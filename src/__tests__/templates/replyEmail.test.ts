import { getReplyEmailTemplate } from '../../lib/templates/replyEmail';

describe('Templates - Reply Email', () => {
  const originalName = 'Nguyen Van A';
  const replyMessage = 'Cam on ban da lien he.\nChung toi se phan hoi som.';

  it('should return an object with subject, text, and html', () => {
    const result = getReplyEmailTemplate(originalName, replyMessage);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('html');
  });

  it('should include recipient name and reply content in text', () => {
    const result = getReplyEmailTemplate(originalName, replyMessage);
    expect(result.text).toContain(originalName);
    expect(result.text).toContain(replyMessage);
  });

  it('should convert newlines to <br/> in HTML body', () => {
    const result = getReplyEmailTemplate(originalName, replyMessage);
    expect(result.html).toContain('Cam on ban da lien he.<br/>Chung toi se phan hoi som.');
  });
});
