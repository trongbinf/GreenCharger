import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface ProductInfo {
  name: string;
  price: number;
  finalPrice?: number;
  categoryName: string;
  description?: string;
  quantityInStock: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
  private readonly apiKey = environment.geminiApiKey;

  constructor(private http: HttpClient) {}

  generateProductResponse(userMessage: string, product: ProductInfo): Observable<string> {
    if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
      return throwError(() => new Error('API key not configured'));
    }

    const productContext = `
      Sản phẩm: ${product.name}
      Giá gốc: ${this.formatCurrency(product.price)}
      Giá khuyến mãi: ${product.finalPrice ? this.formatCurrency(product.finalPrice) : 'Không có'}
      Danh mục: ${product.categoryName}
      Mô tả: ${product.description || 'Chưa có mô tả chi tiết'}
      Tình trạng: ${product.quantityInStock > 0 ? 'Còn hàng' : 'Hết hàng'}
      Số lượng còn lại: ${product.quantityInStock} sản phẩm
    `;

    const systemPrompt = `Bạn là Green Charger AI, trợ lý tư vấn sản phẩm chuyên nghiệp. 
    CHỈ trả lời các câu hỏi liên quan đến sản phẩm này. KHÔNG trả lời các câu hỏi không liên quan.
    
    Thông tin sản phẩm:
    ${productContext}
    
    Quy tắc nghiêm ngặt:
    - CHỈ trả lời câu hỏi về sản phẩm này
    - Nếu câu hỏi không liên quan đến sản phẩm, trả lời: "Xin lỗi, tôi chỉ có thể tư vấn về sản phẩm này. Bạn có câu hỏi gì về sản phẩm không?"
    - Trả lời bằng tiếng Việt
    - Thân thiện và chuyên nghiệp
    - Cung cấp thông tin chính xác về sản phẩm
    - Luôn kết thúc bằng: "Để được tư vấn chi tiết, vui lòng liên hệ qua chúng tôi."
    - Giữ câu trả lời ngắn gọn, dễ hiểu
    - Luôn ký tên "Green Charger AI" ở cuối mỗi câu trả lời`;

    const requestBody = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nKhách hàng hỏi: ${userMessage}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    };

    return this.http.post<GeminiResponse>(`${this.apiUrl}?key=${this.apiKey}`, requestBody, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      map(response => {
        if (response && response.candidates && response.candidates[0] && response.candidates[0].content) {
          return response.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Invalid response format');
        }
      }),
      catchError(error => {
        console.error('Gemini API Error:', error);
        return throwError(() => error);
      })
    );
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  }
}
