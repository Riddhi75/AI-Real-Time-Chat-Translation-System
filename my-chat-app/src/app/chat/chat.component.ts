import { Component, ElementRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { MessageService } from '../services/message.service';
import { ChatHubService } from '../services/chat-hub.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true
})
export class ChatComponent {
  @ViewChild('msgContainer') msgContainer!: ElementRef;

  currentUserId: number = 0;
  chats: any[] = [];
  filteredChats: any[] = [];
  messages: any[] = [];
  activeChat: number = 0;
  currentChat: any = null;
  newMessage: string = '';
  targetLang: string = 'hi';
  showTranslated: boolean = true;
  typing: boolean = false;
  typingUser: string = '';
  searchText: string = '';
  isLoading: boolean = true;
  isSubscribed: boolean = false;
  isSending: boolean = false;
  replyTo: any = null;
  editingMessage: any = null;
  editMessageText: string = '';
  
  // Scroll position save/restore
  private scrollPositionBeforeUpdate: number = 0;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService,
    private chatHubService: ChatHubService, 
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const userId = localStorage.getItem('userId');
    const token = this.authService.getToken();
    
    console.log('=== CHAT INITIALIZED ===');
    console.log('UserId:', userId);
    
    if (!userId || !token) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.currentUserId = parseInt(userId);
    
    this.loadRealUsers();
    
    if (token && !this.isSubscribed) {
      try {
        await this.chatHubService.startConnection(token);
        console.log('✅ SignalR connected!');
        
        this.chatHubService.messageReceived$.subscribe((data: any) => {
          this.ngZone.run(() => {
            console.log('📩 Message received:', data);
            if (!data) return;
            
            if (data.type === 'update') {
              const index = this.messages.findIndex(m => m.id === data.data.id);
              if (index !== -1) {
                this.messages[index].translatedText = data.data.translatedText;
                if (!this.messages[index].showOriginal) {
                  this.messages[index].displayText = data.data.translatedText;
                }
                this.messages = [...this.messages];
              }
              this.cdr.detectChanges();
              return;
            }
            
            const message = data;
            if (message.type === 'update') return;
            
            const exists = this.messages.some(m => m.id === message.id);
            if (exists) return;
            
            if (message.senderId === this.activeChat || message.receiverId === this.activeChat) {
              const newMsg = {
                id: message.id,
                sender: message.senderId === this.currentUserId ? 'me' : 'other',
                text: message.originalText,
                translatedText: message.translatedText || message.originalText,
                originalText: message.originalText,
                displayText: this.showTranslated ? (message.translatedText || message.originalText) : message.originalText,
                showOriginal: !this.showTranslated,
                time: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toDateString(),
                read: false
              };
              
              this.messages = [...this.messages, newMsg];
              this.scrollToBottom();
            }
            
            this.cdr.detectChanges();
          });
        });
        
        this.isSubscribed = true;
      } catch (err) {
        console.error('SignalR failed:', err);
      }
    }
  }

  loadRealUsers() {
    this.userService.getUsers().subscribe({
      next: (users: any[]) => {
        if (users && users.length > 0) {
          this.chats = users.map(user => ({
            id: user.id,
            name: user.username,
            avatar: user.username.charAt(0),
            lastMsg: 'Click to chat',
            time: '',
            unread: 0,
            online: user.isOnline || false
          }));
          this.filteredChats = [...this.chats];
          
          if (this.chats.length > 0 && this.activeChat === 0) {
            this.activeChat = this.chats[0].id;
            this.currentChat = this.chats[0];
            this.loadRealMessages(this.activeChat);
          }
        }
        this.isLoading = false;
      },
      error: (err) => console.error('Error loading users:', err)
    });
  }

  loadRealMessages(chatId: number) {
    this.messageService.getConversation(chatId).subscribe({
      next: (messages: any[]) => {
        if (messages && messages.length > 0) {
          this.messages = messages.map(msg => ({
            id: msg.id,
            sender: msg.senderId === this.currentUserId ? 'me' : 'other',
            text: msg.originalText,
            translatedText: msg.translatedText || msg.originalText,
            originalText: msg.originalText,
            displayText: this.showTranslated ? (msg.translatedText || msg.originalText) : msg.originalText,
            showOriginal: !this.showTranslated,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(msg.timestamp).toDateString(),
            read: msg.isRead
          }));
        } else {
          this.messages = [];
        }
        this.scrollToBottom();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading messages:', err)
    });
  }

  get groupedMessages() {
    const groups: any = {};
    this.messages.forEach(msg => {
      const date = msg.date || 'Today';
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return Object.keys(groups).map(key => ({ date: key, messages: groups[key] }));
  }

  selectChat(id: number) {
    this.activeChat = id;
    this.currentChat = this.chats.find(c => c.id === id);
    this.messages = [];
    this.loadRealMessages(id);
  }

  searchUsers() {
    if (!this.searchText) {
      this.filteredChats = [...this.chats];
      return;
    }
    this.filteredChats = this.chats.filter(chat => 
      chat.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  openNewChat() {
    this.router.navigate(['/register']);
  }

  deleteMessage(messageId: number) {
    if (confirm('Delete this message?')) {
      this.scrollPositionBeforeUpdate = this.msgContainer?.nativeElement?.scrollTop || 0;
      
      this.messageService.deleteMessage(messageId).subscribe({
        next: () => {
          this.messages = this.messages.filter(m => m.id !== messageId);
          this.cdr.detectChanges();
          
          setTimeout(() => {
            if (this.msgContainer && this.scrollPositionBeforeUpdate > 0) {
              this.msgContainer.nativeElement.scrollTop = this.scrollPositionBeforeUpdate;
            }
          }, 50);
          console.log('✅ Message deleted');
        },
        error: (err) => console.error('Delete error:', err)
      });
    }
  }

  editMessage(msg: any) {
    this.scrollPositionBeforeUpdate = this.msgContainer?.nativeElement?.scrollTop || 0;
    console.log('Saved scroll position:', this.scrollPositionBeforeUpdate);
    
    this.editingMessage = msg;
    this.editMessageText = msg.text;
    
    setTimeout(() => {
      if (this.msgContainer && this.scrollPositionBeforeUpdate > 0) {
        this.msgContainer.nativeElement.scrollTop = this.scrollPositionBeforeUpdate;
      }
    }, 50);
  }

  cancelEdit() {
    this.editingMessage = null;
    this.editMessageText = '';
  }

  saveEdit() {
    if (!this.editMessageText.trim()) return;
    
    console.log('Saving edit for message:', this.editingMessage.id, 'New text:', this.editMessageText);
    
    this.messageService.editMessage(this.editingMessage.id, this.editMessageText).subscribe({
      next: (response: any) => {
        console.log('Edit response:', response);
        const index = this.messages.findIndex(m => m.id === this.editingMessage.id);
        if (index !== -1) {
          this.messages[index].text = response.originalText || this.editMessageText;
          this.messages[index].originalText = response.originalText || this.editMessageText;
          this.messages[index].translatedText = response.translatedText || this.editMessageText;
          this.messages[index].displayText = this.showTranslated ? 
            (response.translatedText || this.editMessageText) : 
            (response.originalText || this.editMessageText);
          this.messages = [...this.messages];
          this.cdr.detectChanges();
          console.log('✅ Message updated in UI');
        }
        this.cancelEdit();
        
        setTimeout(() => {
          if (this.msgContainer && this.scrollPositionBeforeUpdate > 0) {
            this.msgContainer.nativeElement.scrollTop = this.scrollPositionBeforeUpdate;
            console.log('Restored scroll position to:', this.scrollPositionBeforeUpdate);
          }
        }, 50);
      },
      error: (err) => console.error('Edit error:', err)
    });
  }

  translateThisMessage(msg: any, targetLang: string) {
    console.log(`🔄 Translating message ${msg.id} to ${targetLang}`);
    
    this.scrollPositionBeforeUpdate = this.msgContainer?.nativeElement?.scrollTop || 0;
    
    this.messageService.translateMessage(msg.id, targetLang).subscribe({
      next: (response: any) => {
        msg.translatedText = response.translatedText;
        msg.translationLanguage = targetLang;
        
        if (!msg.showOriginal) {
          msg.displayText = response.translatedText;
        }
        this.messages = [...this.messages];
        this.cdr.detectChanges();
        console.log('✅ Message translated successfully');
        
        setTimeout(() => {
          if (this.msgContainer && this.scrollPositionBeforeUpdate > 0) {
            this.msgContainer.nativeElement.scrollTop = this.scrollPositionBeforeUpdate;
          }
        }, 50);
      },
      error: (err) => {
        console.error('Translation failed:', err);
      }
    });
  }

  toggleOriginal(msg: any) {
    this.scrollPositionBeforeUpdate = this.msgContainer?.nativeElement?.scrollTop || 0;
    
    msg.showOriginal = !msg.showOriginal;
    if (msg.showOriginal) {
      msg.displayText = msg.originalText;
    } else {
      msg.displayText = msg.translatedText;
    }
    this.messages = [...this.messages];
    this.cdr.detectChanges();
    
    setTimeout(() => {
      if (this.msgContainer && this.scrollPositionBeforeUpdate > 0) {
        this.msgContainer.nativeElement.scrollTop = this.scrollPositionBeforeUpdate;
      }
    }, 50);
  }

  setReply(msg: any) {
    this.scrollPositionBeforeUpdate = this.msgContainer?.nativeElement?.scrollTop || 0;
    this.replyTo = msg;
    
    setTimeout(() => {
      if (this.msgContainer && this.scrollPositionBeforeUpdate > 0) {
        this.msgContainer.nativeElement.scrollTop = this.scrollPositionBeforeUpdate;
      }
    }, 50);
  }

  cancelReply() {
    this.scrollPositionBeforeUpdate = this.msgContainer?.nativeElement?.scrollTop || 0;
    this.replyTo = null;
    
    setTimeout(() => {
      if (this.msgContainer && this.scrollPositionBeforeUpdate > 0) {
        this.msgContainer.nativeElement.scrollTop = this.scrollPositionBeforeUpdate;
      }
    }, 50);
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    if (this.isSending) return;

    const messageText = this.newMessage;
    
    const tempMsg = {
      id: Date.now(),
      sender: 'me',
      text: messageText,
      translatedText: messageText,
      originalText: messageText,
      displayText: messageText,
      showOriginal: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toDateString(),
      isPending: true
    };
    
    this.messages = [...this.messages, tempMsg];
    this.scrollToBottom();
    this.cdr.detectChanges();
    
    this.newMessage = '';
    this.isSending = true;

    this.chatHubService.sendMessage(this.activeChat, messageText, this.targetLang);
    
    setTimeout(() => {
      this.isSending = false;
    }, 1000);
  }

  onTyping() {
    if (this.activeChat) {
      this.chatHubService.typing(this.activeChat);
    }
  }

  searchMessages() {
    if (!this.searchText) return;
    const found = this.messages.filter(m => 
      m.text?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      m.originalText?.toLowerCase().includes(this.searchText.toLowerCase())
    );
    alert(`Found ${found.length} messages`);
  }

  clearChat() {
    if (confirm('Clear all messages?')) {
      this.messages = [];
      this.cdr.detectChanges();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.msgContainer) {
        this.msgContainer.nativeElement.scrollTop = this.msgContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  trackByMsgId(index: number, msg: any): number {
    return msg.id;
  }

  logout() {
    this.authService.logout();
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }
}