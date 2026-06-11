import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false  // ← ADD THIS LINE
})
export class AppComponent {
  title = 'AI Chat Translation System';
}