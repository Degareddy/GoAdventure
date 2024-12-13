import { ErrorHandler, Injectable, Injector } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandlerService implements ErrorHandler {

  constructor(private injector: Injector) {}

  handleError(error: any): void {
    if (this.isChunkLoadError(error)) {
      window.location.reload(); // Force reload the page
      // Alternatively, you could display a user-friendly message and ask them to reload manually.
    } else {
      // Handle other errors
      console.error('An error occurred:', error);
    }
  }

  private isChunkLoadError(error: any): boolean {
    return /Loading chunk [\d]+ failed/.test(error.message);
  }
}
