import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public isDarkThemeSubject = new BehaviorSubject<boolean>(true); // Default to dark theme
  isDarkTheme$ = this.isDarkThemeSubject.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem('theme');

    // If there is a saved theme, use it. Otherwise, default to dark theme.
    if (savedTheme) {
      this.isDarkThemeSubject.next(savedTheme === 'dark');
    } else {
      localStorage.setItem('theme', 'dark'); // Set dark as the default in localStorage
    }

    // Apply the theme based on the stored preference or default
    this.applyTheme(this.isDarkThemeSubject.value);
  }

  toggleTheme() {
    const isDarkTheme = !this.isDarkThemeSubject.value;
    this.isDarkThemeSubject.next(isDarkTheme);
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    this.applyTheme(isDarkTheme);
  }

  applyTheme(isDarkTheme: boolean) {
    const body = document.body;
    if (isDarkTheme) {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
    } else {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      this.setRandomLightThemeColors();
    }
  }

  private setRandomLightThemeColors() {
    const randomBgColor = this.getRandomColor();
    const randomTextColor = this.getRandomColor();

    document.documentElement.style.setProperty('--bg-color', randomBgColor);
    document.documentElement.style.setProperty('--text-color', randomTextColor);
  }

  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
