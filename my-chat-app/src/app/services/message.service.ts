import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getConversation(userId: number): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.apiUrl}/Messages/conversation/${userId}`, { headers });
  }

  sendMessage(receiverId: number, message: string, targetLanguage: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/Messages/send`, {
      receiverId: receiverId,
      message: message,
      targetLanguage: targetLanguage
    }, { headers });
  }

  deleteMessage(messageId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.apiUrl}/Messages/${messageId}`, { headers });
  }

  editMessage(messageId: number, newText: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrl}/Messages/${messageId}`, { text: newText }, { headers });
  }

  // ✅ PER-MESSAGE TRANSLATION API
  translateMessage(messageId: number, targetLanguage: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/Messages/translate/${messageId}`, 
      { targetLanguage }, { headers });
  }
}