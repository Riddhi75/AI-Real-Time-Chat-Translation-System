import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, FormsModule], 
  standalone: true
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit() {
  
    this.errorMessage = '';
    
   
    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'Please fill all fields';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.password.length < 4) {
      this.errorMessage = 'Password must be at least 4 characters';
      return;
    }

   
    this.isLoading = true;

    // Call register API
    this.authService.register({ 
      username: this.username, 
      email: this.email, 
      password: this.password 
    }).subscribe({
      next: (response: any) => {
        // Redirect to login page after successful registration
        this.router.navigate(['/login']);
        this.isLoading = false;
      },
      error: (error) => {
        // Show error message
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}