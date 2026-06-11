import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule], 
  standalone: true
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit() {
  this.authService.login({ email: this.email, password: this.password }).subscribe({
    next: (response: any) => {
      console.log('Login response:', response);
      
    
      this.authService.saveToken(response.token);
      
      
      localStorage.setItem('userId', response.userId.toString());
      localStorage.setItem('username', response.username);
      
      console.log('Saved userId to localStorage:', response.userId);
      
      this.router.navigate(['/chat']);
    },
    error: (error) => {
      this.errorMessage = 'Login failed';
    }
  });
}
}