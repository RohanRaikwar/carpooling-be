import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

class AxiosClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
    });
  }

  /**
   * Makes an axios request and returns raw data.
   * Throws an error if request fails.
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const res = await this.client.request<T>(config);
      return res.data; // only raw data
    } catch (err) {
      // flatten error to a simple Error object
      let message = 'Unknown error occurred';
      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      throw new Error(message); // just throw error
    }
  }
}

export const axiosClient = new AxiosClient();
