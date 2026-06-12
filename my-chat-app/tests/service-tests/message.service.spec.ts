import { MessageService } from '../../src/app/services/message.service';

describe('MessageService Tests', () => {

  it('1. MessageService class should exist', () => {
    expect(MessageService).toBeDefined();
  });

  it('2. MessageService should have getConversation method', () => {
    const mockHttp = {} as any;
    const service = new MessageService(mockHttp);
    expect(typeof service.getConversation).toBe('function');
  });

  it('3. MessageService should have sendMessage method', () => {
    const mockHttp = {} as any;
    const service = new MessageService(mockHttp);
    expect(typeof service.sendMessage).toBe('function');
  });

  it('4. MessageService should have deleteMessage method', () => {
    const mockHttp = {} as any;
    const service = new MessageService(mockHttp);
    expect(typeof service.deleteMessage).toBe('function');
  });

  it('5. MessageService should have editMessage method', () => {
    const mockHttp = {} as any;
    const service = new MessageService(mockHttp);
    expect(typeof service.editMessage).toBe('function');
  });
});