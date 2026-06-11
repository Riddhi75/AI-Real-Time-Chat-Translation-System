import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatHubService {
  private hubConnection!: HubConnection;
  private messageReceivedSource = new Subject<any>();
  messageReceived$ = this.messageReceivedSource.asObservable();

  constructor() { }

  startConnection(token: string): Promise<void> {
    console.log('🔌 Starting SignalR connection...');
    
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5118/chathub', {
        accessTokenFactory: () => token,
        transport: 1  // WebSocket only (faster)
      })
      .withAutomaticReconnect()
      .build();

    // Connection events
    this.hubConnection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting...', error);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected!', connectionId);
    });

    this.hubConnection.onclose((error) => {
      console.log('❌ SignalR connection closed', error);
    });

    // Message received from server
    this.hubConnection.on('ReceiveMessage', (message) => {
      console.log('📨 Message received from server:', message);
      this.messageReceivedSource.next(message);
    });

    // Message sent confirmation
    this.hubConnection.on('MessageSent', (message) => {
      console.log('✅ Message sent confirmation:', message);
      this.messageReceivedSource.next({ type: 'sent', data: message });
    });

    // Translation update
    this.hubConnection.on('UpdateMessageTranslation', (update) => {
      console.log('🔄 Translation update:', update);
      this.messageReceivedSource.next({ type: 'update', data: update });
    });

    // User online status
    this.hubConnection.on('UserOnline', (userId) => {
      console.log('🟢 User online:', userId);
      this.messageReceivedSource.next({ type: 'online', userId });
    });

    // User offline status
    this.hubConnection.on('UserOffline', (userId) => {
      console.log('🔴 User offline:', userId);
      this.messageReceivedSource.next({ type: 'offline', userId });
    });

    // Typing indicator
    this.hubConnection.on('UserTyping', (userId) => {
      console.log('⌨️ User typing:', userId);
      this.messageReceivedSource.next({ type: 'typing', userId });
    });

    return this.hubConnection.start();
  }

  sendMessage(receiverId: number, message: string, targetLanguage: string): void {
    if (!this.hubConnection) {
      console.error('❌ HubConnection not initialized!');
      return;
    }
    
    console.log(`📤 Sending message to ${receiverId}: "${message}" (Target: ${targetLanguage})`);
    
    this.hubConnection.invoke('SendMessage', receiverId, message, targetLanguage)
      .catch(err => console.error('❌ Send error:', err));
  }

  typing(receiverId: number): void {
    if (!this.hubConnection) return;
    
    this.hubConnection.invoke('Typing', receiverId)
      .catch(err => console.error('❌ Typing error:', err));
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      console.log('🔌 SignalR connection stopped');
    }
  }
}