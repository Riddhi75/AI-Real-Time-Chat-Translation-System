import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from '../../src/app/chat/chat.component';
import { AuthService } from '../../src/app/services/auth.service';
import { UserService } from '../../src/app/services/user.service';
import { MessageService } from '../../src/app/services/message.service';
import { ChatHubService } from '../../src/app/services/chat-hub.service';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, FormsModule],
      providers: [AuthService, UserService, MessageService, ChatHubService]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});