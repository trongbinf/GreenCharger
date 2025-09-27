import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { importProvidersFrom } from '@angular/core';
import { QuillModule } from 'ngx-quill';

import { routes } from './app.routes';

// Đăng ký locale tiếng Việt
registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'vi' },
    importProvidersFrom(QuillModule.forRoot())
  ]
};
