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
