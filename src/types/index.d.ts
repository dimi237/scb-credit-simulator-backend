interface SampleData {
  _id?: ObjectId;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  type?: 'welcome' | 'notification' | 'custom';
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}
