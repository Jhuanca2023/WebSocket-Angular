import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { UiService } from './core/services/ui.service';
import { filter } from 'rxjs/operators';

import { ProfileEditorComponent } from './features/profile/profile';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, ProfileEditorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  public themeService = inject(ThemeService);
  public authService = inject(AuthService);
  public uiService = inject(UiService);
  private router = inject(Router);
  showNavbar = true;

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      // Ocultar navbar en salas y chat
      this.showNavbar = !url.includes('/rooms') && !url.includes('/chat');
    });
  }

  logout() {
    this.authService.logout();
  }
}
